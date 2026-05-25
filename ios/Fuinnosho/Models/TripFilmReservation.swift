import Foundation

struct TripFilmReservation: Identifiable, Codable, Hashable {
  let id: UUID
  var tripId: UUID
  var filmId: UUID
  var quantity: Int
  var createdAt: String?
  var film: ReservedFilm?

  enum CodingKeys: String, CodingKey {
    case id
    case tripId = "trip_id"
    case filmId = "film_id"
    case quantity
    case createdAt = "created_at"
    case film = "films"
  }
}

struct ReservedFilm: Identifiable, Codable, Hashable {
  let id: UUID
  var name: String
  var brand: String
  var iso: Int
  var format: String
  var type: String
}

struct NewTripFilmReservation: Encodable {
  var tripId: String
  var filmId: String
  var quantity: Int

  enum CodingKeys: String, CodingKey {
    case tripId = "trip_id"
    case filmId = "film_id"
    case quantity
  }
}

struct TripFilmQuantityUpdate: Encodable {
  var quantity: Int
}
