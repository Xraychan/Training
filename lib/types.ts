import { z } from 'zod';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ASSESSOR = 'ASSESSOR',
  STAFF = 'STAFF',
}

export enum StaffGroup {
  MEDICAL = 'MEDICAL',
  NURSING = 'NURSING',
  ALLIED_HEALTH = 'ALLIED_HEALTH',
  ADMIN = 'ADMIN',
}

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  group?: StaffGroup | string; // Expendable
  departmentId?: string;
}

export enum QuestionType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DATE = 'DATE',
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  prefilledValue?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
}

export interface FormPage {
  id: string;
  sections: (FormSection | FormQuestion)[];
}

export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pages: FormPage[];
  style?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}

export interface FormSubmission {
  id: string;
  templateId: string;
  staffId: string;
  staffName: string;
  assessorId?: string;
  assessorName?: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  answers: Record<string, any>;
  summary?: string;
}
