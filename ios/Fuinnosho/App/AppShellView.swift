import SwiftUI

struct AppShellView: View {
  @Environment(AuthSessionStore.self) private var authStore

  var body: some View {
    TabView {
      NavigationStack {
        FilmsListView()
          .toolbar {
            signOutToolbar
          }
      }
      .tabItem {
        Label("Films", systemImage: "film")
      }

      NavigationStack {
        GearListView()
          .toolbar {
            signOutToolbar
          }
      }
      .tabItem {
        Label("Gear", systemImage: "camera")
      }

      NavigationStack {
        TripsListView()
          .toolbar {
            signOutToolbar
          }
      }
      .tabItem {
        Label("Trips", systemImage: "map")
      }

      NavigationStack {
        SettingsView()
      }
      .tabItem {
        Label("Settings", systemImage: "gearshape")
      }
    }
  }

  private var signOutToolbar: some ToolbarContent {
    ToolbarItem(placement: .topBarLeading) {
      Button {
        Task {
          await authStore.signOut()
        }
      } label: {
        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
      }
    }
  }
}
