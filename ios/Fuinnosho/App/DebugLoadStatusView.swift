import SwiftUI

struct DebugLoadStatusView: View {
  @Environment(AuthSessionStore.self) private var authStore

  var label: String
  var count: Int

  var body: some View {
    #if DEBUG
      HStack(spacing: 8) {
        Image(systemName: "checkmark.circle")
        Text("\(label): \(count) loaded")

        if let email = authStore.signedInEmail {
          Text(email)
            .lineLimit(1)
            .truncationMode(.middle)
        }
      }
      .font(.caption2)
      .foregroundStyle(.secondary)
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .frame(maxWidth: .infinity)
      .background(.thinMaterial)
    #else
      EmptyView()
    #endif
  }
}
