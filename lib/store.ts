import { User, UserRole, Department, FormTemplate, FormSubmission, GlobalList, AppNotification } from './types';
import { v4 as uuidv4 } from 'uuid';

// ─── Password Utilities ──────────────────────────────────────────────────────
// SHA-256 via Web Crypto API (client-side only)
export async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    const { createHash } = await import('crypto');
    return createHash('sha256').update(password).digest('hex');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Default password for seeded mock users: "Certify123!"
// SHA-256("Certify123!")
const DEFAULT_PASS_HASH = '10e0315b85bc67e9405f6056aa704586f3c4d34479072fe5f3059c6e7b8f2a0e';

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const MOCK_DEPARTMENTS: Department[] = [
  { 
    id: 'dept-1', 
    name: 'Emergency Medicine',
    groups: [
      { id: 'group-1', name: 'NURSING' },
      { id: 'group-2', name: 'MEDICAL' }
    ]
  },
  { 
    id: 'dept-2', 
    name: 'Cardiology',
    groups: [
      { id: 'group-3', name: 'ALLIED_HEALTH' }
    ]
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    passwordHash: DEFAULT_PASS_HASH,
  },
  {
    id: 'user-2',
    email: 'manager@example.com',
    name: 'Dr. Jane Smith',
    role: UserRole.MANAGER,
    departmentId: 'dept-1',
    groupId: 'group-1',
    passwordHash: DEFAULT_PASS_HASH,
  },
  {
    id: 'user-3',
    email: 'trainer@example.com',
    name: 'John Doe',
    role: UserRole.TRAINER,
    departmentId: 'dept-1',
    groupId: 'group-1',
    passwordHash: DEFAULT_PASS_HASH,
  },
];

// ─── Reset Token Store (server-side in-memory, module-level) ────────────────
// Used by API routes since they can't access the browser's localStorage
interface ResetToken {
  email: string;
  token: string;
  expiresAt: number; // Unix timestamp ms
}

// Module-level map accessible by API routes on the same Node.js process
export const resetTokens = new Map<string, ResetToken>(); // token -> ResetToken

