import SwiftUI

struct PasswordResetView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(AuthSessionStore.self) private var authStore

  @State private var email: String
  @State private var isSubmitting = false
  @State private var didSend = false

  init(email: String) {
    _email = State(initialValue: email)
  }

  var body: some View {
    NavigationStack {
      Form {
        Section {
          TextField("Email", text: $email)
            .textContentType(.emailAddress)
            .keyboardType(.emailAddress)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        }

        if didSend {
          Section {
            Text("Check your email for a password reset link.")
              .foregroundStyle(.secondary)
          }
        }

        if let errorMessage = authStore.errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Reset Password")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            dismiss()
          }
        }

        ToolbarItem(placement: .confirmationAction) {
          Button("Send") {
            send()
          }
          .disabled(isSubmitting || email.isEmpty)
        }
      }
    }
  }

  private func send() {
    isSubmitting = true

    Task {
      await authStore.sendPasswordReset(email: email.trimmingCharacters(in: .whitespaces))
      didSend = authStore.errorMessage == nil
      isSubmitting = false
    }
  }
}
