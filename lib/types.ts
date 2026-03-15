import { z } from 'zod';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TRAINER = 'TRAINER',
}

export enum TrainerGroup {
  MEDICAL = 'MEDICAL',
  NURSING = 'NURSING',
  ALLIED_HEALTH = 'ALLIED_HEALTH',
  ADMIN = 'ADMIN',
}

export interface TrainerGroupMember {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  groups: TrainerGroupMember[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  groupId?: string;
  passwordHash?: string; // SHA-256 hex digest
}

export enum QuestionType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DATE = 'DATE',
  YES_NO = 'YES_NO',
}

export interface GlobalList {
  id: string;
  name: string;
  items: string[];
  sorting: 'NONE' | 'ASC' | 'DESC';
  isCaseSensitive: boolean;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  useGlobalList?: boolean;
  globalListId?: string;
  prefilledValue?: string;
  dateTimeConfig?: {
    format: '12H' | '24H';
    minuteInterval: number;
    autofill: boolean;
    displayStyle: 'INLINE' | 'POPUP';
    weekStartsOn: 'Sunday' | 'Monday';
    allowedDays: 'ALL' | 'WEEKDAYS' | 'WEEKENDS';
    allowedTimeRange?: { start: string; end: string };
  };
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

export interface FormTheme {
  id: string;
  backgroundColor: string;
  backgroundImage?: string;
  cardColor: string;
  fontFamily: string;
  fontColor: string;
  labelColor: string;
  accentColor: string;
  borderRadius: number;
  inputBackground: string;
  inputBorderColor: string;
}
export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pages: FormPage[];
  themeId?: string;
}

export interface FormSubmission {
  id: string;
  templateId: string;
  trainerId: string;
  trainerName: string;
  departmentId: string;
  groupId: string;
  managerId?: string;
  managerName?: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  traineeName: string;
  traineeGroup: string;
  answers: Record<string, any>;
  summary?: string;
}

export interface AppNotification {
  id: string;
  type: 'PENDING_APPROVAL' | 'SYSTEM';
  submissionId?: string;
  targetDepartmentId: string;
  targetGroupId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Notice {
  id: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
}
