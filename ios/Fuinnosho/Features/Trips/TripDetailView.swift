import SwiftUI

private enum TripConfirmation: Identifiable {
  case complete
  case delete
  case removeFilm(TripFilmReservation)
  case removeGear(TripGearReservation)

  var id: String {
    switch self {
    case .complete: "complete"
    case .delete: "delete"
    case .removeFilm(let reservation): "remove-film-\(reservation.id)"
    case .removeGear(let reservation): "remove-gear-\(reservation.id)"
    }
  }
}

private enum TripFilmSort: String, CaseIterable, Identifiable {
  case iso = "ISO"
  case name = "Name"
  case brand = "Brand"
  case quantity = "Quantity"

  var id: String { rawValue }
}

private struct TripFilmReservationRow: View {
  let reservation: TripFilmReservation
  let canEdit: Bool
  let onEdit: () -> Void

  var body: some View {
    HStack {
      VStack(alignment: .leading) {
        Text(reservation.film?.name ?? "Film")
        if let film = reservation.film {
          Text("\(film.brand) · ISO \(film.iso) · \(film.format)")
            .font(.caption)
            .foregroundStyle(.secondary)
        }
      }

      Spacer()
      Text("x\(reservation.quantity)")
        .foregroundStyle(FuinnoshoTheme.accent)
      if canEdit {
        Button("Edit", action: onEdit)
          .font(.caption)
      }
    }
  }
}

private struct TripGearReservationRow: View {
  let reservation: TripGearReservation

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(reservation.gear?.name ?? "Gear")
        .font(.headline)
      if let gear = reservation.gear {
        Text("\(gear.brand) · \(gear.type.rawValue.capitalized)")
          .font(.caption)
          .foregroundStyle(.secondary)
      }
    }
  }
}

