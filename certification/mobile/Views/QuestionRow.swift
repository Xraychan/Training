import SwiftUI

struct QuestionRow: View {
    let question: FormQuestion
    @Binding var answer: Any?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(question.label)
                .font(.headline)
                .foregroundColor(.primary)
            
            if let desc = question.description {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            inputField
        }
        .padding(.vertical, 4)
    }
    
    @ViewBuilder
    private var inputField: some View {
        switch question.type {
        case .text:
            TextField("Enter answer", text: Binding(
                get: { (answer as? String) ?? "" },
                set: { answer = $0 }
            ))
            .textFieldStyle(RoundedBorderTextFieldStyle())
            
        case .radio, .select:
            Picker("Select", selection: Binding(
                get: { (answer as? String) ?? "" },
                set: { answer = $0 }
            )) {
                ForEach(question.options ?? [], id: \.self) { option in
                    Text(option).tag(option)
                }
            }
            .pickerStyle(MenuPickerStyle())
            
        case .checkbox:
            Toggle(isOn: Binding(
                get: { (answer as? Bool) ?? false },
                set: { answer = $0 }
            )) {
                Text("Confirmed")
            }
        }
    }
}
