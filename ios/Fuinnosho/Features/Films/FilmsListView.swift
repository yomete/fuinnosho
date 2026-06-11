import SwiftUI

private enum FilmStockFilter: String, CaseIterable, Identifiable {
  case all = "All Stock"
  case available = "Available"
  case reserved = "Reserved"
  case empty = "Empty"
  case bulk = "Bulk"
  case ecn = "ECN-2"

  var id: String { rawValue }
}

struct FilmsListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var films: [Film] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingNewFilm = false
  @State private var isShowingDeletedFilms = false
  @State private var filmsPendingDeletion: [Film] = []
  @State private var searchText = ""
  @State private var selectedFormat = "All"
  @State private var selectedType = "All"
  @State private var stockFilter: FilmStockFilter = .all

  var body: some View {
    List {
      if isLoading && films.isEmpty {
        ProgressView()
      }

      if !films.isEmpty {
        Section("Summary") {
          LabeledContent("Films", value: "\(films.count)")
          LabeledContent("Rolls", value: "\(films.reduce(0) { $0 + ($1.count ?? 0) })")
          LabeledContent("Available", value: "\(films.reduce(0) { $0 + ($1.availableCount ?? $1.count ?? 0) })")
          LabeledContent("Expiring soon", value: "\(expiringSoonRolls)")
        }

        if !typeBreakdown.isEmpty {
          Section("Distribution") {
            ForEach(typeBreakdown, id: \.type) { item in
              LabeledContent(item.type, value: "\(item.count)")
            }
          }
        }

        if !expiringFilms.isEmpty {
          Section("Expiration Timeline") {
            ForEach(expiringFilms.prefix(8)) { film in
              VStack(alignment: .leading, spacing: 4) {
                HStack {
                  Text(film.name)
                    .fontWeight(.medium)
                  Spacer()
                  Text("\(film.availableCount ?? film.count ?? 0)")
                    .font(.caption)
                    .foregroundStyle(FuinnoshoTheme.accent)
                }

                Text(expirationStatus(for: film))
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
            }
          }
        }
      }

      if !films.isEmpty {
        Section("Filters") {
          Picker("Format", selection: $selectedFormat) {
            Text("All").tag("All")
            ForEach(availableFormats, id: \.self) { format in
              Text(format).tag(format)
            }
          }

          Picker("Type", selection: $selectedType) {
            Text("All").tag("All")
            ForEach(availableTypes, id: \.self) { type in
              Text(type).tag(type)
            }
          }

          Picker("Stock", selection: $stockFilter) {
            ForEach(FilmStockFilter.allCases) { filter in
              Text(filter.rawValue).tag(filter)
            }
          }

          if hasActiveFilters {
            Button("Clear Filters") {
              clearFilters()
            }
          }
        }
      }

      ForEach(filteredFilms) { film in
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
      ToolbarItemGroup(placement: .topBarTrailing) {
        Button {
          isShowingDeletedFilms = true
        } label: {
          Label("Deleted Films", systemImage: "archivebox")
        }

        Button {
          isShowingNewFilm = true
        } label: {
          Label("Add Film", systemImage: "plus")
        }
      }
    }
    .overlay {
      if filteredFilms.isEmpty && !isLoading {
        ContentUnavailableView("No films yet", systemImage: "film", description: Text("Add the first roll from your mobile inventory."))
      }
    }
    .searchable(text: $searchText, prompt: "Search films")
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
    .sheet(isPresented: $isShowingDeletedFilms) {
      DeletedFilmsView {
        await reload()
      }
    }
    .task {
      await reload()
    }
    .refreshable {
      await reload()
    }
    .safeAreaInset(edge: .bottom) {
      DebugLoadStatusView(label: "Films", count: filteredFilms.count)
    }
  }

  private var filteredFilms: [Film] {
    let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

    return films.filter { film in
      let matchesSearch = query.isEmpty
        || film.name.lowercased().contains(query)
        || film.brand.lowercased().contains(query)
        || film.format.lowercased().contains(query)
        || film.type.lowercased().contains(query)

      return matchesSearch
        && (selectedFormat == "All" || film.format == selectedFormat)
        && (selectedType == "All" || film.type == selectedType)
        && matchesStockFilter(film)
    }
  }

  private var availableFormats: [String] {
    Array(Set(films.map(\.format))).sorted()
  }

  private var availableTypes: [String] {
    Array(Set(films.map(\.type))).sorted()
  }

  private var expiringSoonRolls: Int {
    films.reduce(0) { total, film in
      guard let expirationDate = parsedExpirationDate(for: film),
            expirationDate <= Calendar.current.date(byAdding: .month, value: 3, to: Date()) ?? Date()
      else {
        return total
      }

      return total + (film.availableCount ?? film.count ?? 0)
    }
  }

  private var expiringFilms: [Film] {
    films
      .filter { film in
        guard let expirationDate = parsedExpirationDate(for: film) else { return false }
        return expirationDate <= Calendar.current.date(byAdding: .month, value: 3, to: Date()) ?? Date()
          && (film.availableCount ?? film.count ?? 0) > 0
      }
      .sorted { first, second in
        (parsedExpirationDate(for: first) ?? .distantFuture) < (parsedExpirationDate(for: second) ?? .distantFuture)
      }
  }

  private var typeBreakdown: [(type: String, count: Int)] {
    let grouped = films.reduce(into: [String: Int]()) { result, film in
      result[film.type, default: 0] += film.availableCount ?? film.count ?? 0
    }

    return grouped
      .map { (type: $0.key, count: $0.value) }
      .sorted { first, second in
        if first.count == second.count {
          return first.type < second.type
        }

        return first.count > second.count
      }
  }

  private var hasActiveFilters: Bool {
    selectedFormat != "All" || selectedType != "All" || stockFilter != .all
  }

  private func matchesStockFilter(_ film: Film) -> Bool {
    switch stockFilter {
    case .all:
      return true
    case .available:
      return (film.availableCount ?? film.count ?? 0) > 0
    case .reserved:
      return (film.reservedQuantity ?? 0) > 0
    case .empty:
      return (film.availableCount ?? film.count ?? 0) == 0
    case .bulk:
      return film.isBulkFilm == true
    case .ecn:
      return film.isECN == true
    }
  }

  private func clearFilters() {
    selectedFormat = "All"
    selectedType = "All"
    stockFilter = .all
  }

  private func parsedExpirationDate(for film: Film) -> Date? {
    guard let expirationDate = film.expirationDate else { return nil }
    return DateFormatter.fuinnoshoDate.date(from: expirationDate)
  }

  private func expirationStatus(for film: Film) -> String {
    guard let expirationDate = parsedExpirationDate(for: film) else {
      return "No expiration date"
    }

    let days = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
    let dateText = film.expirationDate ?? ""

    if days < 0 {
      return "Expired \(abs(days)) days ago · \(dateText)"
    }

    if days <= 30 {
      return "This month · \(dateText)"
    }

    return "Within 3 months · \(dateText)"
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
    let visibleFilms = filteredFilms
    filmsPendingDeletion = offsets.map { visibleFilms[$0] }
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

private extension DateFormatter {
  static let fuinnoshoDate: DateFormatter = {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter
  }()
}
