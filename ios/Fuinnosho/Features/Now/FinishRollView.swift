import SwiftUI

struct FinishRollView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let entry: LoadedFilm
  let trips: [Trip]
  let onSave: () async -> Void

  @State private var service = InventoryService()
  @State private var outcome: UnloadOutcome = .shot
  @State private var tripId: UUID?
  @State private var errorMessage: String?
  @State private var isSaving = false

  private var openTrips: [Trip] {
    trips.filter { $0.status != .completed }
  }

  var body: some View {
    NavigationStack {
      Form {
        Section {
          Text(entry.film?.displayName ?? "This roll")
            .font(.headline)
          Text("in \(entry.camera?.displayName ?? "the camera")")
            .foregroundStyle(.secondary)
        }

        Section("What happened to it?") {
          Picker("Outcome", selection: $outcome) {
            ForEach(UnloadOutcome.allCases) { option in
              Text(option.label).tag(option)
            }
          }
          .pickerStyle(.inline)
          .labelsHidden()

          Text(outcome.explanation)
            .font(.footnote)
            .foregroundStyle(.secondary)
        }

        if outcome == .shot && !openTrips.isEmpty {
          Section("Shot on a trip? (optional)") {
            Picker("Trip", selection: $tripId) {
              Text("No trip").tag(nil as UUID?)
              ForEach(openTrips) { trip in
                Text(trip.title).tag(trip.id as UUID?)
              }
            }
          }
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Finish Roll")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            dismiss()
          }
        }

        ToolbarItem(placement: .confirmationAction) {
          Button(outcome == .shot ? "Mark as Shot" : "Put It Back") {
            save()
          }
          .disabled(isSaving)
        }
      }
    }
  }

  private func save() {
    errorMessage = nil
    isSaving = true

    Task {
      do {
        try await service.unloadFilm(
          entry,
          outcome: outcome,
          tripId: outcome == .shot ? tripId : nil
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
