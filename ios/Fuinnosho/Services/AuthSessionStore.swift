import Foundation
import Observation
import Supabase

enum SessionState {
  case checking
  case signedOut
  case signedIn
}

@MainActor
@Observable
final class AuthSessionStore {
  var sessionState: SessionState = .checking
  var errorMessage: String?
  var signedInEmail: String?
  var needsPasswordResetUpdate = false
  var isHandlingAuthLink = false

  @ObservationIgnored
  private var authStateTask: Task<Void, Never>?

  private let service: SupabaseService

  init(service: SupabaseService = .shared) {
    self.service = service
  }

  func observeAuthState() {
    guard authStateTask == nil else { return }

    authStateTask = Task { @MainActor in
      for await (event, session) in service.client.auth.authStateChanges {
        switch event {
        case .initialSession, .signedIn:
          await validateSession(candidate: session)
        case .signedOut:
          service.setAuthenticatedUserId(nil)
          signedInEmail = nil
          needsPasswordResetUpdate = false
          sessionState = .signedOut
        default:
          break
        }
      }
    }
  }

  func restoreSession() async {
    if let configurationError = service.configurationError {
      errorMessage = configurationError.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      needsPasswordResetUpdate = false
      sessionState = .signedOut
      return
    }

    await validateSession(candidate: service.client.auth.currentSession)

    #if DEBUG
      if sessionState == .signedOut {
        await signInWithDebugLaunchArguments()
      }
    #endif
  }

  func signIn(email: String, password: String) async {
    errorMessage = nil

    if let configurationError = service.configurationError {
      errorMessage = configurationError.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      needsPasswordResetUpdate = false
      sessionState = .signedOut
      return
    }

    do {
      let session = try await service.client.auth.signIn(email: email, password: password)
      await validateSession(candidate: session)
    } catch {
      errorMessage = error.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      needsPasswordResetUpdate = false
      sessionState = .signedOut
    }
  }

  func signUp(email: String, password: String) async {
    errorMessage = nil

    if let configurationError = service.configurationError {
      errorMessage = configurationError.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      sessionState = .signedOut
      return
    }

    do {
      let response = try await service.client.auth.signUp(email: email, password: password)
      if response.session == nil {
        errorMessage = "Check your email to confirm your account, then sign in."
        service.setAuthenticatedUserId(nil)
        signedInEmail = nil
        needsPasswordResetUpdate = false
        sessionState = .signedOut
        return
      }

      await validateSession(candidate: response.session)
    } catch {
      errorMessage = error.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      needsPasswordResetUpdate = false
      sessionState = .signedOut
    }
  }

  func signOut() async {
    errorMessage = nil

    do {
      try await service.client.auth.signOut()
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      needsPasswordResetUpdate = false
      sessionState = .signedOut
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func sendPasswordReset(email: String) async {
    errorMessage = nil

    do {
      try await service.client.auth.resetPasswordForEmail(
        email,
        redirectTo: AuthDeepLink.resetPasswordRedirectURL
      )
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func handleOpenURL(_ url: URL) {
    guard AuthDeepLink.isAuthCallback(url) else { return }

    errorMessage = nil
    isHandlingAuthLink = true
    needsPasswordResetUpdate = AuthDeepLink.isPasswordRecovery(url)

    Task {
      do {
        let session = try await service.client.auth.session(from: url)
        await validateSession(candidate: session)
      } catch {
        errorMessage = error.localizedDescription
        service.setAuthenticatedUserId(nil)
        signedInEmail = nil
        needsPasswordResetUpdate = false
        sessionState = .signedOut
      }

      isHandlingAuthLink = false
    }
  }

  func finishPasswordReset(newPassword: String) async {
    errorMessage = nil

    do {
      try await service.client.auth.update(user: UserAttributes(password: newPassword))
      needsPasswordResetUpdate = false
      try await service.client.auth.signOut()
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      sessionState = .signedOut
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func changePassword(currentPassword: String, newPassword: String) async -> Bool {
    errorMessage = nil

    guard let email = signedInEmail else {
      errorMessage = "Not authenticated."
      return false
    }

    do {
      _ = try await service.client.auth.signIn(email: email, password: currentPassword)
      try await service.client.auth.update(user: UserAttributes(password: newPassword))
      return true
    } catch {
      errorMessage = error.localizedDescription
      return false
    }
  }

  func changeEmail(newEmail: String, password: String) async -> Bool {
    errorMessage = nil

    guard let email = signedInEmail else {
      errorMessage = "Not authenticated."
      return false
    }

    if email == newEmail {
      errorMessage = "New email is the same as current email."
      return false
    }

    do {
      _ = try await service.client.auth.signIn(email: email, password: password)
      let user = try await service.client.auth.update(user: UserAttributes(email: newEmail))
      signedInEmail = user.email
      return true
    } catch {
      errorMessage = error.localizedDescription
      return false
    }
  }

  func signOutIfAuthenticationFailed(_ error: Error) async -> Bool {
    guard Self.isAuthenticationFailure(error) else { return false }

    errorMessage = "Your session expired. Sign in again."
    try? await service.client.auth.signOut()
    service.setAuthenticatedUserId(nil)
    signedInEmail = nil
    needsPasswordResetUpdate = false
    sessionState = .signedOut
    return true
  }

  private func validateSession(candidate: Session?) async {
    guard let candidate else {
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      sessionState = .signedOut
      return
    }

    service.setAuthenticatedUserId(candidate.user.id.uuidString)
    signedInEmail = candidate.user.email
    sessionState = .signedIn
  }

  private static func isAuthenticationFailure(_ error: Error) -> Bool {
    if let appError = error as? AppError {
      switch appError {
      case .notAuthenticated:
        return true
      case .message(let message):
        return message.contains("Auth session unavailable")
      case .missingSupabaseConfiguration:
        return false
      }
    }

    let message = error.localizedDescription.lowercased()
    return message.contains("auth session unavailable")
      || message.contains("not authenticated")
      || message.contains("jwt")
  }

  #if DEBUG
    private func signInWithDebugLaunchArguments() async {
      let arguments = ProcessInfo.processInfo.arguments
      guard
        let email = Self.launchArgumentValue("MobileSmokeEmail", in: arguments),
        let password = Self.launchArgumentValue("MobileSmokePassword", in: arguments)
      else {
        return
      }

      await signIn(email: email, password: password)
    }

    private static func launchArgumentValue(_ name: String, in arguments: [String]) -> String? {
      guard let index = arguments.firstIndex(of: "-\(name)") else {
        return nil
      }

      let valueIndex = arguments.index(after: index)
      guard arguments.indices.contains(valueIndex) else {
        return nil
      }

      return arguments[valueIndex]
    }
  #endif
}
