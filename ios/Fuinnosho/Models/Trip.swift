import Foundation

enum TripStatus: String, Codable, Hashable {
  case upcoming
  case ongoing
  case past
  case completed
}

struct Trip: Identifiable, Codable, Hashable {
  let id: UUID
  var title: String
  var description: String
  var startDate: String
  var endDate: String
  var createdAt: String?
  var updatedAt: String?
  var userId: String
  var status: TripStatus
  var reservedFilmCount: Int?

  enum CodingKeys: String, CodingKey {
    case id
    case title
    case description
    case startDate = "start_date"
    case endDate = "end_date"
    case createdAt = "created_at"
    case updatedAt = "updated_at"
    case userId = "user_id"
    case status
    case reservedFilmCount = "reserved_film_count"
  }

  init(
    id: UUID,
    title: String,
    description: String,
    startDate: String,
    endDate: String,
    createdAt: String?,
    updatedAt: String?,
    userId: String,
    status: TripStatus,
    reservedFilmCount: Int?
  ) {
    self.id = id
    self.title = title
    self.description = description
    self.startDate = startDate
    self.endDate = endDate
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.userId = userId
    self.status = status
    self.reservedFilmCount = reservedFilmCount
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    id = try container.decode(UUID.self, forKey: .id)
    title = try container.decode(String.self, forKey: .title)
    description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
    startDate = try container.decode(String.self, forKey: .startDate)
    endDate = try container.decode(String.self, forKey: .endDate)
    createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
    updatedAt = try container.decodeIfPresent(String.self, forKey: .updatedAt)
    userId = try container.decode(String.self, forKey: .userId)
    status = try container.decodeIfPresent(TripStatus.self, forKey: .status) ?? .upcoming
    reservedFilmCount = try container.decodeIfPresent(Int.self, forKey: .reservedFilmCount)
  }
}

struct NewTrip: Encodable {
  var title: String
  var description: String
  var startDate: String
  var endDate: String
  var status: TripStatus
  var userId: String

  enum CodingKeys: String, CodingKey {
    case title
    case description
    case startDate = "start_date"
    case endDate = "end_date"
    case status
    case userId = "user_id"
  }
}

struct TripUpdate: Encodable {
  var title: String
  var description: String
  var startDate: String
  var endDate: String

  enum CodingKeys: String, CodingKey {
    case title
    case description
    case startDate = "start_date"
    case endDate = "end_date"
  }
}

struct TripListRow: Decodable {
  var trip: Trip
  var tripFilms: [TripFilmQuantityRow]?

  init(from decoder: Decoder) throws {
    trip = try Trip(from: decoder)
    let container = try decoder.container(keyedBy: CodingKeys.self)
    tripFilms = try container.decodeIfPresent([TripFilmQuantityRow].self, forKey: .tripFilms)
  }

  private enum CodingKeys: String, CodingKey {
    case tripFilms = "trip_films"
  }
}

struct TripFilmQuantityRow: Decodable {
  var quantity: Int
}
