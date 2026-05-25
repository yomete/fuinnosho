import SwiftUI

private enum FilmDetailSheet: Identifiable {
  case edit
  case stockAdjustment

  var id: String {
    switch self {
    case .edit: "edit"
    case .stockAdjustment: "stockAdjustment"
    }
  }
}

struct FilmDetailView: View {
  @Environment(AuthSessionStore.self) private var authStore

  let film: Film
  let onChange: () async -> Void

  @State private var service = InventoryService()
  @State private var currentFilm: Film
  @State private var presentedSheet: FilmDetailSheet?
  @State private var errorMessage: String?

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
      }
    }
  }

  private func reload() async {
    do {
      currentFilm = try await service.getFilm(id: currentFilm.id)
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }
}
