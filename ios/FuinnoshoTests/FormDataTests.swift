import XCTest
@testable import Fuinnosho

final class FormDataTests: XCTestCase {
  func testFilmDecodesStringDecimalFields() throws {
    let json = """
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "name": "Portra 400",
      "brand": "Kodak",
      "iso": 400,
      "format": "35mm",
      "type": "Color Negative",
      "price": "18.75",
      "count": 4,
      "is_bulk_film": true,
      "bulk_length_meters": "30.50"
    }
    """

    let film = try JSONDecoder().decode(Film.self, from: Data(json.utf8))

    XCTAssertEqual(film.price, 18.75)
    XCTAssertEqual(film.bulkLengthMeters, 30.50)
  }

  func testTripDecodesMissingOptionalDisplayFields() throws {
    let json = """
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "title": "Usedom Island",
      "start_date": "2025-08-02",
      "end_date": "2025-08-02",
      "user_id": "335461ec-7719-4c39-b023-c600e11d308c",
      "trip_films": [
        { "quantity": 2 },
        { "quantity": 3 }
      ]
    }
    """

    let row = try JSONDecoder().decode(TripListRow.self, from: Data(json.utf8))

    XCTAssertEqual(row.trip.description, "")
    XCTAssertEqual(row.trip.status, .upcoming)
    XCTAssertEqual(row.tripFilms?.reduce(0) { $0 + $1.quantity }, 5)
  }

  func testGearDecodesStringPurchasePrice() throws {
    let json = """
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "M6",
      "brand": "Leica",
      "type": "camera",
      "purchase_price": "2800.50",
      "condition": "excellent",
      "notes": ""
    }
    """

    let gear = try JSONDecoder().decode(Gear.self, from: Data(json.utf8))

    XCTAssertEqual(gear.purchasePrice, 2800.50)
  }

  @MainActor
  func testInventoryServiceDescribeIncludesDecodingContext() {
    let json = """
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "M6",
      "brand": "Leica",
      "type": "unknown",
      "condition": "excellent"
    }
    """

    XCTAssertThrowsError(try JSONDecoder().decode(Gear.self, from: Data(json.utf8))) { error in
      let message = InventoryService.describe(error)

      XCTAssertTrue(message.contains("Data corrupted at type"))
      XCTAssertTrue(message.contains("Cannot initialize GearType"))
    }
  }

  func testFilmFormOnlyIncludesOptionalFieldsWhenPresent() {
    var form = FilmFormData()

    XCTAssertNil(form.optionalPrice)
    XCTAssertNil(form.optionalBulkLengthMeters)
    XCTAssertNil(form.optionalBulkQuantity)
    XCTAssertNil(form.optionalCalculatedRolls)
    XCTAssertNil(form.optionalBulkRemainingExposures)
    XCTAssertNil(form.optionalSpooledCassettes)

    form.price = 12.5
    form.isBulkFilm = true

    XCTAssertEqual(form.optionalPrice, 12.5)
    XCTAssertEqual(form.optionalBulkLengthMeters, 30.5)
    XCTAssertEqual(form.optionalBulkQuantity, 1)
    XCTAssertEqual(form.optionalCalculatedRolls, 18)
    XCTAssertEqual(form.optionalBulkRemainingExposures, 648)
    XCTAssertEqual(form.optionalSpooledCassettes, 0)
  }

  func testGearFormOnlyIncludesOptionalFieldsWhenPresent() {
    var form = GearFormData()

    XCTAssertNil(form.optionalModel)
    XCTAssertNil(form.optionalSerialNumber)
    XCTAssertNil(form.optionalPurchaseDate)
    XCTAssertNil(form.optionalPurchasePrice)

    form.model = "M6"
    form.serialNumber = "123"
    form.purchaseDate = "2026-05-25"
    form.purchasePrice = 1000

    XCTAssertEqual(form.optionalModel, "M6")
    XCTAssertEqual(form.optionalSerialNumber, "123")
    XCTAssertEqual(form.optionalPurchaseDate, "2026-05-25")
    XCTAssertEqual(form.optionalPurchasePrice, 1000)
  }

  func testGearFormOnlyIncludesCameraForLenses() {
    let cameraId = UUID()
    var form = GearFormData()

    form.cameraId = cameraId
    XCTAssertNil(form.optionalCameraId)

    form.type = .lens
    XCTAssertEqual(form.optionalCameraId, cameraId.uuidString)
  }
}
