import Foundation

enum AppError: LocalizedError {
  case missingSupabaseConfiguration
  case notAuthenticated
  case message(String)

  var errorDescription: String? {
    switch self {
    case .missingSupabaseConfiguration:
      "Add a valid SUPABASE_URL and SUPABASE_ANON_KEY in ios/Fuinnosho/Configuration/Secrets.xcconfig."
    case .notAuthenticated:
      "Sign in before continuing."
    case .message(let message):
      message
    }
  }
}
