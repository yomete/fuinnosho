import SwiftUI

struct RootView: View {
  @Environment(AuthSessionStore.self) private var authStore

  var body: some View {
    Group {
      switch authStore.sessionState {
      case .checking:
        ProgressView()
      case .signedOut:
        SignInView()
      case .signedIn:
        AppShellView()
      }
    }
  }
}
