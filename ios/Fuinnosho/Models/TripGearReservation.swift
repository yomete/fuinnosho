import Foundation

struct TripGearReservation: Identifiable, Codable, Hashable {
  let id: UUID
  var tripId: UUID
  var gearId: UUID
  var createdAt: String?
  var gear: Gear?

  enum CodingKeys: String, CodingKey {
    case id
    case tripId = "trip_id"
    case gearId = "gear_id"
    case createdAt = "created_at"
    case gear
  }
}

struct NewTripGearReservation: Encodable {
  var tripId: String
  var gearId: String

  enum CodingKeys: String, CodingKey {
    case tripId = "trip_id"
    case gearId = "gear_id"
  }
}

struct GearReservationSummary: Decodable {
  var trips: GearReservationTrip?
}

struct GearReservationTrip: Decodable {
  var title: String?
  var startDate: String?
  var endDate: String?

  enum CodingKeys: String, CodingKey {
    case title
    case startDate = "start_date"
    case endDate = "end_date"
  }
}
