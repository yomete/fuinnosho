import SwiftUI

enum FilmStockAdjustmentMode: String, CaseIterable, Identifiable {
  case add = "Add Rolls"
  case shoot = "Mark Shot"

  var id: String { rawValue }
}

struct FilmStockAdjustmentView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let film: Film
  let onSave: () async -> Void

  @State private var service = InventoryService()
  @State private var mode: FilmStockAdjustmentMode = .shoot
  @State private var quantity = 1
  @State private var note = ""
  @State private var errorMessage: String?
  @State private var isSaving = false

  var body: some View {
    NavigationStack {
      Form {
        Section("Adjustment") {
          Picker("Action", selection: $mode) {
            ForEach(FilmStockAdjustmentMode.allCases) { option in
              Text(option.rawValue).tag(option)
            }
          }
          Stepper("\(quantity) roll\(quantity == 1 ? "" : "s")", value: $quantity, in: 1...999)
          TextField("Note", text: $note, axis: .vertical)
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Adjust Stock")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            dismiss()
          }
        }

        ToolbarItem(placement: .confirmationAction) {
          Button("Save") {
            save()
          }
          .disabled(isSaving)
        }
      }
    }
  }

  private func save() {
    isSaving = true

    Task {
      do {
        switch mode {
        case .add:
          try await service.addFilmStock(film, quantity: quantity, note: note)
        case .shoot:
          try await service.reduceFilmStock(film, quantity: quantity, note: note)
        }

        await onSave()
        dismiss()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }

      isSaving = false
    }
  }
}
