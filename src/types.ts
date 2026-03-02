/**
 * src/types.ts
 * 
 * DATA LAYER: Shared TypeScript Domain Models
 * 
 * This file serves as the central dictionary defining the shape of all data structures
 * used across both the frontend React application and the underlying business logic.
 * Maintaining everything in one place guarantees type safety across system boundaries.
 * 
 * Why this code/type is used:
 * - String Literal Types (`Role`, `Severity`): Far safer than Enums in TypeScript. They strictly restrict values to specific string variations and prevent typos.
 * - Interfaces (`User`, `Bug`): Define the exact required and optional (`?`) keys expected from API responses and database representations.
 * - Utility Functions (`canChangeStatus`, `verifyHash`): Grouping purely functional helper logic with the types they act upon keeps the codebase cohesive rather than creating isolated `utils` files needlessly.
 */

// ==========================================
// Literal Types (Enums alternative)
// ==========================================
export type Role = 'admin' | 'developer' | 'tester' | 'guest'; // System authorization levels
export type Severity = 'critical' | 'high' | 'medium' | 'low'; // Defect impact scale
export type BugStatus = 'new' | 'open' | 'in-progress' | 'resolved' | 'closed'; // Kanban column mapping
export type Language = 'en' | 'hi'; // i18n support targets

// ==========================================
// Entity Interfaces
// ==========================================

export interface User {
  id: string; // UUID primary key
  name: string; // Display name
  email: string; // Login handle
  password: string; // Locally simulated hash (if not google auth)
  role: Role; // Access privileges
  avatar: string; // Emoji static representation
  emailVerified: boolean; // Registration completion flag
  createdAt: string; // ISO 8601 formatting
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
  id: string; // UUID primary key
  title: string; // Short summary
  description: string; // Detailed markdown format explanation
  stepsToReproduce: string; // Instructions to duplicate error
  expectedBehavior: string; // What should happen
  actualBehavior: string; // What actually happened
  severity: Severity; // User declared or AI declared impact
  predictedSeverity?: Severity; // AI guess caching
  severityConfidence?: number; // AI confidence logging
  publicImpact?: string; // Triage analysis result
  status: BugStatus; // Current Kanban board location
  projectId: string; // Relational foreign key binding
  reporterId: string; // Original creator UUID
  reporterName: string; // Denormalized name for fast UI loading
  assigneeId?: string; // Currently working developer UUID
  assigneeName?: string; // Denormalized assignee name
  tags: string[]; // Searchable classification terms
  comments: Comment[]; // Nested sub-document array
  statusHistory: StatusChange[]; // Audit logging trace
  attachments: Attachment[]; // Nested uploaded files
  duplicateOf?: string; // Pointers to parent bugs if merged
  duplicateScore?: number; // Semantic similarity collision probability
  aiAnalyzed: boolean; // Flag if background processing completed hitting ML engine
  createdAt: string; // Initial ISO 8601 timestamp
  updatedAt: string; // Last mutation timestamp
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

// --- RBAC (Role-Based Access Control) Permissions ---
// Matrix determining which roles can transition bugs to what statuses locally
const STATUS_PERMISSIONS: Record<Role, BugStatus[]> = {
  admin: ['new', 'open', 'in-progress', 'resolved', 'closed'], // Universal permissions
  developer: ['open', 'in-progress', 'resolved'], // Cannot open or close officially
  tester: ['new', 'open', 'closed'], // Can instantiate and verify closures
  guest: [], // Read-only mapping
};

// State-Machine Configuration: Dictates valid logical progression paths for a bug
const STATUS_TRANSITIONS: Record<BugStatus, BugStatus[]> = {
  new: ['open'], // New bugs must be investigated (opened) first
  open: ['in-progress', 'closed'], // Can start work or close if duplicate/invalid
  'in-progress': ['resolved', 'open'], // Work finishes or halts
  resolved: ['closed', 'open'], // Verification success or failure
  closed: ['open'], // Regressions can reopen a closed bug
};

// Validates if a specific user role is authorized to make a specific mutation attempt
export function canChangeStatus(role: Role, _currentStatus: BugStatus, newStatus: BugStatus): boolean {
  if (role === 'guest') return false; // Hard bypass stop
  const allowed = STATUS_PERMISSIONS[role];
  return allowed.includes(newStatus); // Array scanning logic match
}

// Calculates the available dropdown options for the UI based on state-machine AND user role intersection
export function getValidTransitions(currentStatus: BugStatus, role: Role): BugStatus[] {
  const transitions = STATUS_TRANSITIONS[currentStatus] || []; // Get possible logical jumps
  return transitions.filter(s => canChangeStatus(role, currentStatus, s)); // Filter out jumps exceeding role authority
}

// Global UI utility helper to gate drag/drop interactions
export function canDragBug(role: Role): boolean {
  return role === 'admin' || role === 'developer';
}

// --- Simulated Password Hashing ---
// A local mock hash implementation since this frontend system occasionally acts 
// without a fully operational identity backend depending on deployment strategy.
// **WARNING: NOT CRYPTOGRAPHICALLY SECURE FOR PRODUCTION DATA**
export function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'bcrypt$' + Math.abs(hash).toString(36) + '$' + btoa(password.slice(0, 2)).replace(/=/g, '');
}

// Verifies a raw text input against a mock hash attempt
export function verifyHash(password: string, hash: string): boolean {
  if (!hash.startsWith('bcrypt$')) {
    // Legacy plaintext comparison for static demo accounts inside DB dumps
    return password === hash;
  }
  return simpleHash(password) === hash;
}

// --- JWT Simulation ---
// Creates a mock JSON Web Token structure for mock local auth validation
export function generateToken(userId: string): Session {
  const payload = { uid: userId, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 }; // 24hr expiration
  const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(payload)) + '.signature';
  return {
    token, // Simulated fake encoded string
    userId,
    expiresAt: new Date(payload.exp).toISOString(),
    createdAt: new Date(payload.iat).toISOString(),
  };
}

// Checks if the active simulated session has passed its expiration time limit.
export function isTokenValid(session: Session | null): boolean {
  if (!session) return false;
  return new Date(session.expiresAt) > new Date();
}
