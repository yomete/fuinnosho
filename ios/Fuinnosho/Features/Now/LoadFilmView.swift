import SwiftUI

struct LoadFilmView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let cameras: [CameraLoadState]
  let films: [Film]
  let isoPrefills: [UUID: Int]
  let onSave: () async -> Void

  @State private var service = InventoryService()
  @State private var cameraId: UUID?
  @State private var filmId: UUID?
  @State private var shotAtISO = ""
  @State private var notes = ""
  @State private var errorMessage: String?
  @State private var isSaving = false

  private var freeCameras: [CameraLoadState] {
    cameras.filter { $0.loaded == nil }
  }

  private var selectedFilm: Film? {
    films.first { $0.id == filmId }
  }

  var body: some View {
    NavigationStack {
      Form {
        Section("Camera") {
          if freeCameras.isEmpty {
            Text("Every camera already has a roll in it.")
              .foregroundStyle(.secondary)
          } else {
            Picker("Camera", selection: $cameraId) {
              Text("Choose a camera…").tag(nil as UUID?)
              ForEach(freeCameras) { state in
                Text(state.camera.displayName).tag(state.camera.id as UUID?)
              }
            }
          }
        }

        Section("Film") {
          if films.isEmpty {
            Text("No film is available to load. Everything is either out of stock, reserved for a trip, or already in a camera.")
              .foregroundStyle(.secondary)
          } else {
            Picker("Film", selection: $filmId) {
              Text("Choose a film…").tag(nil as UUID?)
              ForEach(films) { film in
                Text(filmLabel(film)).tag(film.id as UUID?)
              }
            }
          }
        }

        Section {
          TextField("Shooting at (EI)", text: $shotAtISO)
            .keyboardType(.numberPad)
          TextField("Note", text: $notes, axis: .vertical)
        } header: {
          Text("Details")
        } footer: {
          if let selectedFilm {
            Text("Box speed is ISO \(selectedFilm.iso). Leave the EI as-is unless you're pushing or pulling.")
          }
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Load a Roll")
      .navigationBarTitleDisplayMode(.inline)
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
          .disabled(isSaving || cameraId == nil || filmId == nil)
        }
      }
      .onChange(of: filmId) { _, newValue in
        applyISOPrefill(for: newValue)
      }
    }
  }

  private func filmLabel(_ film: Film) -> String {
    var parts = ["\(film.brand) \(film.name)", "ISO \(film.iso)", film.format]

    if film.isBulkFilm == true {
      parts.append("spooled")
    }

    parts.append("\(film.availableCount ?? 0) available")

    return parts.joined(separator: " · ")
  }

  /// Prefill the EI this stock was last shot at, falling back to box speed.
  private func applyISOPrefill(for filmId: UUID?) {
    guard let filmId, let film = films.first(where: { $0.id == filmId }) else {
      shotAtISO = ""
      return
    }

    shotAtISO = String(isoPrefills[filmId] ?? film.iso)
  }

  private func save() {
    guard let cameraId, let filmId else { return }

    let trimmedISO = shotAtISO.trimmingCharacters(in: .whitespaces)
    var parsedISO: Int?

    if !trimmedISO.isEmpty {
      guard let value = Int(trimmedISO), value > 0 else {
        errorMessage = "Shooting EI must be a number greater than zero."
        return
      }
      parsedISO = value
    }

    errorMessage = nil
    isSaving = true

    Task {
      do {
        try await service.loadFilm(
          cameraId: cameraId,
          filmId: filmId,
          shotAtISO: parsedISO,
          notes: notes
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
