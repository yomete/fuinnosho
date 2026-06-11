import Foundation

struct Film: Identifiable, Codable, Hashable {
  let id: UUID
  var name: String
  var brand: String
  var iso: Int
  var format: String
  var type: String
  var expirationDate: String?
  var createdAt: String?
  var updatedAt: String?
  var userId: String?
  var price: Double?
  var count: Int?
  var notes: String?
  var editingNotes: String?
  var isECN: Bool?
  var deletedAt: String?
  var isBulkFilm: Bool?
  var bulkLengthMeters: Double?
  var bulkQuantity: Int?
  var bulkRollsUsed: Int?
  var calculatedRolls: Int?
  var bulkRemainingExposures: Int?
  var spooledCassettes: Int?
  var totalCount: Int?
  var reservedQuantity: Int?
  var availableCount: Int?

  enum CodingKeys: String, CodingKey {
    case id
    case name
    case brand
    case iso
    case format
    case type
    case expirationDate = "expiration_date"
    case createdAt = "created_at"
    case updatedAt = "updated_at"
    case userId = "user_id"
    case price
    case count
    case notes
    case editingNotes = "editing_notes"
    case isECN = "is_ecn"
    case deletedAt = "deleted_at"
    case isBulkFilm = "is_bulk_film"
    case bulkLengthMeters = "bulk_length_meters"
    case bulkQuantity = "bulk_quantity"
    case bulkRollsUsed = "bulk_rolls_used"
    case calculatedRolls = "calculated_rolls"
    case bulkRemainingExposures = "bulk_remaining_exposures"
    case spooledCassettes = "spooled_cassettes"
    case totalCount = "total_count"
    case reservedQuantity = "reserved_quantity"
    case availableCount = "available_count"
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    id = try container.decode(UUID.self, forKey: .id)
    name = try container.decode(String.self, forKey: .name)
    brand = try container.decode(String.self, forKey: .brand)
    iso = try container.decode(Int.self, forKey: .iso)
    format = try container.decode(String.self, forKey: .format)
    type = try container.decode(String.self, forKey: .type)
    expirationDate = try container.decodeIfPresent(String.self, forKey: .expirationDate)
    createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
    updatedAt = try container.decodeIfPresent(String.self, forKey: .updatedAt)
    userId = try container.decodeIfPresent(String.self, forKey: .userId)
    price = try container.decodeFlexibleDoubleIfPresent(forKey: .price)
    count = try container.decodeIfPresent(Int.self, forKey: .count)
    notes = try container.decodeIfPresent(String.self, forKey: .notes)
    editingNotes = try container.decodeIfPresent(String.self, forKey: .editingNotes)
    isECN = try container.decodeIfPresent(Bool.self, forKey: .isECN)
    deletedAt = try container.decodeIfPresent(String.self, forKey: .deletedAt)
    isBulkFilm = try container.decodeIfPresent(Bool.self, forKey: .isBulkFilm)
    bulkLengthMeters = try container.decodeFlexibleDoubleIfPresent(forKey: .bulkLengthMeters)
    bulkQuantity = try container.decodeIfPresent(Int.self, forKey: .bulkQuantity)
    bulkRollsUsed = try container.decodeIfPresent(Int.self, forKey: .bulkRollsUsed)
    calculatedRolls = try container.decodeIfPresent(Int.self, forKey: .calculatedRolls)
    bulkRemainingExposures = try container.decodeIfPresent(Int.self, forKey: .bulkRemainingExposures)
    spooledCassettes = try container.decodeIfPresent(Int.self, forKey: .spooledCassettes)
    totalCount = try container.decodeIfPresent(Int.self, forKey: .totalCount)
    reservedQuantity = try container.decodeIfPresent(Int.self, forKey: .reservedQuantity)
    availableCount = try container.decodeIfPresent(Int.self, forKey: .availableCount)
  }
}

struct NewFilm: Encodable {
  var name: String
  var brand: String
  var iso: Int
  var format: String
  var type: String
  var expirationDate: String
  var price: Double?
  var count: Int
  var notes: String?
  var editingNotes: String?
  var isECN: Bool
  var isBulkFilm: Bool
  var bulkLengthMeters: Double?
  var bulkQuantity: Int?
  var calculatedRolls: Int?
  var bulkRemainingExposures: Int?
  var spooledCassettes: Int?
  var userId: String

  enum CodingKeys: String, CodingKey {
    case name
    case brand
    case iso
    case format
    case type
    case expirationDate = "expiration_date"
    case price
    case count
    case notes
    case editingNotes = "editing_notes"
    case isECN = "is_ecn"
    case isBulkFilm = "is_bulk_film"
    case bulkLengthMeters = "bulk_length_meters"
    case bulkQuantity = "bulk_quantity"
    case calculatedRolls = "calculated_rolls"
    case bulkRemainingExposures = "bulk_remaining_exposures"
    case spooledCassettes = "spooled_cassettes"
    case userId = "user_id"
  }
}

struct FilmUpdate: Encodable {
  var name: String
  var brand: String
  var iso: Int
  var format: String
  var type: String
  var expirationDate: String
  var price: Double?
  var count: Int
  var notes: String?
  var editingNotes: String?
  var isECN: Bool
  var isBulkFilm: Bool
  var bulkLengthMeters: Double?
  var bulkQuantity: Int?
  var calculatedRolls: Int?
  var bulkRemainingExposures: Int?
  var spooledCassettes: Int?

  enum CodingKeys: String, CodingKey {
    case name
    case brand
    case iso
    case format
    case type
    case expirationDate = "expiration_date"
    case price
    case count
    case notes
    case editingNotes = "editing_notes"
    case isECN = "is_ecn"
    case isBulkFilm = "is_bulk_film"
    case bulkLengthMeters = "bulk_length_meters"
    case bulkQuantity = "bulk_quantity"
    case calculatedRolls = "calculated_rolls"
    case bulkRemainingExposures = "bulk_remaining_exposures"
    case spooledCassettes = "spooled_cassettes"
  }
}
