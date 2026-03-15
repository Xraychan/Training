import Foundation
import LocalAuthentication

class BiometricManager {
    static let shared = BiometricManager()
    
    private let context = LAContext()
    
    enum BiometricType {
        case none
        case touchID
        case faceID
    }
    
    var biometricType: BiometricType {
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }
        
        switch context.biometryType {
        case .touchID: return .touchID
        case .faceID: return .faceID
        case .none: return .none
        @unknown default: return .none
        }
    }
    
    func authenticateUser(completion: @escaping (Bool, String?) -> Void) {
        let reason = "Authenticate to access your assessments."
        
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, error in
            DispatchQueue.main.async {
                if success {
                    completion(true, nil)
                } else {
                    let message = error?.localizedDescription ?? "Authentication failed"
                    completion(false, message)
                }
            }
        }
    }
}
