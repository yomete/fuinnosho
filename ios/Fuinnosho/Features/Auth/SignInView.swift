import SwiftUI

struct SignInView: View {
  @Environment(AuthSessionStore.self) private var authStore

  @State private var email = ""
  @State private var password = ""
  @State private var isCreatingAccount = false
  @State private var isSubmitting = false

  var body: some View {
    NavigationStack {
      VStack(alignment: .leading, spacing: 24) {
        VStack(alignment: .leading, spacing: 8) {
          Text("Fuinnosho")
            .font(.largeTitle)
            .fontWeight(.semibold)
          Text("Track film, gear, and trips from your pocket.")
            .foregroundStyle(.secondary)
        }

        VStack(spacing: 14) {
          TextField("Email", text: $email)
            .textContentType(.emailAddress)
            .keyboardType(.emailAddress)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .textFieldStyle(.roundedBorder)

          SecureField("Password", text: $password)
            .textContentType(isCreatingAccount ? .newPassword : .password)
            .textFieldStyle(.roundedBorder)
        }

        if let errorMessage = authStore.errorMessage {
          Text(errorMessage)
            .font(.footnote)
            .foregroundStyle(.red)
        }

        Button {
          submit()
        } label: {
          HStack {
            if isSubmitting {
              ProgressView()
            }
            Text(isCreatingAccount ? "Create Account" : "Sign In")
          }
          .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .disabled(isSubmitting || email.isEmpty || password.isEmpty)

        Button(isCreatingAccount ? "Already have an account?" : "Create an account") {
          isCreatingAccount.toggle()
        }
        .frame(maxWidth: .infinity)

        Spacer()
      }
      .padding()
      .background(FuinnoshoTheme.background.ignoresSafeArea())
      .foregroundStyle(FuinnoshoTheme.text)
    }
  }

  private func submit() {
    isSubmitting = true

    Task {
      if isCreatingAccount {
        await authStore.signUp(email: email.trimmingCharacters(in: .whitespaces), password: password)
      } else {
        await authStore.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
      }

      isSubmitting = false
    }
  }
}
