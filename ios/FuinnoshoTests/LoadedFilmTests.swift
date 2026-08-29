import XCTest
@testable import Fuinnosho

final class LoadedFilmTests: XCTestCase {
  func testCameraLoadStatesPairEachCameraWithItsRoll() {
    let f3 = makeGear(name: "F3", brand: "Nikon", type: .camera)
    let mju = makeGear(name: "mju-II", brand: "Olympus", type: .camera)
    let lens = makeGear(name: "Nokton 40mm", brand: "Voigtländer", type: .lens)
    let roll = makeLoadedFilm(cameraId: f3.id)

    let states = LoadedFilmDisplay.cameraLoadStates(
      cameras: [f3, mju, lens],
      loaded: [roll]
    )

    XCTAssertEqual(states.count, 2, "Lenses are not cameras and must be excluded")
    XCTAssertEqual(states[0].loaded?.id, roll.id)
    XCTAssertNil(states[1].loaded)
  }

  func testOnlyFilmWithAvailableRollsCanBeLoaded() {
    let available = makeFilm(availableCount: 3)
    let held = makeFilm(availableCount: 0)
    let deleted = makeFilm(availableCount: 2, deletedAt: "2026-01-01")

    let loadable = LoadedFilmDisplay.filmsAvailableToLoad([available, held, deleted])

    XCTAssertEqual(loadable.map(\.id), [available.id])
  }

  func testSpooledBulkCassettesAreLoadable() {
    let bulk = makeFilm(availableCount: 4, isBulkFilm: true)

    XCTAssertEqual(LoadedFilmDisplay.filmsAvailableToLoad([bulk]).count, 1)
  }

  func testISOPrefillKeepsTheMostRecentValuePerStock() {
    let portra = UUID()
    let hp5 = UUID()

    let prefills = LoadedFilmDisplay.isoPrefills(from: [
      LoadedFilmISOHistory(filmId: portra, shotAtISO: 800, loadedAt: "2026-08-01T10:00:00Z"),
      LoadedFilmISOHistory(filmId: portra, shotAtISO: 400, loadedAt: "2026-06-01T10:00:00Z"),
      LoadedFilmISOHistory(filmId: hp5, shotAtISO: 1600, loadedAt: "2026-05-01T10:00:00Z"),
    ])

    XCTAssertEqual(prefills[portra], 800)
    XCTAssertEqual(prefills[hp5], 1600)
  }

  func testUsageNoteRecordsTheCameraAndAPushedEI() {
    let entry = makeLoadedFilm(shotAtISO: 800)

    XCTAssertEqual(LoadedFilmDisplay.usageNote(for: entry), "Shot in Nikon F3 @ EI 800")
  }

  func testUsageNoteOmitsTheEIAtBoxSpeed() {
    let entry = makeLoadedFilm(shotAtISO: 400)

    XCTAssertEqual(LoadedFilmDisplay.usageNote(for: entry), "Shot in Nikon F3")
  }

  func testUsageNoteAppendsTheRollNote() {
    let entry = makeLoadedFilm(shotAtISO: 400, notes: "harbour walk")

    XCTAssertEqual(
      LoadedFilmDisplay.usageNote(for: entry),
      "Shot in Nikon F3 — harbour walk"
    )
  }

  func testTimestampParsesWithAndWithoutFractionalSeconds() {
    XCTAssertNotNil(LoadedFilmDisplay.timestamp(from: "2026-08-29T10:00:00Z"))
    XCTAssertNotNil(LoadedFilmDisplay.timestamp(from: "2026-08-29T10:00:00.123Z"))
    XCTAssertNil(LoadedFilmDisplay.timestamp(from: "not a date"))
  }

  func testLoadedDescriptionCallsOutToday() {
    let entry = makeLoadedFilm(loadedAt: LoadedFilmDisplay.isoTimestamp())

    XCTAssertEqual(LoadedFilmDisplay.loadedDescription(for: entry), "Loaded today")
  }

  // MARK: - Fixtures

  private func makeGear(name: String, brand: String, type: GearType) -> Gear {
    let json = """
    {
      "id": "\(UUID().uuidString)",
      "name": "\(name)",
      "brand": "\(brand)",
      "type": "\(type.rawValue)",
      "condition": "good"
    }
    """

    // Gear has a custom decoder, so build it the way the network layer does.
    return try! JSONDecoder().decode(Gear.self, from: Data(json.utf8))
  }

  private func makeFilm(
    availableCount: Int,
    isBulkFilm: Bool = false,
    deletedAt: String? = nil
  ) -> Film {
    let deleted = deletedAt.map { "\"\($0)\"" } ?? "null"
    let json = """
    {
      "id": "\(UUID().uuidString)",
      "name": "Portra 400",
      "brand": "Kodak",
      "iso": 400,
      "format": "35mm",
      "type": "color negative",
      "available_count": \(availableCount),
      "is_bulk_film": \(isBulkFilm),
      "deleted_at": \(deleted)
    }
    """

    return try! JSONDecoder().decode(Film.self, from: Data(json.utf8))
  }

  private func makeLoadedFilm(
    cameraId: UUID = UUID(),
    shotAtISO: Int? = 800,
    notes: String? = nil,
    loadedAt: String = "2026-08-01T10:00:00Z"
  ) -> LoadedFilm {
    LoadedFilm(
      id: UUID(),
      cameraId: cameraId,
      filmId: UUID(),
      userId: UUID().uuidString,
      shotAtISO: shotAtISO,
      notes: notes,
      loadedAt: loadedAt,
      unloadedAt: nil,
      outcome: nil,
      camera: LoadedCamera(id: cameraId, name: "F3", brand: "Nikon", model: "HP"),
      film: LoadedFilmStock(
        id: UUID(),
        name: "Portra 400",
        brand: "Kodak",
        iso: 400,
        format: "35mm",
        type: "color negative",
        expirationDate: nil,
        isBulkFilm: false
      )
    )
  }
}

final class LoadedFilmUnloadUpdateTests: XCTestCase {
  func testUnloadUpdateAlwaysWritesBothColumns() throws {
    let payload = LoadedFilmUnloadUpdate(unloadedAt: nil, outcome: nil)
    let data = try JSONEncoder().encode(payload)
    let json = try XCTUnwrap(
      JSONSerialization.jsonObject(with: data) as? [String: Any]
    )

    // A rollback has to send explicit nulls; an empty object would leave the
    // roll unloaded with its stock never consumed.
    XCTAssertTrue(json.keys.contains("unloaded_at"))
    XCTAssertTrue(json.keys.contains("outcome"))
    XCTAssertTrue(json["unloaded_at"] is NSNull)
    XCTAssertTrue(json["outcome"] is NSNull)
  }

  func testUnloadUpdateWritesValuesWhenPresent() throws {
    let payload = LoadedFilmUnloadUpdate(unloadedAt: "2026-08-29T10:00:00.000Z", outcome: "shot")
    let data = try JSONEncoder().encode(payload)
    let json = try XCTUnwrap(
      JSONSerialization.jsonObject(with: data) as? [String: Any]
    )

    XCTAssertEqual(json["unloaded_at"] as? String, "2026-08-29T10:00:00.000Z")
    XCTAssertEqual(json["outcome"] as? String, "shot")
  }
}
