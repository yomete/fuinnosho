import Foundation

/// Pure presentation and bookkeeping rules for loaded film, kept out of the
/// views and the network layer so they can be tested directly.
enum LoadedFilmDisplay {
  /// Pairs every camera with the roll inside it, preserving camera order.
  static func cameraLoadStates(
    cameras: [Gear],
    loaded: [LoadedFilm]
  ) -> [CameraLoadState] {
    let loadedByCamera = Dictionary(
      loaded.map { ($0.cameraId, $0) },
      uniquingKeysWith: { first, _ in first }
    )

    return cameras.filter { $0.type == .camera }.map { gear in
      CameraLoadState(
        camera: LoadedCamera(
          id: gear.id,
          name: gear.name,
          brand: gear.brand,
          model: gear.model
        ),
        loaded: loadedByCamera[gear.id]
      )
    }
  }

  /// Film that can go into a camera right now. `availableCount` already nets
  /// out trip reservations and rolls held in other cameras, and resolves to
  /// spooled cassettes for bulk film, so one filter covers every case.
  static func filmsAvailableToLoad(_ films: [Film]) -> [Film] {
    films.filter { $0.deletedAt == nil && ($0.availableCount ?? 0) > 0 }
  }

  /// The EI each stock was most recently loaded at. Rows are expected newest
  /// first, matching the query's ordering.
  static func isoPrefills(from history: [LoadedFilmISOHistory]) -> [UUID: Int] {
    var prefills: [UUID: Int] = [:]

    for row in history {
      guard let shotAtISO = row.shotAtISO, prefills[row.filmId] == nil else { continue }
      prefills[row.filmId] = shotAtISO
    }

    return prefills
  }

  /// The note written to `film_usage` when a roll is unloaded as shot.
  static func usageNote(for entry: LoadedFilm) -> String {
    let cameraLabel = entry.camera?.displayName ?? "a camera"
    var headline = "Shot in \(cameraLabel)"

    if entry.isPushedOrPulled, let shotAtISO = entry.shotAtISO {
      headline += " @ EI \(shotAtISO)"
    }

    guard let notes = entry.notes, !notes.isEmpty else {
      return headline
    }

    return "\(headline) — \(notes)"
  }

  /// Postgres timestamptz arrives with or without fractional seconds.
  static func timestamp(from value: String) -> Date? {
    let withFractionalSeconds = ISO8601DateFormatter()
    withFractionalSeconds.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    if let date = withFractionalSeconds.date(from: value) {
      return date
    }

    let plain = ISO8601DateFormatter()
    plain.formatOptions = [.withInternetDateTime]

    return plain.date(from: value)
  }

  static func loadedDescription(for entry: LoadedFilm, now: Date = Date()) -> String {
    guard let loadedAt = timestamp(from: entry.loadedAt) else {
      return "Loaded"
    }

    if Calendar.current.isDateInToday(loadedAt) {
      return "Loaded today"
    }

    let relative = RelativeDateTimeFormatter()
    relative.unitsStyle = .full

    return "Loaded \(relative.localizedString(for: loadedAt, relativeTo: now))"
  }

  static func isoTimestamp(_ date: Date = Date()) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    return formatter.string(from: date)
  }
}
