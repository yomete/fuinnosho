import SwiftUI

struct UpdatePasswordView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var password = ""
  @State private var confirmPassword = ""
  @State private var isSubmitting = false

  var body: some View {
    NavigationStack {
      Form {
        Section {
          SecureField("New password", text: $password)
            .textContentType(.newPassword)
          SecureField("Confirm password", text: $confirmPassword)
            .textContentType(.newPassword)
        }

        if authStore.isHandlingAuthLink {
          Section {
            HStack {
              ProgressView()
              Text("Verifying reset link")
                .foregroundStyle(.secondary)
            }
          }
        }

        if let errorMessage = authStore.errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Update Password")
      .toolbar {
        ToolbarItem(placement: .confirmationAction) {
          Button("Update") {
            updatePassword()
          }
          .disabled(isSubmitting || authStore.isHandlingAuthLink || password.isEmpty || confirmPassword.isEmpty)
        }
      }
    }
  }

  private func updatePassword() {
    guard password == confirmPassword else {
      authStore.errorMessage = "Passwords do not match."
      return
    }

    guard password.count >= 8 else {
      authStore.errorMessage = "Password must be at least 8 characters long."
      return
    }

    isSubmitting = true

    Task {
      await authStore.finishPasswordReset(newPassword: password)
      isSubmitting = false
    }
  }
}
