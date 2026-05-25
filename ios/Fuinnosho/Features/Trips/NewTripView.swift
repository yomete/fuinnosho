import SwiftUI

struct NewTripView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var form: TripFormData
  @State private var errorMessage: String?
  @State private var isSaving = false

  let trip: Trip?
  let onSave: () async -> Void

  init(trip: Trip? = nil, onSave: @escaping () async -> Void) {
    self.trip = trip
    self.onSave = onSave
    _form = State(initialValue: trip.map(TripFormData.init(trip:)) ?? TripFormData())
  }

  var body: some View {
    NavigationStack {
      Form {
        Section("Trip") {
          TextField("Title", text: $form.title)
          TextField("Description", text: $form.description, axis: .vertical)
          DatePicker("Start date", selection: $form.startDate, displayedComponents: .date)
          DatePicker("End date", selection: $form.endDate, in: form.startDate..., displayedComponents: .date)
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle(trip == nil ? "New Trip" : "Edit Trip")
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
          .disabled(isSaving || form.title.isEmpty || form.description.isEmpty)
        }
      }
    }
  }

  private func save() {
    isSaving = true

    Task {
      do {
        if let trip {
          try await service.updateTrip(trip, with: form)
        } else {
          try await service.createTrip(form)
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
