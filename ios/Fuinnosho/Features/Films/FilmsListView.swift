import SwiftUI

struct FilmsListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var films: [Film] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingNewFilm = false
  @State private var filmsPendingDeletion: [Film] = []

  var body: some View {
    List {
      if isLoading && films.isEmpty {
        ProgressView()
      }

      ForEach(films) { film in
        NavigationLink {
          FilmDetailView(film: film) {
            await reload()
          }
        } label: {
          VStack(alignment: .leading, spacing: 6) {
            Text(film.name)
              .font(.headline)
            Text("\(film.brand) · ISO \(film.iso) · \(film.format)")
              .font(.subheadline)
              .foregroundStyle(.secondary)
            Text("\(film.availableCount ?? film.count ?? 0) available")
              .font(.caption)
              .foregroundStyle(FuinnoshoTheme.accent)
          }
          .padding(.vertical, 4)
        }
      }
      .onDelete(perform: deleteFilms)
    }
    .navigationTitle("Films")
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button {
          isShowingNewFilm = true
        } label: {
          Label("Add Film", systemImage: "plus")
        }
      }
    }
    .overlay {
      if films.isEmpty && !isLoading {
        ContentUnavailableView("No films yet", systemImage: "film", description: Text("Add the first roll from your mobile inventory."))
      }
    }
    .alert("Films Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(errorMessage ?? "")
    }
    .confirmationDialog(
      "Move film to trash?",
      isPresented: Binding(
        get: { !filmsPendingDeletion.isEmpty },
        set: { if !$0 { filmsPendingDeletion = [] } }
      ),
      titleVisibility: .visible
    ) {
      Button("Move to Trash", role: .destructive) {
        confirmDeleteFilms()
      }
      Button("Cancel", role: .cancel) {
        filmsPendingDeletion = []
      }
    } message: {
      Text("This keeps the film recoverable from the web app trash.")
    }
    .sheet(isPresented: $isShowingNewFilm) {
      NewFilmView {
        await reload()
      }
    }
    .task {
      await reload()
    }
    .onChange(of: authStore.signedInEmail) { _, email in
      guard email != nil else { return }
      Task {
        await reload()
      }
    }
    .refreshable {
      await reload()
    }
    .safeAreaInset(edge: .bottom) {
      DebugLoadStatusView(label: "Films", count: films.count)
    }
  }

  private func reload() async {
    isLoading = true
    defer { isLoading = false }

    do {
      films = try await service.listFilms()
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func deleteFilms(at offsets: IndexSet) {
    filmsPendingDeletion = offsets.map { films[$0] }
  }

  private func confirmDeleteFilms() {
    let selectedFilms = filmsPendingDeletion
    filmsPendingDeletion = []

    Task {
      do {
        for film in selectedFilms {
          try await service.deleteFilm(film)
        }
        await reload()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }
}
