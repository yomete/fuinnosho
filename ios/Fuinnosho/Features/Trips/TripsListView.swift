import SwiftUI

struct TripsListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var trips: [Trip] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingNewTrip = false

  var body: some View {
    List {
      if isLoading && trips.isEmpty {
        ProgressView()
      }

      ForEach(trips) { trip in
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
      if trips.isEmpty && !isLoading {
        ContentUnavailableView("No trips yet", systemImage: "map", description: Text("Plan your next photo trip."))
      }
    }
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
      DebugLoadStatusView(label: "Trips", count: trips.count)
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
