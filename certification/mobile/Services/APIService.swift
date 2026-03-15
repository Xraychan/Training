import Foundation

enum APIError: Error {
    case invalidURL
    case noData
    case unauthorized
    case serverError(String)
}

class APIService {
    static let shared = APIService()
    private let baseURL = "http://localhost:3010/api" // Update to your static IP or dev URL
    
    private var authToken: String? {
        KeychainManager.shared.get("jwt_token")
    }
    
    func login(email: String, password: String) async throws -> User {
        guard let url = URL(string: "\(baseURL)/auth/login") else { throw APIError.invalidURL }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.noData }
        
        if httpResponse.statusCode == 200 {
            let result = try JSONDecoder().decode(LoginResponse.self, from: data)
            KeychainManager.shared.save(result.token, for: "jwt_token")
            return result.user
        } else {
            throw APIError.unauthorized
        }
    }
    
    func getTemplates() async throws -> [FormTemplate] {
        guard let url = URL(string: "\(baseURL)/templates") else { throw APIError.invalidURL }
        
        var request = URLRequest(url: url)
        if let token = authToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode([FormTemplate].self, from: data)
    }
    
    func submitAssessment(submission: [String: Any]) async throws {
        guard let url = URL(string: "\(baseURL)/submissions") else { throw APIError.invalidURL }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = authToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: submission)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.serverError("Submission failed")
        }
    }
}

struct LoginResponse: Codable {
    let token: String
    let user: User
}
