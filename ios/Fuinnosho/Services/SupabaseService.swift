import Foundation
import Supabase

@MainActor
final class SupabaseService {
  static let shared = SupabaseService()

  let client: SupabaseClient
  let configurationError: AppError?
  private var authenticatedUserId: String?

  private init() {
    guard
      let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
      let url = URL(string: urlString),
      url.scheme == "https",
      url.host != nil,
      let anonKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
      !anonKey.isEmpty
    else {
      configurationError = .missingSupabaseConfiguration
      client = SupabaseClient(supabaseURL: URL(string: "https://127.0.0.1")!, supabaseKey: "")
      return
    }

      configurationError = nil
      client = SupabaseClient(
        supabaseURL: url,
        supabaseKey: anonKey,
        options: SupabaseClientOptions(
          auth: .init(
            storage: UserDefaultsAuthLocalStorage(),
            storageKey: "fuinnosho.auth.session"
          )
        )
      )
  }

  func currentUserId() async throws -> String {
    if let configurationError {
      throw configurationError
    }

    if let authenticatedUserId {
      return authenticatedUserId
    }

    do {
      return try await client.auth.session.user.id.uuidString
    } catch {
      if let userId = client.auth.currentSession?.user.id.uuidString {
        return userId
      }

      throw AppError.message("Auth session unavailable: \(error.localizedDescription)")
    }
  }

  func setAuthenticatedUserId(_ userId: String?) {
    authenticatedUserId = userId
  }
}

private final class UserDefaultsAuthLocalStorage: AuthLocalStorage, @unchecked Sendable {
  private let defaults = UserDefaults.standard

  func store(key: String, value: Data) throws {
    defaults.set(value, forKey: key)
  }

  func retrieve(key: String) throws -> Data? {
    defaults.data(forKey: key)
  }

  func remove(key: String) throws {
    defaults.removeObject(forKey: key)
  }
}
