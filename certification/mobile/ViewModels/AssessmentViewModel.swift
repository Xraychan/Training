import Foundation
import Combine

class AssessmentViewModel: ObservableObject {
    @Published var templates: [FormTemplate] = []
    @Published var selectedTemplate: FormTemplate?
    @Published var answers: [String: Any] = [:]
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let api = APIService.shared
    
    @MainActor
    func loadTemplates() async {
        isLoading = true
        errorMessage = nil
        do {
            self.templates = try await api.getTemplates()
            if self.selectedTemplate == nil {
                self.selectedTemplate = self.templates.first
            }
        } catch {
            self.errorMessage = "Failed to load templates: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    @MainActor
    func submit() async {
        guard let template = selectedTemplate else { return }
        
        isLoading = true
        // In a real app, get trainer info from a SessionManager
        let submission: [String: Any] = [
            "templateId": template.id.uuidString,
            "trainerId": "current-user-uid",
            "trainerName": "John Doe",
            "departmentId": "dept-id",
            "groupId": "group-id",
            "answers": answers,
            "status": "PENDING"
        ]
        
        do {
            try await api.submitAssessment(submission: submission)
            // Handle success (e.g., clear form, show alert)
        } catch {
            self.errorMessage = "Submission failed: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    func updateAnswer(for questionId: String, value: Any) {
        answers[questionId] = value
    }
}
