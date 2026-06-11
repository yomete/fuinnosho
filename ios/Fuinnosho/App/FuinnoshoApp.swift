import SwiftUI

@main
struct FuinnoshoApp: App {
  @State private var authStore = AuthSessionStore()

  var body: some Scene {
    WindowGroup {
      RootView()
        .environment(authStore)
        .tint(FuinnoshoTheme.accent)
        .onOpenURL { url in
          authStore.handleOpenURL(url)
        }
        .task {
          authStore.observeAuthState()
          await authStore.restoreSession()
        }
    }
  }
}
