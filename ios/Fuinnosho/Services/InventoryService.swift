import Foundation
import Supabase

@MainActor
struct InventoryService {
  private let supabase: SupabaseService

  init(supabase: SupabaseService = .shared) {
    self.supabase = supabase
  }

  func listFilms() async throws -> [Film] {
    let userId = try await supabase.currentUserId()

    let films: [Film] = try await supabase.client
      .from("films_with_availability")
      .select()
      .eq("user_id", value: userId)
      .order("created_at", ascending: false)
      .execute()
      .value

    return films.filter { $0.deletedAt == nil }
  }

  func createFilm(_ film: FilmFormData) async throws {
    let userId = try await supabase.currentUserId()
    let payload = NewFilm(
      name: film.name,
      brand: film.brand,
      iso: film.iso,
      format: film.format,
      type: film.type,
      expirationDate: film.expirationDate,
      price: film.optionalPrice,
      count: film.count,
      notes: film.notes.isEmpty ? nil : film.notes,
      editingNotes: film.editingNotes.isEmpty ? nil : film.editingNotes,
      isECN: film.isECN,
      isBulkFilm: film.isBulkFilm,
      bulkLengthMeters: film.optionalBulkLengthMeters,
      bulkQuantity: film.optionalBulkQuantity,
      calculatedRolls: film.optionalCalculatedRolls,
      bulkRemainingExposures: film.optionalBulkRemainingExposures,
      spooledCassettes: film.optionalSpooledCassettes,
      userId: userId
    )

    try await supabase.client
      .from("films")
      .insert(payload)
      .execute()
  }

