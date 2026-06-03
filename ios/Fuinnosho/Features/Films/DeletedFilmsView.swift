import SwiftUI

private enum DeletedFilmAction: Identifiable {
  case restore(Film)
  case delete(Film)

  var id: String {
    switch self {
    case .restore(let film): "restore-\(film.id)"
    case .delete(let film): "delete-\(film.id)"
    }
  }
}

private struct DeletedFilmRow: View {
  let film: Film

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(film.name)
        .font(.headline)
      Text(subtitle)
        .font(.subheadline)
        .foregroundStyle(.secondary)
      if let deletedAt = film.deletedAt {
        Text("Deleted \(deletedAt)")
          .font(.caption)
          .foregroundStyle(.secondary)
      }
    }
  }

  private var subtitle: String {
    "\(film.brand) - ISO \(film.iso) - \(film.format)"
  }
}

struct DeletedFilmsView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  let onChange: () async -> Void

  @State private var service = InventoryService()
  @State private var films: [Film] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var pendingAction: DeletedFilmAction?

  var body: some View {
    NavigationStack {
      list
      .navigationTitle("Deleted Films")
      .overlay {
        if films.isEmpty && !isLoading {
          ContentUnavailableView(
            "No deleted films",
            systemImage: "archivebox",
            description: Text("Films moved to trash will appear here.")
          )
        }
      }
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Done") {
            dismiss()
          }
        }
      }
      .alert("Deleted Films Error", isPresented: Binding(
        get: { errorMessage != nil },
        set: { if !$0 { errorMessage = nil } }
      )) {
        Button("OK", role: .cancel) {}
      } message: {
        Text(errorText)
      }
      .confirmationDialog(
        "Update deleted film?",
        isPresented: Binding(
          get: { pendingAction != nil },
          set: { if !$0 { pendingAction = nil } }
        ),
        titleVisibility: .visible
      ) {
        actionButtons()
      } message: {
        actionMessage()
      }
      .task {
        await reload()
      }
      .refreshable {
        await reload()
      }
    }
  }

  private var list: some View {
    List {
      if isLoading && films.isEmpty {
        ProgressView()
      }

      ForEach(films) { film in
        DeletedFilmRow(film: film)
          .swipeActions(edge: .leading) {
            Button("Restore") {
              pendingAction = .restore(film)
            }
            .tint(.green)
          }
          .swipeActions {
            Button("Delete", role: .destructive) {
              pendingAction = .delete(film)
            }
          }
      }
    }
  }

  private var errorText: String {
    errorMessage ?? ""
  }

  @ViewBuilder
  private func actionButtons() -> some View {
    switch pendingAction {
    case .restore:
      Button("Restore Film") {
        runPendingAction()
      }
    case .delete:
      Button("Permanently Delete", role: .destructive) {
        runPendingAction()
      }
    case nil:
      EmptyView()
    }
    Button("Cancel", role: .cancel) {}
  }

  private func actionMessage() -> Text {
    switch pendingAction {
    case .restore(let film):
      Text("Restore \(film.name) to your active inventory.")
    case .delete(let film):
      Text("Permanently remove \(film.name). This cannot be undone.")
    case nil:
      Text("")
    }
  }

  private func reload() async {
    isLoading = true
    defer { isLoading = false }

    do {
      films = try await service.listDeletedFilms()
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }

  private func run(_ action: DeletedFilmAction) {
    Task {
      do {
        switch action {
        case .restore(let film):
          try await service.restoreFilm(film)
        case .delete(let film):
          try await service.permanentlyDeleteFilm(film)
        }
        await reload()
        await onChange()
      } catch {
        if await authStore.signOutIfAuthenticationFailed(error) {
          return
        }

        errorMessage = error.localizedDescription
      }
    }
  }

  private func runPendingAction() {
    guard let pendingAction else { return }
    self.pendingAction = nil
    run(pendingAction)
  }
}
