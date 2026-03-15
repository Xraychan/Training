import Foundation

struct User: Codable, Identifiable {
    let id: UUID
    let email: String
    let name: String
    let role: UserRole
    let departmentId: String?
    let groupId: String?
}

enum UserRole: String, Codable {
    case superAdmin = "SUPER_ADMIN"
    case admin = "ADMIN"
    case manager = "MANAGER"
    case trainer = "TRAINER"
}

struct FormTemplate: Codable, Identifiable {
    let id: UUID
    let title: String
    let description: String?
    let pages: [FormPage]
    let theme: FormTheme?
}

struct FormPage: Codable, Identifiable {
    let id: UUID
    let sections: [FormSectionContent]
}

enum FormSectionContent: Codable, Identifiable {
    case section(FormSection)
    case question(FormQuestion)
    
    var id: UUID {
        switch self {
        case .section(let s): return s.id
        case .question(let q): return q.id
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case type, data
    }
    
    init(from decoder: Decoder) throws {
        // Custom decoding for the polymorphic section/question array
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // Implementation for polymorphic decoding...
        throw NSError(domain: "Not Implemented", code: 0)
    }
    
    func encode(to encoder: Encoder) throws {
        // Implementation for polymorphic encoding...
    }
}

struct FormSection: Codable, Identifiable {
    let id: UUID
    let title: String
    let description: String?
}

struct FormQuestion: Codable, Identifiable {
    let id: UUID
    let type: QuestionType
    let label: String
    let description: String?
    let required: Bool
    let options: [String]?
}

enum QuestionType: String, Codable {
    case text = "TEXT"
    case radio = "RADIO"
    case select = "SELECT"
    case checkbox = "CHECKBOX"
}

struct FormTheme: Codable {
    let backgroundColor: String
    let accentColor: String
    let borderRadius: Int
}