struct TripDetailView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let trip: Trip
  let onChange: () async -> Void

  @State private var service = InventoryService()
  @State private var currentTrip: Trip
  @State private var reservations: [TripFilmReservation] = []
  @State private var gearReservations: [TripGearReservation] = []
  @State private var reservableFilms: [Film] = []
  @State private var filmAvailabilityById: [UUID: Int] = [:]
  @State private var availableGear: [Gear] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isCompleting = false
  @State private var isDeleting = false
  @State private var isCompleted: Bool
  @State private var isShowingEdit = false
  @State private var editingFilmReservation: TripFilmReservation?
  @State private var confirmation: TripConfirmation?
  @State private var selectedFilmId: UUID?
  @State private var selectedGearId: UUID?
  @State private var quantity = 1
  @State private var editQuantity = 1
  @State private var isSavingQuantity = false
  @State private var filmSort: TripFilmSort = .iso
  @State private var isDescendingFilmSort = true
  @State private var selectedFilmISO: Int?

  init(trip: Trip, onChange: @escaping () async -> Void) {
    self.trip = trip
    self.onChange = onChange
    _currentTrip = State(initialValue: trip)
    _isCompleted = State(initialValue: trip.status == .completed)
  }

  var body: some View {
    List {
      tripSummarySection
      filmReservationsSection
      addFilmSection
      gearReservationsSection
      addGearSection
      tripActionsSection
    }
    .navigationTitle(currentTrip.title)
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button("Edit") {
          isShowingEdit = true
        }
      }
    }
    .alert("Trip Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(displayedErrorMessage)
    }
    .confirmationDialog(
      confirmationTitle,
      isPresented: Binding(
        get: { confirmation != nil },
        set: { if !$0 { confirmation = nil } }
      ),
      titleVisibility: .visible
    ) {
      switch confirmation {
      case .complete:
        Button("Complete Trip", role: .destructive) {
          completeTrip()
        }
      case .delete:
        Button("Delete Trip", role: .destructive) {
          deleteTrip()
        }
      case .removeFilm(let reservation):
        Button("Remove Film", role: .destructive) {
          removeFilmReservation(reservation)
        }
      case .removeGear(let reservation):
        Button("Remove Gear", role: .destructive) {
          removeGearReservation(reservation)
        }
      case nil:
        EmptyView()
      }
      Button("Cancel", role: .cancel) {}
    } message: {
      switch confirmation {
      case .complete:
        Text("Reserved film will be consumed and usage rows will be recorded.")
      case .delete:
        Text("This removes the trip and its film and gear reservations.")
      case .removeFilm(let reservation):
        Text("This removes \(reservation.film?.name ?? "this film") from the trip.")
      case .removeGear(let reservation):
        Text("This removes \(reservation.gear?.name ?? "this gear") from the trip.")
      case nil:
        Text("")
      }
    }
    .overlay {
      if isLoading {
        ProgressView()
      }
    }
    .task {
      await reload()
    }
    .refreshable {
      await reload()
    }
    .sheet(isPresented: $isShowingEdit) {
      NewTripView(trip: currentTrip) {
        await onChange()
        await reload()
      }
    }
    .sheet(item: $editingFilmReservation) { reservation in
      NavigationStack {
        Form {
          Stepper(
            editQuantityTitle,
            value: $editQuantity,
            in: 1...editQuantityLimit(for: reservation)
          )
        }
        .navigationTitle(reservation.film?.name ?? "Film")
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
              editingFilmReservation = nil
            }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Save") {
              saveFilmReservationQuantity(reservation)
            }
            .disabled(isSavingQuantity)
          }
        }
      }
    }
  }

  @ViewBuilder
  private var tripSummarySection: some View {
    Section("Dates") {
      LabeledContent("Start", value: currentTrip.startDate)
      LabeledContent("End", value: currentTrip.endDate)
      LabeledContent("Status", value: currentStatusTitle)
    }

    Section("Description") {
      Text(currentTrip.description)
    }
  }

  private var filmReservationsSection: some View {
    Section("Reserved Film") {
      if reservations.isEmpty {
        Text("No reserved film yet")
          .foregroundStyle(.secondary)
      } else {
        Picker("Sort", selection: $filmSort) {
          ForEach(TripFilmSort.allCases) { sort in
            Text(sort.rawValue).tag(sort)
          }
        }

        Toggle("Descending", isOn: $isDescendingFilmSort)

        Picker("ISO", selection: $selectedFilmISO) {
          Text("All").tag(nil as Int?)
          ForEach(availableReservationISOs, id: \.self) { iso in
            Text("\(iso)").tag(iso as Int?)
          }
        }
      }

      ForEach(filteredReservations) { reservation in
        TripFilmReservationRow(
          reservation: reservation,
          canEdit: !isCompleted
        ) {
          startEditingFilmReservation(reservation)
        }
      }
      .onDelete(perform: removeFilmReservations)
    }
  }

  @ViewBuilder
  private var addFilmSection: some View {
    if !isCompleted {
      Section("Add Film") {
        Picker("Film", selection: $selectedFilmId) {
          Text("Select film").tag(UUID?.none)
          ForEach(reservableFilms) { film in
            Text(filmPickerTitle(for: film))
              .tag(UUID?.some(film.id))
          }
        }
        .onChange(of: selectedFilmId) { _, _ in
          quantity = min(quantity, selectedFilmAvailability)
        }

        Stepper(quantityTitle, value: $quantity, in: 1...max(1, selectedFilmAvailability))

        Button("Reserve Film") {
          reserveSelectedFilm()
        }
        .disabled(selectedFilmId == nil)
      }
    }
  }

  private var gearReservationsSection: some View {
    Section("Packed Gear") {
      if gearReservations.isEmpty {
        Text("No packed gear yet")
          .foregroundStyle(.secondary)
      }

      ForEach(gearReservations) { reservation in
        TripGearReservationRow(reservation: reservation)
      }
      .onDelete(perform: removeGearReservations)
    }
  }

  @ViewBuilder
  private var addGearSection: some View {
    if !isCompleted {
      Section("Add Gear") {
        Picker("Gear", selection: $selectedGearId) {
          Text("Select gear").tag(UUID?.none)
          ForEach(availableGear) { item in
            Text(gearPickerTitle(for: item))
              .tag(UUID?.some(item.id))
          }
        }

        Button("Pack Gear") {
          reserveSelectedGear()
        }
        .disabled(selectedGearId == nil)
      }
    }
  }

  private var tripActionsSection: some View {
    Section {
      Button(role: .destructive) {
        confirmation = .complete
      } label: {
        HStack {
          if isCompleting {
            ProgressView()
          }
          Text(isCompleted ? "Trip Completed" : "Complete Trip")
        }
      }
      .disabled(isCompleted || isCompleting)

      Button(role: .destructive) {
        confirmation = .delete
      } label: {
        HStack {
          if isDeleting {
            ProgressView()
          }
          Text("Delete Trip")
        }
      }
      .disabled(isDeleting)
    }
  }

  private var confirmationTitle: String {
    switch confirmation {
    case .complete:
      "Complete trip?"
    case .delete:
      "Delete trip?"
    case .removeFilm:
      "Remove film?"
    case .removeGear:
      "Remove gear?"
    case nil:
      "Confirm action"
    }
  }

  private var displayedErrorMessage: String {
    errorMessage ?? ""
  }

  private var currentStatusTitle: String {
    (isCompleted ? TripStatus.completed : currentTrip.status).rawValue.capitalized
  }

  private var quantityTitle: String {
    "\(quantity) roll\(quantity == 1 ? "" : "s")"
  }

  private var editQuantityTitle: String {
    "\(editQuantity) roll\(editQuantity == 1 ? "" : "s")"
  }

  private var selectedFilmAvailability: Int {
    guard let selectedFilmId else { return 1 }

    return max(1, filmAvailabilityById[selectedFilmId] ?? 0)
  }

  private var availableReservationISOs: [Int] {
    Array(Set(reservations.compactMap(\.film?.iso))).sorted()
  }

  private var filteredReservations: [TripFilmReservation] {
    let filtered = reservations.filter { reservation in
      selectedFilmISO == nil || reservation.film?.iso == selectedFilmISO
    }

    return filtered.sorted { first, second in
      let comparison: ComparisonResult

      switch filmSort {
      case .iso:
        comparison = compare(first.film?.iso ?? 0, second.film?.iso ?? 0)
      case .name:
        comparison = (first.film?.name ?? "").localizedCaseInsensitiveCompare(second.film?.name ?? "")
      case .brand:
        comparison = (first.film?.brand ?? "").localizedCaseInsensitiveCompare(second.film?.brand ?? "")
      case .quantity:
        comparison = compare(first.quantity, second.quantity)
      }

      if comparison == .orderedSame {
        return (first.film?.name ?? "") < (second.film?.name ?? "")
      }

      return isDescendingFilmSort ? comparison == .orderedDescending : comparison == .orderedAscending
    }
  }

  private func compare(_ first: Int, _ second: Int) -> ComparisonResult {
    if first == second {
      return .orderedSame
    }

    return first < second ? .orderedAscending : .orderedDescending
  }

  private func availableCount(for film: Film) -> Int {
    film.availableCount ?? film.count ?? 0
  }

  private func editQuantityLimit(for reservation: TripFilmReservation) -> Int {
    let availableCount = filmAvailabilityById[reservation.filmId] ?? 0
    return max(1, reservation.quantity + availableCount)
  }

  private func filmPickerTitle(for film: Film) -> String {
    let availableCount = availableCount(for: film)
    return "\(film.name) (\(availableCount))"
  }

  private func gearPickerTitle(for gear: Gear) -> String {
    "\(gear.name) · \(gear.brand)"
  }

  private func reload() async {
    isLoading = true
    defer { isLoading = false }

    do {
      async let filmReservationRows = service.listTripFilmReservations(tripId: trip.id)
      async let gearReservationRows = service.listTripGearReservations(tripId: trip.id)
      async let filmRows = service.listFilms()
      async let gearRows = service.listAvailableGear()
      async let tripRow = service.getTrip(id: trip.id)
      let loadedFilmReservations = try await filmReservationRows
      let loadedGearReservations = try await gearReservationRows
      let loadedFilms = try await filmRows
      let reservedGearIds = Set(loadedGearReservations.map(\.gearId))
      let loadedGear = try await gearRows
        .filter { gear in
          !reservedGearIds.contains(gear.id)
        }
      let loadedTrip = try await tripRow

      reservations = loadedFilmReservations
      gearReservations = loadedGearReservations
      reservableFilms = loadedFilms.filter { availableCount(for: $0) > 0 }
      filmAvailabilityById = Dictionary(
        uniqueKeysWithValues: loadedFilms.map { ($0.id, availableCount(for: $0)) }
      )
      availableGear = loadedGear
      currentTrip = loadedTrip
      isCompleted = loadedTrip.status == .completed
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func reserveSelectedFilm() {
    guard let selectedFilmId else { return }

    guard quantity <= selectedFilmAvailability else {
      errorMessage = "Cannot reserve \(quantity) rolls. Only \(selectedFilmAvailability) available."
      return
    }

    Task {
      do {
        try await service.reserveFilmForTrip(
          tripId: trip.id,
          filmId: selectedFilmId,
          quantity: quantity
        )
        self.selectedFilmId = nil
        quantity = 1
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func startEditingFilmReservation(_ reservation: TripFilmReservation) {
    editQuantity = min(reservation.quantity, editQuantityLimit(for: reservation))
    editingFilmReservation = reservation
  }

  private func saveFilmReservationQuantity(_ reservation: TripFilmReservation) {
    guard editQuantity <= editQuantityLimit(for: reservation) else {
      errorMessage = "Cannot reserve \(editQuantity) rolls. Only \(editQuantityLimit(for: reservation)) available for this trip."
      return
    }

    isSavingQuantity = true

    Task {
      defer { isSavingQuantity = false }

      do {
        try await service.updateFilmReservationQuantity(
          tripId: trip.id,
          filmId: reservation.filmId,
          quantity: editQuantity
        )
        editingFilmReservation = nil
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func reserveSelectedGear() {
    guard let selectedGearId else { return }

    Task {
      do {
        try await service.reserveGearForTrip(tripId: trip.id, gearId: selectedGearId)
        self.selectedGearId = nil
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func removeFilmReservations(at offsets: IndexSet) {
    guard let firstOffset = offsets.first else { return }
    confirmation = .removeFilm(reservations[firstOffset])
  }

  private func removeFilmReservation(_ reservation: TripFilmReservation) {
    Task {
      do {
        try await service.removeFilmFromTrip(tripId: trip.id, filmId: reservation.filmId)
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func removeGearReservations(at offsets: IndexSet) {
    guard let firstOffset = offsets.first else { return }
    confirmation = .removeGear(gearReservations[firstOffset])
  }

  private func removeGearReservation(_ reservation: TripGearReservation) {
    Task {
      do {
        try await service.removeGearFromTrip(tripId: trip.id, gearId: reservation.gearId)
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func completeTrip() {
    isCompleting = true

    Task {
      defer { isCompleting = false }

      do {
        try await service.completeTrip(currentTrip)
        isCompleted = true
        await onChange()
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func deleteTrip() {
    isDeleting = true

    Task {
      defer { isDeleting = false }

      do {
        try await service.deleteTrip(currentTrip)
        await onChange()
        dismiss()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }
}