export function createResetToken(email: string): string {
  const token = uuidv4();
  // Remove any existing tokens for this email
  for (const [k, v] of resetTokens.entries()) {
    if (v.email.toLowerCase() === email.toLowerCase()) resetTokens.delete(k);
  }
  resetTokens.set(token, {
    email,
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

export function validateResetToken(token: string): string | null {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  return entry.email;
}

export function consumeResetToken(token: string): string | null {
  const email = validateResetToken(token);
  if (email) resetTokens.delete(token);
  return email;
}

// ─── Persistent Store ────────────────────────────────────────────────────────
const STORAGE_KEY = 'certifypro_store_v4';   // bumped from v3 → v4 for notifications
const LEGACY_KEY  = 'certifypro_store';

interface StoreData {
  templates: FormTemplate[];
  submissions: FormSubmission[];
  users: User[];
  departments: Department[];
  globalLists: GlobalList[];
  notifications: AppNotification[];
  notice?: { id: string; content: string; updatedBy: string; updatedAt: string };
}

class Store {
  private templates: FormTemplate[];
  private submissions: FormSubmission[];
  private users: User[];
  private departments: Department[];
  private globalLists: GlobalList[];
  private notifications: AppNotification[];
  private notice: { id: string; content: string; updatedBy: string; updatedAt: string };

  constructor() {
    const defaults: StoreData = {
      templates: [],
      submissions: [],
      users: [...MOCK_USERS],
      departments: [...MOCK_DEPARTMENTS],
      globalLists: [
        { id: 'list-1', name: 'Common Medical Procedures', items: ['Appendectomy', 'Cholecystectomy', 'Laparoscopy'], sorting: 'ASC', isCaseSensitive: false },
        { id: 'list-2', name: 'Hospital Units', items: ['ICU', 'Emergency', 'Radiology', 'Pediatrics'], sorting: 'ASC', isCaseSensitive: false }
      ],
      notifications: [],
      notice: {
        id: 'notice-1',
        content: '"The new Medical Trainers protocols have been updated. Please ensure all relevant assessments are completed by the end of the month."',
        updatedBy: 'user-1',
        updatedAt: new Date().toISOString()
      }
    };

    if (typeof window !== 'undefined') {
      // Clean up old store key from pre-password era
      try { localStorage.removeItem(LEGACY_KEY); } catch {}
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: StoreData = JSON.parse(saved);
          this.templates = parsed.templates ?? defaults.templates;
          this.submissions = parsed.submissions ?? defaults.submissions;
          this.users = parsed.users ?? defaults.users;
          this.departments = parsed.departments ?? defaults.departments;
          this.globalLists = parsed.globalLists ?? defaults.globalLists;
          this.notifications = parsed.notifications ?? defaults.notifications;
          this.notice = parsed.notice ?? defaults.notice!;

          // Backfill passwordHash for any legacy users that don't have one
          let needsPersist = false;
          for (const u of this.users) {
            if (!u.passwordHash) {
              u.passwordHash = DEFAULT_PASS_HASH;
              needsPersist = true;
            }
          }
          if (needsPersist) this.persist();
          return;
        }
      } catch (e) {
        console.warn('Failed to load from localStorage, using defaults', e);
      }
    }

    this.templates = defaults.templates;
    this.submissions = defaults.submissions;
    this.users = defaults.users;
    this.departments = defaults.departments;
    this.globalLists = defaults.globalLists;
    this.notifications = defaults.notifications;
    this.notice = defaults.notice!;
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        const data: StoreData = {
          templates: this.templates,
          submissions: this.submissions,
          users: this.users,
          departments: this.departments,
          globalLists: this.globalLists,
          notifications: this.notifications,
          notice: this.notice,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to persist to localStorage', e);
      }
    }
  }

  // ── Global Lists ────────────────────────────────────────────────────────────
  getGlobalLists() { return this.globalLists; }
  addGlobalList(name: string, items: string[] = [], sorting: 'NONE' | 'ASC' | 'DESC' = 'NONE', isCaseSensitive: boolean = false) {
    const list: GlobalList = { id: uuidv4(), name, items, sorting, isCaseSensitive };
    this.globalLists.push(list);
    this.persist();
    return list;
  }
  updateGlobalList(id: string, updates: Partial<GlobalList>) {
    const index = this.globalLists.findIndex(l => l.id === id);
    if (index !== -1) this.globalLists[index] = { ...this.globalLists[index], ...updates };
    this.persist();
  }
  deleteGlobalList(id: string) {
    this.globalLists = this.globalLists.filter(l => l.id !== id);
    this.persist();
  }

  // ── Templates ───────────────────────────────────────────────────────────────
  getTemplates() { return this.templates; }
  addTemplate(template: FormTemplate) {
    this.templates.push(template);
    this.persist();
  }
  updateTemplate(template: FormTemplate) {
    const index = this.templates.findIndex(t => t.id === template.id);
    if (index !== -1) this.templates[index] = template;
    this.persist();
  }
  deleteTemplate(id: string) {
    this.templates = this.templates.filter(t => t.id !== id);
    this.persist();
  }

  // ── Submissions ─────────────────────────────────────────────────────────────
  getSubmissions() { return this.submissions; }
  addSubmission(submission: FormSubmission) {
    this.submissions.push(submission);
    
    // Create notification for managers
    const template = this.templates.find(t => t.id === submission.templateId);
    const notification: AppNotification = {
      id: uuidv4(),
      type: 'PENDING_APPROVAL',
      submissionId: submission.id,
      targetDepartmentId: submission.departmentId,
      targetGroupId: submission.groupId,
      message: `New assessment "${template?.title || 'Form'}" submitted by ${submission.trainerName}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notification);
    
    this.persist();
  }
  updateSubmission(submission: FormSubmission) {
    const index = this.submissions.findIndex(s => s.id === submission.id);
    if (index !== -1) {
      this.submissions[index] = submission;
      
      // If approved/rejected, clear the notification
      if (submission.status !== 'PENDING') {
        this.notifications = this.notifications.filter(n => n.submissionId !== submission.id);
      }
    }
    this.persist();
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  getNotifications() { return this.notifications; }
  markNotificationRead(id: string) {
    const n = this.notifications.find(notif => notif.id === id);
    if (n) {
      n.read = true;
      this.persist();
    }
  }
  clearNotifications() {
    this.notifications = [];
    this.persist();
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  getUsers() { return this.users; }
  addUser(user: Omit<User, 'id'>) {
    const newUser: User = { id: uuidv4(), ...user };
    this.users.push(newUser);
    this.persist();
    return newUser;
  }
  updateUserPassword(id: string, passwordHash: string) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.passwordHash = passwordHash;
      this.persist();
    }
  }
  updateUserPasswordByEmail(email: string, passwordHash: string) {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.passwordHash = passwordHash;
      this.persist();
      return true;
    }
    return false;
  }
  deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    this.persist();
  }

  // ── Departments ─────────────────────────────────────────────────────────────
  getDepartments() { return this.departments; }
  addDepartment(name: string) {
    const dept: Department = { id: uuidv4(), name, groups: [] };
    this.departments.push(dept);
    this.persist();
    return dept;
  }
  updateDepartment(id: string, name: string) {
    const dept = this.departments.find(d => d.id === id);
    if (dept) dept.name = name;
    this.persist();
  }
  deleteDepartment(id: string) {
    this.departments = this.departments.filter(d => d.id !== id);
    this.persist();
  }

  getGroups(deptId: string) {
    const dept = this.departments.find(d => d.id === deptId);
    return dept?.groups || [];
  }
  addGroup(deptId: string, name: string) {
    const dept = this.departments.find(d => d.id === deptId);
    if (dept) {
      const group = { id: uuidv4(), name };
      dept.groups.push(group);
      this.persist();
      return group;
    }
  }
  updateGroup(deptId: string, groupId: string, name: string) {
    const dept = this.departments.find(d => d.id === deptId);
    if (dept) {
      const group = dept.groups.find(g => g.id === groupId);
      if (group) group.name = name;
      this.persist();
    }
  }
  deleteGroup(deptId: string, groupId: string) {
    const dept = this.departments.find(d => d.id === deptId);
    if (dept) {
      dept.groups = dept.groups.filter(g => g.id !== groupId);
      this.persist();
    }
  }

  // ── Notice ──────────────────────────────────────────────────────────────────
  getNotice() { return this.notice; }
  updateNotice(content: string, userId: string) {
    this.notice = {
      id: this.notice.id,
      content,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.notice;
  }
}

export const store = new Store();
