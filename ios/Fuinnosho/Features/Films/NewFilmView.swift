import SwiftUI

struct NewFilmView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var form: FilmFormData
  @State private var errorMessage: String?
  @State private var isSaving = false

  let film: Film?
  let onSave: () async -> Void

  init(film: Film? = nil, onSave: @escaping () async -> Void) {
    self.film = film
    self.onSave = onSave
    _form = State(initialValue: film.map(FilmFormData.init(film:)) ?? FilmFormData())
  }

  var body: some View {
    NavigationStack {
      Form {
        Section("Film") {
          TextField("Name", text: $form.name)
          TextField("Brand", text: $form.brand)
          TextField("Type", text: $form.type)
          TextField("Format", text: $form.format)
          TextField("Expiration date", text: $form.expirationDate)
        }

        Section("Stock") {
          Stepper("ISO \(form.iso)", value: $form.iso, in: 1...12800, step: 100)
          TextField("Price", value: $form.price, format: .number)
            .keyboardType(.decimalPad)
          Stepper("\(form.count) rolls", value: $form.count, in: 0...999)
          Toggle("ECN-2 film", isOn: $form.isECN)
          Toggle("Bulk film", isOn: $form.isBulkFilm)

          if form.isBulkFilm {
            TextField("Bulk length (m)", value: $form.bulkLengthMeters, format: .number)
              .keyboardType(.decimalPad)
            Stepper("\(form.bulkQuantity) bulk roll\(form.bulkQuantity == 1 ? "" : "s")", value: $form.bulkQuantity, in: 1...99)
            Stepper("\(form.calculatedRolls) calculated rolls", value: $form.calculatedRolls, in: 0...999)
            Stepper("\(form.bulkRemainingExposures) exposures remaining", value: $form.bulkRemainingExposures, in: 0...99999)
            Stepper("\(form.spooledCassettes) cassettes spooled", value: $form.spooledCassettes, in: 0...999)
          }
        }

        Section("Notes") {
          TextField("Notes", text: $form.notes, axis: .vertical)
          TextField("Editing notes", text: $form.editingNotes, axis: .vertical)
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle(film == nil ? "New Film" : "Edit Film")
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
          .disabled(isSaving || form.name.isEmpty || form.brand.isEmpty)
        }
      }
    }
  }

  private func save() {
    isSaving = true

    Task {
      do {
        if let film {
          try await service.updateFilm(film, with: form)
        } else {
          try await service.createFilm(form)
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
