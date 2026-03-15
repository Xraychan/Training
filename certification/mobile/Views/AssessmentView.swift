import SwiftUI

struct AssessmentView: View {
    @StateObject var viewModel = AssessmentViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Syncing with Server...")
                }
                
                if let template = viewModel.selectedTemplate {
                    Form {
                        Section(header: Text("Assessment Details")) {
                            Text(template.description ?? "No description provided.")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        ForEach(template.pages) { page in
                            ForEach(page.sections) { content in
                                switch content {
                                case .section(let section):
                                    Section(header: Text(section.title)) {
                                        if let desc = section.description {
                                            Text(desc).font(.caption)
                                        }
                                    }
                                case .question(let question):
                                    QuestionRow(
                                        question: question,
                                        answer: Binding(
                                            get: { viewModel.answers[question.id.uuidString] },
                                            set: { viewModel.updateAnswer(for: question.id.uuidString, value: $0 as Any) }
                                        )
                                    )
                                }
                            }
                        }
                        
                        Section {
                            Button(action: {
                                Task { await viewModel.submit() }
                            }) {
                                Text("Submit Assessment")
                                    .frame(maxWidth: .infinity)
                                    .fontWeight(.bold)
                            }
                            .disabled(viewModel.isLoading)
                        }
                    }
                } else if !viewModel.isLoading {
                    VStack {
                        Text("No Assessment Template Found")
                        Button("Retry") {
                            Task { await viewModel.loadTemplates() }
                        }
                    }
                }
            }
            .navigationTitle(viewModel.selectedTemplate?.title ?? "Assessment")
            .onAppear {
                Task { await viewModel.loadTemplates() }
            }
            .alert(item: Binding<AlertError?>(
                get: { viewModel.errorMessage.map { AlertError(message: $0) } },
                set: { _ in viewModel.errorMessage = nil }
            )) { error in
                Alert(title: Text("Error"), message: Text(error.message), dismissButton: .default(Text("OK")))
            }
        }
    }
}

struct AlertError: Identifiable {
    let id = UUID()
    let message: String
}

#Preview {
    AssessmentView()
}
