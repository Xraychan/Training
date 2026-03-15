import SwiftUI

struct LoginView: View {
    @Binding var isAuthenticated: Bool
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 30) {
            headerSection
            
            VStack(spacing: 15) {
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            .padding(.horizontal)
            
            loginButton
            
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Spacer()
        }
        .padding(.top, 50)
    }
    
    private var headerSection: some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            Text("CertifyPro")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Professional Clinical Assessment")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    private var loginButton: some View {
        Button(action: performLogin) {
            ZStack {
                Text("Sign In")
                    .fontWeight(.bold)
                    .opacity(isLoading ? 0 : 1)
                
                if isLoading {
                    ProgressView()
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .padding(.horizontal)
        .disabled(isLoading || email.isEmpty || password.isEmpty)
    }
    
    private func performLogin() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                _ = try await APIService.shared.login(email: email, password: password)
                await MainActor.run {
                    isAuthenticated = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Login failed. Please check your credentials."
                    isLoading = false
                }
            }
        }
    }
}

#Preview {
    LoginView(isAuthenticated: .constant(false))
}
