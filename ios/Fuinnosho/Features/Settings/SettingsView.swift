import SwiftUI

struct SettingsView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var newEmail = ""
  @State private var emailPassword = ""
  @State private var currentPassword = ""
  @State private var newPassword = ""
  @State private var confirmPassword = ""
  @State private var statusMessage: String?
  @State private var isSavingEmail = false
  @State private var isSavingPassword = false

  var body: some View {
    Form {
      Section("Account") {
        LabeledContent("Signed in as", value: authStore.signedInEmail ?? "Unknown")
      }

      Section("Change Email") {
        TextField("New email", text: $newEmail)
          .textContentType(.emailAddress)
          .keyboardType(.emailAddress)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
        SecureField("Current password", text: $emailPassword)
          .textContentType(.password)
        Button {
          changeEmail()
        } label: {
          if isSavingEmail {
            ProgressView()
          } else {
            Text("Update Email")
          }
        }
        .disabled(isSavingEmail || newEmail.isEmpty || emailPassword.isEmpty)
      }

      Section("Change Password") {
        SecureField("Current password", text: $currentPassword)
          .textContentType(.password)
        SecureField("New password", text: $newPassword)
          .textContentType(.newPassword)
        SecureField("Confirm password", text: $confirmPassword)
          .textContentType(.newPassword)
        Button {
          changePassword()
        } label: {
          if isSavingPassword {
            ProgressView()
          } else {
            Text("Update Password")
          }
        }
        .disabled(isSavingPassword || currentPassword.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty)
      }

      if let statusMessage {
        Section {
          Text(statusMessage)
            .foregroundStyle(.secondary)
        }
      }

      if let errorMessage = authStore.errorMessage {
        Section {
          Text(errorMessage)
            .foregroundStyle(.red)
        }
      }

      Section {
        Button(role: .destructive) {
          Task {
            await authStore.signOut()
          }
        } label: {
          Text("Sign Out")
        }
      }
    }
    .navigationTitle("Settings")
  }

  private func changeEmail() {
    isSavingEmail = true
    statusMessage = nil

    Task {
      let success = await authStore.changeEmail(
        newEmail: newEmail.trimmingCharacters(in: .whitespaces),
        password: emailPassword
      )
      if success {
        newEmail = ""
        emailPassword = ""
        statusMessage = "Check your new inbox to confirm the email change."
      }
      isSavingEmail = false
    }
  }

  private func changePassword() {
    guard newPassword == confirmPassword else {
      statusMessage = nil
      authStore.errorMessage = "Passwords do not match."
      return
    }

    isSavingPassword = true
    statusMessage = nil

    Task {
      let success = await authStore.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword
      )
      if success {
        currentPassword = ""
        newPassword = ""
        confirmPassword = ""
        statusMessage = "Password updated."
      }
      isSavingPassword = false
    }
  }
}
