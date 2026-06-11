import SwiftUI

struct TripsListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var trips: [Trip] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingNewTrip = false
  @State private var searchText = ""
  @State private var selectedStatus: TripStatus?

  var body: some View {
    List {
      if isLoading && trips.isEmpty {
        ProgressView()
      }

      if !trips.isEmpty {
        Section("Summary") {
          LabeledContent("Trips", value: "\(trips.count)")
          LabeledContent("Reserved rolls", value: "\(trips.reduce(0) { $0 + ($1.reservedFilmCount ?? 0) })")
        }

        Section("Filter") {
          Picker("Status", selection: $selectedStatus) {
            Text("All").tag(nil as TripStatus?)
            ForEach(TripStatus.allCases, id: \.self) { status in
              Text(status.rawValue.capitalized).tag(status as TripStatus?)
            }
          }
        }
      }

      ForEach(filteredTrips) { trip in
        NavigationLink {
          TripDetailView(trip: trip) {
            await reload()
          }
        } label: {
          VStack(alignment: .leading, spacing: 6) {
            Text(trip.title)
              .font(.headline)
            Text("\(trip.startDate) - \(trip.endDate)")
              .font(.subheadline)
              .foregroundStyle(.secondary)
            Text(trip.status.rawValue.capitalized)
              .font(.caption)
              .foregroundStyle(FuinnoshoTheme.accent)
          }
          .padding(.vertical, 4)
        }
      }
    }
    .navigationTitle("Trips")
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button {
          isShowingNewTrip = true
        } label: {
          Label("Add Trip", systemImage: "plus")
        }
      }
    }
    .overlay {
      if filteredTrips.isEmpty && !isLoading {
        ContentUnavailableView("No trips yet", systemImage: "map", description: Text("Plan your next photo trip."))
      }
    }
    .searchable(text: $searchText, prompt: "Search trips")
    .alert("Trips Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(errorMessage ?? "")
    }
    .sheet(isPresented: $isShowingNewTrip) {
      NewTripView {
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
      DebugLoadStatusView(label: "Trips", count: filteredTrips.count)
    }
  }

  private var filteredTrips: [Trip] {
    let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

    return trips.filter { trip in
      let matchesStatus = selectedStatus == nil || trip.status == selectedStatus
      let matchesQuery = query.isEmpty
        || trip.title.lowercased().contains(query)
        || trip.description.lowercased().contains(query)
      return matchesStatus && matchesQuery
    }
  }

  private func reload() async {
    isLoading = true
    defer { isLoading = false }

    do {
      trips = try await service.listTrips()
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }
}
