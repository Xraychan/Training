import SwiftUI

@main
struct CertifyProApp: App {
    @State private var isAuthenticated = false
    
    var body: some Scene {
        WindowGroup {
            if isAuthenticated {
                AssessmentView()
            } else {
                LoginView(isAuthenticated: $isAuthenticated)
            }
        }
    }
}
