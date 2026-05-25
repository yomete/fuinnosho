import SwiftUI

struct GearListView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var service = InventoryService()
  @State private var gear: [Gear] = []
  @State private var errorMessage: String?
  @State private var isLoading = false
  @State private var isShowingNewGear = false

  var body: some View {
    List {
      if isLoading && gear.isEmpty {
        ProgressView()
      }

      ForEach(gear) { item in
        NavigationLink {
          GearDetailView(gear: item) {
            await reload()
          }
        } label: {
          VStack(alignment: .leading, spacing: 6) {
            Text(item.name)
              .font(.headline)
            Text("\(item.brand) · \(item.type.rawValue.capitalized)")
              .font(.subheadline)
              .foregroundStyle(.secondary)
            Text(item.condition.rawValue.capitalized)
              .font(.caption)
              .foregroundStyle(FuinnoshoTheme.accent)
          }
          .padding(.vertical, 4)
        }
      }
    }
    .navigationTitle("Gear")
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        Button {
          isShowingNewGear = true
        } label: {
          Label("Add Gear", systemImage: "plus")
        }
      }
    }
    .overlay {
      if gear.isEmpty && !isLoading {
        ContentUnavailableView("No gear yet", systemImage: "camera", description: Text("Add cameras, lenses, and accessories."))
      }
    }
    .alert("Gear Error", isPresented: Binding(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(errorMessage ?? "")
    }
    .sheet(isPresented: $isShowingNewGear) {
      NewGearView {
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
      DebugLoadStatusView(label: "Gear", count: gear.count)
    }
  }

  private func reload() async {
    isLoading = true
    defer { isLoading = false }

    do {
      gear = try await service.listGear()
    } catch {
      if await authStore.signOutIfAuthenticationFailed(error) {
        return
      }

      errorMessage = error.localizedDescription
    }
  }
}
