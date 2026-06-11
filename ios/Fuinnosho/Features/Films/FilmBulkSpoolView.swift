import SwiftUI

struct FilmBulkSpoolView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let film: Film
  let onSave: () async -> Void

  @State private var service = InventoryService()
  @State private var exposuresToSpool = 36
  @State private var cassettesCreated = 1
  @State private var note = ""
  @State private var errorMessage: String?
  @State private var isSaving = false

  var body: some View {
    NavigationStack {
      Form {
        Section("Bulk Film") {
          LabeledContent("Remaining exposures", value: "\(film.bulkRemainingExposures ?? 0)")
          Stepper("\(exposuresToSpool) exposures", value: $exposuresToSpool, in: 1...max(1, film.bulkRemainingExposures ?? 1))
          Stepper("\(cassettesCreated) cassette\(cassettesCreated == 1 ? "" : "s")", value: $cassettesCreated, in: 1...99)
          TextField("Note", text: $note, axis: .vertical)
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Spool Film")
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
        try await service.spoolBulkFilm(
          film,
          exposuresToSpool: exposuresToSpool,
          cassettesCreated: cassettesCreated,
          note: note
        )
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
