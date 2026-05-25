import Foundation

enum GearType: String, Codable, CaseIterable, Identifiable {
  case camera
  case lens
  case flash
  case accessory
  case tripod
  case filter
  case bag

  var id: String { rawValue }
}

enum GearCondition: String, Codable, CaseIterable, Identifiable {
  case excellent
  case good
  case fair
  case poor

  var id: String { rawValue }
}

struct Gear: Identifiable, Codable, Hashable {
  let id: UUID
  var name: String
  var brand: String
  var type: GearType
  var model: String?
  var serialNumber: String?
  var purchaseDate: String?
  var purchasePrice: Double?
  var condition: GearCondition
  var notes: String?
  var cameraId: UUID?
  var createdAt: String?
  var updatedAt: String?
  var userId: String?

  enum CodingKeys: String, CodingKey {
    case id
    case name
    case brand
    case type
    case model
    case serialNumber = "serial_number"
    case purchaseDate = "purchase_date"
    case purchasePrice = "purchase_price"
    case condition
    case notes
    case cameraId = "camera_id"
    case createdAt = "created_at"
    case updatedAt = "updated_at"
    case userId = "user_id"
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    id = try container.decode(UUID.self, forKey: .id)
    name = try container.decode(String.self, forKey: .name)
    brand = try container.decode(String.self, forKey: .brand)
    type = try container.decode(GearType.self, forKey: .type)
    model = try container.decodeIfPresent(String.self, forKey: .model)
    serialNumber = try container.decodeIfPresent(String.self, forKey: .serialNumber)
    purchaseDate = try container.decodeIfPresent(String.self, forKey: .purchaseDate)
    purchasePrice = try container.decodeFlexibleDoubleIfPresent(forKey: .purchasePrice)
    condition = try container.decode(GearCondition.self, forKey: .condition)
    notes = try container.decodeIfPresent(String.self, forKey: .notes)
    cameraId = try container.decodeIfPresent(UUID.self, forKey: .cameraId)
    createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
    updatedAt = try container.decodeIfPresent(String.self, forKey: .updatedAt)
    userId = try container.decodeIfPresent(String.self, forKey: .userId)
  }
}

extension KeyedDecodingContainer {
  func decodeFlexibleDoubleIfPresent(forKey key: Key) throws -> Double? {
    if let value = try? decodeIfPresent(Double.self, forKey: key) {
      return value
    }

    if let value = try? decodeIfPresent(String.self, forKey: key) {
      return Double(value)
    }

    return nil
  }
}

struct NewGear: Encodable {
  var name: String
  var brand: String
  var type: GearType
  var model: String?
  var serialNumber: String?
  var purchaseDate: String?
  var purchasePrice: Double?
  var condition: GearCondition
  var notes: String?
  var cameraId: String?
  var userId: String

  enum CodingKeys: String, CodingKey {
    case name
    case brand
    case type
    case model
    case serialNumber = "serial_number"
    case purchaseDate = "purchase_date"
    case purchasePrice = "purchase_price"
    case condition
    case notes
    case cameraId = "camera_id"
    case userId = "user_id"
  }
}

struct GearUpdate: Encodable {
  var name: String
  var brand: String
  var type: GearType
  var model: String?
  var serialNumber: String?
  var purchaseDate: String?
  var purchasePrice: Double?
  var condition: GearCondition
  var notes: String?
  var cameraId: String?

  enum CodingKeys: String, CodingKey {
    case name
    case brand
    case type
    case model
    case serialNumber = "serial_number"
    case purchaseDate = "purchase_date"
    case purchasePrice = "purchase_price"
    case condition
    case notes
    case cameraId = "camera_id"
  }
}
