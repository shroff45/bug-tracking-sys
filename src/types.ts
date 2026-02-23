export type Role = 'admin' | 'developer' | 'tester' | 'guest';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'new' | 'open' | 'in-progress' | 'resolved' | 'closed';
export type Language = 'en' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  bugId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  bugId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface StatusChange {
  from: BugStatus;
  to: BugStatus;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: Severity;
  predictedSeverity?: Severity;
  severityConfidence?: number;
  status: BugStatus;
  projectId: string;
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  tags: string[];
  comments: Comment[];
  statusHistory: StatusChange[];
  attachments: Attachment[];
  duplicateOf?: string;
  duplicateScore?: number;
  aiAnalyzed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: string[];
  repoUrl?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'assignment' | 'status' | 'comment' | 'ai' | 'system';
  read: boolean;
  bugId?: string;
  createdAt: string;
}

export interface DuplicateResult {
  bugId: string;
  bugTitle: string;
  score: number;
  method: string;
}

export interface SeverityPrediction {
  severity: Severity;
  confidence: number;
  scores: Record<Severity, number>;
  features: string[];
}

export interface AIModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalPredictions: number;
  correctPredictions: number;
  confusionMatrix: number[][];
  trainingLoss: number[];
  trainingAccuracy: number[];
  lastTrained: string;
  isTraining: boolean;
  epoch: number;
  totalEpochs: number;
}

// --- RBAC Permissions ---
const STATUS_PERMISSIONS: Record<Role, BugStatus[]> = {
  admin: ['new', 'open', 'in-progress', 'resolved', 'closed'],
  developer: ['open', 'in-progress', 'resolved'],
  tester: ['new', 'open', 'closed'],
  guest: [],
};

const STATUS_TRANSITIONS: Record<BugStatus, BugStatus[]> = {
  new: ['open'],
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'open'],
  resolved: ['closed', 'open'],
  closed: ['open'],
};

export function canChangeStatus(role: Role, _currentStatus: BugStatus, newStatus: BugStatus): boolean {
  if (role === 'guest') return false;
  const allowed = STATUS_PERMISSIONS[role];
  return allowed.includes(newStatus);
}

export function getValidTransitions(currentStatus: BugStatus, role: Role): BugStatus[] {
  const transitions = STATUS_TRANSITIONS[currentStatus] || [];
  return transitions.filter(s => canChangeStatus(role, currentStatus, s));
}

export function canDragBug(role: Role): boolean {
  return role === 'admin' || role === 'developer';
}

// --- Simulated Password Hashing ---
export function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'bcrypt$' + Math.abs(hash).toString(36) + '$' + btoa(password.slice(0, 2)).replace(/=/g, '');
}

export function verifyHash(password: string, hash: string): boolean {
  if (!hash.startsWith('bcrypt$')) {
    // Legacy plaintext comparison for demo accounts
    return password === hash;
  }
  return simpleHash(password) === hash;
}

// --- JWT Simulation ---
export function generateToken(userId: string): Session {
  const payload = { uid: userId, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 };
  const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(payload)) + '.signature';
  return {
    token,
    userId,
    expiresAt: new Date(payload.exp).toISOString(),
    createdAt: new Date(payload.iat).toISOString(),
  };
}

export function isTokenValid(session: Session | null): boolean {
  if (!session) return false;
  return new Date(session.expiresAt) > new Date();
}
