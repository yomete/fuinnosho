import SwiftUI

struct NowListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var cameraStates: [CameraLoadState] = []
  @State private var availableFilms: [Film] = []
  @State private var trips: [Trip] = []
  @State private var isoPrefills: [UUID: Int] = [:]
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingLoadFilm = false
  @State private var rollToFinish: LoadedFilm?

  private var loadedRolls: [LoadedFilm] {
    cameraStates.compactMap(\.loaded)
  }

  private var emptyCameras: [CameraLoadState] {
    cameraStates.filter { $0.loaded == nil }
  }

  var body: some View {
    List {
      if isLoading && cameraStates.isEmpty {
        ProgressView()
      }

      if let errorMessage {
        Section {
          Text(errorMessage)
            .foregroundStyle(.red)
        }
      }

      if !isLoading && cameraStates.isEmpty && errorMessage == nil {
        Section {
          ContentUnavailableView(
            "No cameras yet",
            systemImage: "camera",
            description: Text("Add a camera in Gear, then load a roll into it here.")
          )
        }
      }

      if !loadedRolls.isEmpty {
        Section("In your cameras (\(loadedRolls.count))") {
          ForEach(loadedRolls) { entry in
            LoadedRollRow(entry: entry) {
              rollToFinish = entry
            }
          }
        }
      } else if !cameraStates.isEmpty {
        Section {
          ContentUnavailableView(
            "Nothing loaded",
            systemImage: "film",
            description: Text("When you put a roll in a camera, save it here and you'll never have to guess what's in there again.")
          )
        }
      }

      if !emptyCameras.isEmpty && !loadedRolls.isEmpty {
        Section("Empty (\(emptyCameras.count))") {
          ForEach(emptyCameras) { state in
            Text(state.camera.displayName)
              .foregroundStyle(.secondary)
          }
        }
      }
    }
    .navigationTitle("Now")
    .toolbar {
      ToolbarItem(placement: .primaryAction) {
        Button {
          isShowingLoadFilm = true
        } label: {
          Label("Load a Roll", systemImage: "plus")
        }
        .disabled(cameraStates.isEmpty)
      }
    }
    .refreshable {
      await load()
    }
    .task {
      await load()
    }
    .sheet(isPresented: $isShowingLoadFilm) {
      LoadFilmView(
        cameras: cameraStates,
        films: availableFilms,
        isoPrefills: isoPrefills
      ) {
        await load()
      }
    }
    .sheet(item: $rollToFinish) { entry in
      FinishRollView(entry: entry, trips: trips) {
        await load()
      }
    }
  }

  private func load() async {
    isLoading = true

    do {
      async let cameraRows = service.listCameraLoadStates()
      async let filmRows = service.listFilmsAvailableToLoad()
      async let prefillRows = service.loadedFilmISOPrefills()
      async let tripRows = service.listTrips()

      cameraStates = try await cameraRows
      availableFilms = try await filmRows
      isoPrefills = try await prefillRows
      trips = try await tripRows
      errorMessage = nil
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }

    isLoading = false
  }
}

private struct LoadedRollRow: View {
  let entry: LoadedFilm
  let onFinish: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(entry.camera?.displayName ?? "Unknown camera")
        .font(.headline)
      Text(entry.film?.displayName ?? "Unknown film")
        .foregroundStyle(.secondary)

      HStack(spacing: 8) {
        if let boxSpeed = entry.film?.iso {
          Text("ISO \(boxSpeed)")
        }
        if entry.isPushedOrPulled, let shotAtISO = entry.shotAtISO {
          Text("Shooting at EI \(shotAtISO)")
            .foregroundStyle(FuinnoshoTheme.accent)
        }
        if let format = entry.film?.format {
          Text(format)
        }
        if entry.film?.isBulkFilm == true {
          Text("Spooled cassette")
        }
      }
      .font(.caption)
      .foregroundStyle(.secondary)

      Text(LoadedFilmDisplay.loadedDescription(for: entry))
        .font(.caption)
        .foregroundStyle(.secondary)

      if let notes = entry.notes, !notes.isEmpty {
        Text(notes)
          .font(.caption)
          .italic()
          .foregroundStyle(.secondary)
      }

      Button("Finish roll…", action: onFinish)
        .buttonStyle(.bordered)
        .padding(.top, 2)
    }
    .padding(.vertical, 4)
  }
}
