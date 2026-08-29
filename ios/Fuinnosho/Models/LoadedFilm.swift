import Foundation

enum UnloadOutcome: String, Codable, CaseIterable, Identifiable {
  case shot
  case unused

  var id: String { rawValue }

  var label: String {
    switch self {
    case .shot: "I shot it"
    case .unused: "I took it out unused"
    }
  }

  var explanation: String {
    switch self {
    case .shot: "Removes one roll from your inventory and logs it in your usage history."
    case .unused: "Puts the roll back on the shelf. Your count doesn't change."
    }
  }
}

struct LoadedCamera: Identifiable, Codable, Hashable {
  let id: UUID
  var name: String
  var brand: String
  var model: String?

  var displayName: String {
    "\(brand) \(name)".trimmingCharacters(in: .whitespaces)
  }
}

struct LoadedFilmStock: Identifiable, Codable, Hashable {
  let id: UUID
  var name: String
  var brand: String
  var iso: Int
  var format: String
  var type: String
  var expirationDate: String?
  var isBulkFilm: Bool?

  var displayName: String {
    "\(brand) \(name)".trimmingCharacters(in: .whitespaces)
  }

  enum CodingKeys: String, CodingKey {
    case id
    case name
    case brand
    case iso
    case format
    case type
    case expirationDate = "expiration_date"
    case isBulkFilm = "is_bulk_film"
  }
}

/// A roll currently sitting in a camera. The film stays in `films.count` until
/// it is unloaded as `shot`, but it is held out of `available_count` so the
/// same roll cannot also be reserved for a trip.
struct LoadedFilm: Identifiable, Codable, Hashable {
  let id: UUID
  var cameraId: UUID
  var filmId: UUID
  var userId: String?
  var shotAtISO: Int?
  var notes: String?
  var loadedAt: String
  var unloadedAt: String?
  var outcome: UnloadOutcome?
  var camera: LoadedCamera?
  var film: LoadedFilmStock?

  enum CodingKeys: String, CodingKey {
    case id
    case cameraId = "camera_id"
    case filmId = "film_id"
    case userId = "user_id"
    case shotAtISO = "shot_at_iso"
    case notes
    case loadedAt = "loaded_at"
    case unloadedAt = "unloaded_at"
    case outcome
    case camera
    case film
  }

  /// True when the roll is being shot at something other than box speed.
  var isPushedOrPulled: Bool {
    guard let shotAtISO, let boxSpeed = film?.iso else { return false }
    return shotAtISO != boxSpeed
  }
}

/// A camera paired with whatever is inside it right now.
struct CameraLoadState: Identifiable, Hashable {
  var camera: LoadedCamera
  var loaded: LoadedFilm?

  var id: UUID { camera.id }
}

struct NewLoadedFilm: Encodable {
  var cameraId: String
  var filmId: String
  var userId: String
  var shotAtISO: Int?
  var notes: String?

  enum CodingKeys: String, CodingKey {
    case cameraId = "camera_id"
    case filmId = "film_id"
    case userId = "user_id"
    case shotAtISO = "shot_at_iso"
    case notes
  }
}

struct LoadedFilmUnloadUpdate: Encodable {
  var unloadedAt: String?
  var outcome: String?

  enum CodingKeys: String, CodingKey {
    case unloadedAt = "unloaded_at"
    case outcome
  }

  /// Both columns are always written, including as JSON null. The synthesized
  /// encoder omits nil, which would turn the rollback of a failed unload into
  /// an empty update that quietly leaves the roll unloaded.
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)

    if let unloadedAt {
      try container.encode(unloadedAt, forKey: .unloadedAt)
    } else {
      try container.encodeNil(forKey: .unloadedAt)
    }

    if let outcome {
      try container.encode(outcome, forKey: .outcome)
    } else {
      try container.encodeNil(forKey: .outcome)
    }
  }
}

/// Just the EI history columns, for prefilling the next load of a stock.
struct LoadedFilmISOHistory: Decodable {
  var filmId: UUID
  var shotAtISO: Int?
  var loadedAt: String

  enum CodingKeys: String, CodingKey {
    case filmId = "film_id"
    case shotAtISO = "shot_at_iso"
    case loadedAt = "loaded_at"
  }
}

/// Minimal projection of `films_with_availability` for pre-write checks.
struct FilmAvailability: Decodable {
  var id: UUID
  var availableCount: Int?

  enum CodingKeys: String, CodingKey {
    case id
    case availableCount = "available_count"
  }
}
