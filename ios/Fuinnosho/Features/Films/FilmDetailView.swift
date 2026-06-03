import SwiftUI

private enum FilmDetailSheet: Identifiable {
  case edit
  case stockAdjustment
  case bulkSpool

  var id: String {
    switch self {
    case .edit: "edit"
    case .stockAdjustment: "stockAdjustment"
    case .bulkSpool: "bulkSpool"
    }
  }
}

struct FilmDetailView: View {
  @Environment(AuthSessionStore.self) private var authStore

  let film: Film
  let onChange: () async -> Void

  @State private var service = InventoryService()
  @State private var currentFilm: Film
  @State private var usage: [FilmUsage] = []
  @State private var tripReservations: [TripFilmReservation] = []
  @State private var presentedSheet: FilmDetailSheet?
  @State private var errorMessage: String?
  @State private var isFinishingBulkRoll = false

  init(film: Film, onChange: @escaping () async -> Void) {
    self.film = film
    self.onChange = onChange
    _currentFilm = State(initialValue: film)
  }

  var body: some View {
    List {
      Section("Film") {
        LabeledContent("Brand", value: currentFilm.brand)
        LabeledContent("ISO", value: "\(currentFilm.iso)")
        LabeledContent("Format", value: currentFilm.format)
        LabeledContent("Type", value: currentFilm.type)
        LabeledContent("Expires", value: currentFilm.expirationDate ?? "Not set")
        if currentFilm.isECN == true {
          LabeledContent("Process", value: "ECN-2")
        }
      }

      Section("Stock") {
        LabeledContent("Count", value: "\(currentFilm.count ?? 0)")
        LabeledContent("Reserved", value: "\(currentFilm.reservedQuantity ?? 0)")
        LabeledContent("Available", value: "\(currentFilm.availableCount ?? currentFilm.count ?? 0)")

        if currentFilm.isBulkFilm == true {
          LabeledContent("Spooled", value: "\(currentFilm.spooledCassettes ?? 0)")
          LabeledContent("Remaining exposures", value: "\(currentFilm.bulkRemainingExposures ?? 0)")
          if let bulkQuantity = currentFilm.bulkQuantity {
            LabeledContent("Bulk rolls", value: "\(currentFilm.bulkRollsUsed ?? 0) of \(bulkQuantity) complete")
          }
        }
      }

      if currentFilm.isBulkFilm == true {
        Section("Bulk Tools") {
          Button("Spool Film") {
            presentedSheet = .bulkSpool
          }
          Button("Mark Bulk Roll Complete") {
            finishBulkRoll()
          }
          .disabled(isFinishingBulkRoll || (currentFilm.bulkRollsUsed ?? 0) >= (currentFilm.bulkQuantity ?? 0))
        }
      }

      if let notes = currentFilm.notes, !notes.isEmpty {
        Section("Notes") {
          Text(notes)
        }
      }

      if let editingNotes = currentFilm.editingNotes, !editingNotes.isEmpty {
        Section("Editing Notes") {
          Text(editingNotes)
        }
      }

      Section {
        Button("Adjust Stock") {
          presentedSheet = .stockAdjustment
        }
      }

      Section("Usage History") {
        if usage.isEmpty {
          Text("No usage recorded yet")
            .foregroundStyle(.secondary)
        } else {
          ForEach(usage) { event in
            VStack(alignment: .leading, spacing: 4) {
              HStack {
                Text(usageTitle(event))
                Spacer()
                Text("\(event.usageType == "add" ? "+" : "")\(event.quantity)")
                  .fontWeight(.medium)
              }
              if let exposuresUsed = event.exposuresUsed {
                Text("\(exposuresUsed) exposures")
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
              if let note = event.usageNote, !note.isEmpty {
                Text(note)
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
            }
          }
        }
      }

      Section("Trip Reservations") {
        if tripReservations.isEmpty {
          Text("No trip reservations yet")
            .foregroundStyle(.secondary)
        } else {
          ForEach(tripReservations) { reservation in
            VStack(alignment: .leading, spacing: 4) {
              HStack {
                Text(reservation.trip?.title ?? "Trip")
                  .fontWeight(.medium)
                Spacer()
                Text("\(reservation.quantity) rolls")
                  .fontWeight(.medium)
              }

              if let trip = reservation.trip {
                HStack(spacing: 8) {
                  Text(tripDateRange(trip))
                  if let status = trip.status {
                    Text(status.rawValue.capitalized)
                  }
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                if let description = trip.description, !description.isEmpty {
                  Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
              }
            }
          }
        }
      }
    }
    .navigationTitle(currentFilm.name)
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button("Edit") {
          presentedSheet = .edit
        }
      }
    }
    .alert("Film Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(errorMessage ?? "")
    }
    .sheet(item: $presentedSheet) { sheet in
      switch sheet {
      case .edit:
        NewFilmView(film: currentFilm) {
          await onChange()
          await reload()
        }
      case .stockAdjustment:
        FilmStockAdjustmentView(film: currentFilm) {
          await onChange()
          await reload()
        }
      case .bulkSpool:
        FilmBulkSpoolView(film: currentFilm) {
          await onChange()
          await reload()
        }
      }
    }
    .task {
      await reloadRelations()
    }
  }

  private func reload() async {
    do {
      currentFilm = try await service.getFilm(id: currentFilm.id)
      await reloadRelations()
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func reloadUsage() async {
    do {
      usage = try await service.listFilmUsage(filmId: currentFilm.id)
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func reloadRelations() async {
    await reloadUsage()
    await reloadTripReservations()
  }

  private func reloadTripReservations() async {
    do {
      tripReservations = try await service.listFilmTripReservations(filmId: currentFilm.id)
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func finishBulkRoll() {
    isFinishingBulkRoll = true

    Task {
      do {
        try await service.finishBulkRoll(currentFilm)
        await onChange()
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }

      isFinishingBulkRoll = false
    }
  }

  private func usageTitle(_ event: FilmUsage) -> String {
    switch event.usageType {
    case "add":
      return "Added"
    case "spool":
      return "Spooled"
    default:
      return "Shot"
    }
  }

  private func tripDateRange(_ trip: ReservedTrip) -> String {
    if trip.startDate == trip.endDate {
      return trip.startDate
    }

    return "\(trip.startDate) to \(trip.endDate)"
  }
}