  func updateFilm(_ film: Film, with form: FilmFormData) async throws {
    let userId = try await supabase.currentUserId()
    let payload = FilmUpdate(
      name: form.name,
      brand: form.brand,
      iso: form.iso,
      format: form.format,
      type: form.type,
      expirationDate: form.expirationDate,
      price: form.optionalPrice,
      count: form.count,
      notes: form.notes.isEmpty ? nil : form.notes,
      editingNotes: form.editingNotes.isEmpty ? nil : form.editingNotes,
      isECN: form.isECN,
      isBulkFilm: form.isBulkFilm,
      bulkLengthMeters: form.optionalBulkLengthMeters,
      bulkQuantity: form.optionalBulkQuantity,
      calculatedRolls: form.optionalCalculatedRolls,
      bulkRemainingExposures: form.optionalBulkRemainingExposures,
      spooledCassettes: form.optionalSpooledCassettes
    )

    try await supabase.client
      .from("films")
      .update(payload)
      .eq("id", value: film.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  func deleteFilm(_ film: Film) async throws {
    let userId = try await supabase.currentUserId()

    try await supabase.client
      .from("films")
      .update(["deleted_at": Date().ISO8601Format()])
      .eq("id", value: film.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  func getFilm(id: UUID) async throws -> Film {
    let userId = try await supabase.currentUserId()

    return try await supabase.client
      .from("films_with_availability")
      .select()
      .eq("id", value: id.uuidString)
      .eq("user_id", value: userId)
      .is("deleted_at", value: nil)
      .single()
      .execute()
      .value
  }

  func listGear() async throws -> [Gear] {
    do {
      let userId = try await supabase.currentUserId()

      return try await supabase.client
        .from("gear")
        .select()
        .eq("user_id", value: userId)
        .order("type", ascending: true)
        .order("brand", ascending: true)
        .order("name", ascending: true)
        .execute()
        .value
    } catch {
      throw contextualError("Gear list", error)
    }
  }

  func listAvailableGear() async throws -> [Gear] {
    try await listGear()
  }

  func getGear(id: UUID) async throws -> Gear {
    do {
      let userId = try await supabase.currentUserId()

      return try await supabase.client
        .from("gear")
        .select()
        .eq("id", value: id.uuidString)
        .eq("user_id", value: userId)
        .single()
        .execute()
        .value
    } catch {
      throw contextualError("Gear detail", error)
    }
  }

  func createGear(_ gear: GearFormData) async throws {
    let userId = try await supabase.currentUserId()
    let payload = NewGear(
      name: gear.name,
      brand: gear.brand,
      type: gear.type,
      model: gear.optionalModel,
      serialNumber: gear.optionalSerialNumber,
      purchaseDate: gear.optionalPurchaseDate,
      purchasePrice: gear.optionalPurchasePrice,
      condition: gear.condition,
      notes: gear.notes.isEmpty ? nil : gear.notes,
      cameraId: gear.optionalCameraId,
      userId: userId
    )

    try await supabase.client
      .from("gear")
      .insert(payload)
      .execute()
  }

  func updateGear(_ gear: Gear, with form: GearFormData) async throws {
    let userId = try await supabase.currentUserId()
    let payload = GearUpdate(
      name: form.name,
      brand: form.brand,
      type: form.type,
      model: form.optionalModel,
      serialNumber: form.optionalSerialNumber,
      purchaseDate: form.optionalPurchaseDate,
      purchasePrice: form.optionalPurchasePrice,
      condition: form.condition,
      notes: form.notes.isEmpty ? nil : form.notes,
      cameraId: form.optionalCameraId
    )

    try await supabase.client
      .from("gear")
      .update(payload)
      .eq("id", value: gear.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  func deleteGear(_ gear: Gear) async throws {
    let userId = try await supabase.currentUserId()
    let reservations = try await gearReservations(gearId: gear.id)
    let upcomingReservations = reservations.filter { reservation in
      guard let trip = reservation.trips else { return false }
      let dateValue = trip.startDate ?? trip.endDate
      guard let dateValue, let reservationDate = TripDisplay.date(from: dateValue) else {
        return false
      }

      return reservationDate >= Calendar.current.startOfDay(for: Date())
    }

    if !upcomingReservations.isEmpty {
      let titles = upcomingReservations
        .compactMap { $0.trips?.title }
        .joined(separator: ", ")
      throw AppError.message("Cannot delete gear: it's reserved for upcoming trips: \(titles)")
    }

    try await supabase.client
      .from("gear")
      .delete()
      .eq("id", value: gear.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  private func gearReservations(gearId: UUID) async throws -> [GearReservationSummary] {
    try await supabase.client
      .from("trip_gear")
      .select(
        """
        trips (
          title,
          start_date,
          end_date
        )
        """
      )
      .eq("gear_id", value: gearId.uuidString)
      .execute()
      .value
  }

  func listTrips() async throws -> [Trip] {
    do {
      let userId = try await supabase.currentUserId()

      let rows: [TripListRow] = try await supabase.client
        .from("trips")
        .select(
          """
          *,
          trip_films (
            quantity
          )
          """
        )
        .eq("user_id", value: userId)
        .order("start_date", ascending: true)
        .execute()
        .value

      return rows
        .map { row in
          var displayTrip = row.trip
          displayTrip.reservedFilmCount = row.tripFilms?.reduce(0) { total, tripFilm in
            total + tripFilm.quantity
          } ?? 0
          displayTrip.status = TripDisplay.status(for: displayTrip)
          return displayTrip
        }
        .sorted(by: TripDisplay.compare)
    } catch {
      throw contextualError("Trips list", error)
    }
  }

  func getTrip(id: UUID) async throws -> Trip {
    do {
      let userId = try await supabase.currentUserId()
      var trip: Trip = try await supabase.client
        .from("trips")
        .select()
        .eq("id", value: id.uuidString)
        .eq("user_id", value: userId)
        .single()
        .execute()
        .value
      trip.status = TripDisplay.status(for: trip)
      return trip
    } catch {
      throw contextualError("Trip detail", error)
    }
  }

  func createTrip(_ trip: TripFormData) async throws {
    let userId = try await supabase.currentUserId()
    let payload = NewTrip(
      title: trip.title,
      description: trip.description,
      startDate: trip.startDateString,
      endDate: trip.endDateString,
      status: .upcoming,
      userId: userId
    )

    try await supabase.client
      .from("trips")
      .insert(payload)
      .execute()
  }

  func updateTrip(_ trip: Trip, with form: TripFormData) async throws {
    let userId = try await supabase.currentUserId()
    let payload = TripUpdate(
      title: form.title,
      description: form.description,
      startDate: form.startDateString,
      endDate: form.endDateString
    )

    try await supabase.client
      .from("trips")
      .update(payload)
      .eq("id", value: trip.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  func deleteTrip(_ trip: Trip) async throws {
    let userId = try await supabase.currentUserId()

    try await supabase.client
      .from("trips")
      .delete()
      .eq("id", value: trip.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  func listTripFilmReservations(tripId: UUID) async throws -> [TripFilmReservation] {
    do {
      _ = try await supabase.currentUserId()

      return try await supabase.client
        .from("trip_films")
        .select(
          """
          id,
          trip_id,
          film_id,
          quantity,
          created_at,
          films (
            id,
            name,
            brand,
            iso,
            format,
            type
          )
          """
        )
        .eq("trip_id", value: tripId.uuidString)
        .order("created_at", ascending: false)
        .execute()
        .value
    } catch {
      throw contextualError("Trip film reservations", error)
    }
  }

  func reserveFilmForTrip(tripId: UUID, filmId: UUID, quantity: Int) async throws {
    _ = try await supabase.currentUserId()

    let existing: [TripFilmReservation] = try await supabase.client
      .from("trip_films")
      .select()
      .eq("trip_id", value: tripId.uuidString)
      .eq("film_id", value: filmId.uuidString)
      .limit(1)
      .execute()
      .value

    if let reservation = existing.first {
      try await supabase.client
        .from("trip_films")
        .update(TripFilmQuantityUpdate(quantity: reservation.quantity + quantity))
        .eq("id", value: reservation.id.uuidString)
        .execute()
      return
    }

    try await supabase.client
      .from("trip_films")
      .insert(NewTripFilmReservation(
        tripId: tripId.uuidString,
        filmId: filmId.uuidString,
        quantity: quantity
      ))
      .execute()
  }

  func removeFilmFromTrip(tripId: UUID, filmId: UUID) async throws {
    _ = try await supabase.currentUserId()

    try await supabase.client
      .from("trip_films")
      .delete()
      .eq("trip_id", value: tripId.uuidString)
      .eq("film_id", value: filmId.uuidString)
      .execute()
  }

  func updateFilmReservationQuantity(
    tripId: UUID,
    filmId: UUID,
    quantity: Int
  ) async throws {
    _ = try await supabase.currentUserId()

    if quantity < 1 {
      throw AppError.message("Quantity must be at least 1.")
    }

    try await supabase.client
      .from("trip_films")
      .update(TripFilmQuantityUpdate(quantity: quantity))
      .eq("trip_id", value: tripId.uuidString)
      .eq("film_id", value: filmId.uuidString)
      .execute()
  }

  func listTripGearReservations(tripId: UUID) async throws -> [TripGearReservation] {
    do {
      _ = try await supabase.currentUserId()

      return try await supabase.client
        .from("trip_gear")
        .select(
          """
          id,
          trip_id,
          gear_id,
          created_at,
          gear (*)
          """
        )
        .eq("trip_id", value: tripId.uuidString)
        .order("created_at", ascending: false)
        .execute()
        .value
    } catch {
      throw contextualError("Trip gear reservations", error)
    }
  }

  func reserveGearForTrip(tripId: UUID, gearId: UUID) async throws {
    _ = try await supabase.currentUserId()

    let existing: [TripGearReservation] = try await supabase.client
      .from("trip_gear")
      .select()
      .eq("trip_id", value: tripId.uuidString)
      .eq("gear_id", value: gearId.uuidString)
      .limit(1)
      .execute()
      .value

    if !existing.isEmpty {
      throw AppError.message("Gear is already reserved for this trip")
    }

    try await supabase.client
      .from("trip_gear")
      .insert(NewTripGearReservation(
        tripId: tripId.uuidString,
        gearId: gearId.uuidString
      ))
      .execute()
  }

  func removeGearFromTrip(tripId: UUID, gearId: UUID) async throws {
    _ = try await supabase.currentUserId()

    try await supabase.client
      .from("trip_gear")
      .delete()
      .eq("trip_id", value: tripId.uuidString)
      .eq("gear_id", value: gearId.uuidString)
      .execute()
  }

  func completeTrip(_ trip: Trip) async throws {
    let userId = try await supabase.currentUserId()

    let usageRows: [FilmUsage] = try await supabase.client
      .from("film_usage")
      .select()
      .eq("trip_id", value: trip.id.uuidString)
      .execute()
      .value
    let consumedFilmIds = Set(usageRows.map(\.filmId))
    let reservations = try await listTripFilmReservations(tripId: trip.id)

    for reservation in reservations where !consumedFilmIds.contains(reservation.filmId) {
      try await reduceFilmCount(
        filmId: reservation.filmId,
        quantity: reservation.quantity,
        usageNote: "Trip: \(trip.title) (completed)",
        tripId: trip.id
      )
    }

    try await supabase.client
      .from("trips")
      .update(TripStatusUpdate(status: .completed))
      .eq("id", value: trip.id.uuidString)
      .eq("user_id", value: userId)
      .execute()
  }

  private func reduceFilmCount(
    filmId: UUID,
    quantity: Int,
    usageNote: String,
    tripId: UUID?
  ) async throws {
    let userId = try await supabase.currentUserId()
    let film: FilmCountState = try await supabase.client
      .from("films")
      .select("count, is_bulk_film, spooled_cassettes")
      .eq("id", value: filmId.uuidString)
      .eq("user_id", value: userId)
      .single()
      .execute()
      .value

    let newCount = max(0, (film.count ?? 0) - quantity)
    let update = FilmCountUpdate(
      count: newCount,
      spooledCassettes: film.isBulkFilm == true
        ? max(0, (film.spooledCassettes ?? 0) - quantity)
        : nil
    )

    try await supabase.client
      .from("films")
      .update(update)
      .eq("id", value: filmId.uuidString)
      .eq("user_id", value: userId)
      .execute()

    try await supabase.client
      .from("film_usage")
      .insert(NewFilmUsage(
        filmId: filmId.uuidString,
        quantity: quantity,
        usageNote: usageNote,
        usageType: "shoot",
        tripId: tripId?.uuidString
      ))
      .execute()
  }

  func reduceFilmStock(_ film: Film, quantity: Int, note: String) async throws {
    try await reduceFilmCount(
      filmId: film.id,
      quantity: quantity,
      usageNote: note.isEmpty ? "Shot from mobile app" : note,
      tripId: nil
    )
  }

  func addFilmStock(_ film: Film, quantity: Int, note: String) async throws {
    let userId = try await supabase.currentUserId()
    let state: FilmCountState = try await supabase.client
      .from("films")
      .select("count, is_bulk_film, spooled_cassettes")
      .eq("id", value: film.id.uuidString)
      .eq("user_id", value: userId)
      .single()
      .execute()
      .value
    let newCount = (state.count ?? 0) + quantity
    let update = FilmCountUpdate(
      count: newCount,
      spooledCassettes: state.isBulkFilm == true
        ? (state.spooledCassettes ?? 0) + quantity
        : nil
    )

    try await supabase.client
      .from("films")
      .update(update)
      .eq("id", value: film.id.uuidString)
      .eq("user_id", value: userId)
      .execute()

    try await supabase.client
      .from("film_usage")
      .insert(NewFilmUsage(
        filmId: film.id.uuidString,
        quantity: quantity,
        usageNote: note.isEmpty ? "Added from mobile app" : note,
        usageType: "add",
        tripId: nil
      ))
      .execute()
  }

  private func contextualError(_ context: String, _ error: Error) -> Error {
    if let appError = error as? AppError {
      return appError
    }

    return AppError.message("\(context) failed: \(Self.describe(error))")
  }

  static func describe(_ error: Error) -> String {
    switch error {
    case let DecodingError.keyNotFound(key, context):
      return "Missing key \(key.stringValue) at \(codingPath(context.codingPath))."
    case let DecodingError.typeMismatch(type, context):
      return "Expected \(type) at \(codingPath(context.codingPath)): \(context.debugDescription)"
    case let DecodingError.valueNotFound(type, context):
      return "Missing \(type) at \(codingPath(context.codingPath)): \(context.debugDescription)"
    case let DecodingError.dataCorrupted(context):
      return "Data corrupted at \(codingPath(context.codingPath)): \(context.debugDescription)"
    default:
      return error.localizedDescription
    }
  }

  private static func codingPath(_ path: [CodingKey]) -> String {
    let value = path.map(\.stringValue).joined(separator: ".")
    return value.isEmpty ? "<root>" : value
  }

}
