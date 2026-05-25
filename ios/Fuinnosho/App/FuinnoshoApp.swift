import SwiftUI

@main
struct FuinnoshoApp: App {
  @State private var authStore = AuthSessionStore()

  var body: some Scene {
    WindowGroup {
      RootView()
        .environment(authStore)
        .tint(FuinnoshoTheme.accent)
        .task {
          authStore.observeAuthState()
          await authStore.restoreSession()
        }
    }
  }
}
