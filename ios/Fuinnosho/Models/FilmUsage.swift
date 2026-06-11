import Foundation

struct FilmUsage: Identifiable, Codable, Hashable {
  let id: UUID
  var filmId: UUID
  var quantity: Int
  var usageNote: String?
  var usageType: String?
  var exposuresUsed: Int?
  var tripId: UUID?
  var createdAt: String?

  enum CodingKeys: String, CodingKey {
    case id
    case filmId = "film_id"
    case quantity
    case usageNote = "usage_note"
    case usageType = "usage_type"
    case exposuresUsed = "exposures_used"
    case tripId = "trip_id"
    case createdAt = "created_at"
  }
}

struct NewFilmUsage: Encodable {
  var filmId: String
  var quantity: Int
  var usageNote: String
  var usageType: String
  var tripId: String?
  var exposuresUsed: Int? = nil

  enum CodingKeys: String, CodingKey {
    case filmId = "film_id"
    case quantity
    case usageNote = "usage_note"
    case usageType = "usage_type"
    case tripId = "trip_id"
    case exposuresUsed = "exposures_used"
  }
}

struct FilmCountState: Decodable {
  var count: Int?
  var isBulkFilm: Bool?
  var spooledCassettes: Int?

  enum CodingKeys: String, CodingKey {
    case count
    case isBulkFilm = "is_bulk_film"
    case spooledCassettes = "spooled_cassettes"
  }
}

struct FilmCountUpdate: Encodable {
  var count: Int
  var spooledCassettes: Int?

  enum CodingKeys: String, CodingKey {
    case count
    case spooledCassettes = "spooled_cassettes"
  }
}

struct FilmDeletedAtUpdate: Encodable {
  var deletedAt: String?

  enum CodingKeys: String, CodingKey {
    case deletedAt = "deleted_at"
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(deletedAt, forKey: .deletedAt)
  }
}

struct BulkFilmState: Decodable {
  var count: Int?
  var isBulkFilm: Bool?
  var bulkRemainingExposures: Int?
  var spooledCassettes: Int?

  enum CodingKeys: String, CodingKey {
    case count
    case isBulkFilm = "is_bulk_film"
    case bulkRemainingExposures = "bulk_remaining_exposures"
    case spooledCassettes = "spooled_cassettes"
  }
}

struct BulkFilmSpoolUpdate: Encodable {
  var count: Int
  var bulkRemainingExposures: Int
  var spooledCassettes: Int

  enum CodingKeys: String, CodingKey {
    case count
    case bulkRemainingExposures = "bulk_remaining_exposures"
    case spooledCassettes = "spooled_cassettes"
  }
}

struct BulkRollState: Decodable {
  var isBulkFilm: Bool?
  var bulkQuantity: Int?
  var bulkRollsUsed: Int?

  enum CodingKeys: String, CodingKey {
    case isBulkFilm = "is_bulk_film"
    case bulkQuantity = "bulk_quantity"
    case bulkRollsUsed = "bulk_rolls_used"
  }
}

struct BulkRollUpdate: Encodable {
  var bulkRollsUsed: Int

  enum CodingKeys: String, CodingKey {
    case bulkRollsUsed = "bulk_rolls_used"
  }
}

struct TripStatusUpdate: Encodable {
  var status: TripStatus
}
