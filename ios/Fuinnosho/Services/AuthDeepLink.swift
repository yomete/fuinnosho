import Foundation

enum AuthDeepLink {
  static let resetPasswordRedirectURL = URL(string: "fuinnosho://auth/callback")!

  static func isAuthCallback(_ url: URL) -> Bool {
    url.scheme == "fuinnosho" && url.host == "auth" && url.path == "/callback"
  }

  static func isPasswordRecovery(_ url: URL) -> Bool {
    guard isAuthCallback(url) else { return false }

    let params = parameters(from: url)
    return params["type"] == "recovery" || params["code"] != nil
  }

  private static func parameters(from url: URL) -> [String: String] {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return [:]
    }

    var result: [String: String] = [:]
    components.queryItems?.forEach { item in
      result[item.name] = item.value
    }

    if let fragment = components.fragment {
      fragment
        .split(separator: "&")
        .map { $0.split(separator: "=", maxSplits: 1) }
        .forEach { pair in
          if pair.count == 2 {
            result[String(pair[0])] = String(pair[1])
          }
        }
    }

    return result
  }
}
