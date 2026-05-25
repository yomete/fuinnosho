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
      sessionState = .signedOut
      return
    }

    await validateSession(candidate: service.client.auth.currentSession)
  }

  func signIn(email: String, password: String) async {
    errorMessage = nil

    if let configurationError = service.configurationError {
      errorMessage = configurationError.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
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
        sessionState = .signedOut
        return
      }

      await validateSession(candidate: response.session)
    } catch {
      errorMessage = error.localizedDescription
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      sessionState = .signedOut
    }
  }

  func signOut() async {
    errorMessage = nil

    do {
      try await service.client.auth.signOut()
      service.setAuthenticatedUserId(nil)
      signedInEmail = nil
      sessionState = .signedOut
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func signOutIfAuthenticationFailed(_ error: Error) async -> Bool {
    guard Self.isAuthenticationFailure(error) else { return false }

    errorMessage = "Your session expired. Sign in again."
    try? await service.client.auth.signOut()
    service.setAuthenticatedUserId(nil)
    signedInEmail = nil
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
}
