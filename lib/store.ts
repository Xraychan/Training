import { User, UserRole, StaffGroup, Department, FormTemplate, FormSubmission } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock Data
export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Emergency Medicine' },
  { id: 'dept-2', name: 'Cardiology' },
  { id: 'dept-3', name: 'General Surgery' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
  },
  {
    id: 'user-2',
    email: 'assessor@example.com',
    name: 'Dr. Jane Smith',
    role: UserRole.ASSESSOR,
    departmentId: 'dept-1',
  },
  {
    id: 'user-3',
    email: 'staff@example.com',
    name: 'John Doe',
    role: UserRole.STAFF,
    group: StaffGroup.NURSING,
    departmentId: 'dept-1',
  },
];

// In-memory store for the session
// In a real app, this would be a database
class Store {
  private templates: FormTemplate[] = [];
  private submissions: FormSubmission[] = [];
  private users: User[] = [...MOCK_USERS];
  private departments: Department[] = [...MOCK_DEPARTMENTS];
  private groups: string[] = Object.values(StaffGroup);

  constructor() {
    // Add a sample template
    this.templates.push({
      id: 'template-1',
      title: 'Annual Nursing Competency',
      description: 'Standard assessment for nursing staff.',
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [
        {
          id: 'page-1',
          sections: [
            { id: 'sec-1', title: 'Personal Information', description: 'Basic details' },
            { id: 'q-1', type: 'TEXT' as any, label: 'Full Name', required: true },
            { id: 'q-2', type: 'DATE' as any, label: 'Date of Assessment', required: true },
          ]
        }
      ]
    });
  }

  getTemplates() { return this.templates; }
  addTemplate(template: FormTemplate) { this.templates.push(template); }
  updateTemplate(template: FormTemplate) {
    const index = this.templates.findIndex(t => t.id === template.id);
    if (index !== -1) this.templates[index] = template;
  }

  getSubmissions() { return this.submissions; }
  addSubmission(submission: FormSubmission) { this.submissions.push(submission); }
  updateSubmission(submission: FormSubmission) {
    const index = this.submissions.findIndex(s => s.id === submission.id);
    if (index !== -1) this.submissions[index] = submission;
  }

  getUsers() { return this.users; }
  getDepartments() { return this.departments; }
  getGroups() { return this.groups; }
  
  addGroup(group: string) { this.groups.push(group); }
  addDepartment(dept: Department) { this.departments.push(dept); }
}

export const store = new Store();
