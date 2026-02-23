import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, Bug, Project, Notification, Role, BugStatus, Comment, Attachment, Session, Language } from './types';
import { simpleHash, verifyHash, generateToken } from './types';

interface AppState {
  currentUser: User | null;
  session: Session | null;
  users: User[];
  bugs: Bug[];
  projects: Project[];
  notifications: Notification[];
  language: Language;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => boolean;
  loginAsGuest: () => void;
  register: (name: string, email: string, password: string, role: Role) => boolean;
  verifyEmail: (userId: string) => void;
  logout: () => void;
  resetPassword: (email: string) => boolean;
  addBug: (bug: Omit<Bug, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'comments' | 'aiAnalyzed' | 'attachments'>) => Bug;
  updateBug: (id: string, updates: Partial<Bug>) => void;
  changeBugStatus: (bugId: string, newStatus: BugStatus) => void;
  assignBug: (bugId: string, userId: string) => void;
  addComment: (bugId: string, text: string) => void;
  addAttachment: (bugId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  fetchProjects: () => Promise<void>;
  fetchBugs: () => Promise<void>;
  analyzeProject: (id: string) => Promise<void>;
  addProject: (name: string, description: string, repoUrl?: string) => Promise<Project | undefined>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  updateUserRole: (userId: string, role: Role) => void;
  deleteUser: (userId: string) => void;
  addNotification: (userId: string, message: string, type: Notification['type'], bugId?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getBugById: (id: string) => Bug | undefined;
  getUserById: (id: string) => User | undefined;
  setLanguage: (lang: Language) => void;
  isGuest: boolean;
  getMyAssignedBugs: (userId: string) => Bug[];
  getBugsReportedByMe: (userId: string) => Bug[];
  getOpenBugsCount: () => number;
  getCriticalBugsCount: () => number;
}

const STORAGE_KEY = 'bugtracker_ai_state';

const defaultUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@bugtracker.com', password: 'admin123', role: 'admin', avatar: '👑', emailVerified: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'u2', name: 'Jane Developer', email: 'jane@bugtracker.com', password: 'pass123', role: 'developer', avatar: '👩‍💻', emailVerified: true, createdAt: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: 'u3', name: 'Bob Tester', email: 'bob@bugtracker.com', password: 'pass123', role: 'tester', avatar: '🔍', emailVerified: true, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'u4', name: 'Alice Dev', email: 'alice@bugtracker.com', password: 'pass123', role: 'developer', avatar: '👩‍🔬', emailVerified: true, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 'u5', name: 'Charlie QA', email: 'charlie@bugtracker.com', password: 'pass123', role: 'tester', avatar: '🧪', emailVerified: true, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

const defaultProjects: Project[] = [
  { id: 'p1', name: 'E-Commerce Platform', description: 'Main e-commerce web application', members: ['u1', 'u2', 'u3', 'u4', 'u5'], createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'p2', name: 'Mobile App', description: 'iOS and Android mobile application', members: ['u1', 'u4', 'u5'], createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'p3', name: 'API Gateway', description: 'Backend API gateway service', members: ['u1', 'u2', 'u3'], createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
];

const defaultBugs: Bug[] = [
  {
    id: 'b1', title: 'Login page crashes on invalid email format', description: 'When a user enters an email without @ symbol and clicks login, the entire page crashes with a white screen. The application becomes unresponsive and requires a hard refresh.',
    stepsToReproduce: '1. Go to login page\n2. Enter "testuser" without @\n3. Click Login button\n4. Page crashes', expectedBehavior: 'Should show validation error message', actualBehavior: 'Page crashes with white screen',
    severity: 'critical', predictedSeverity: 'critical', severityConfidence: 0.92, status: 'open', projectId: 'p1', reporterId: 'u3', reporterName: 'Bob Tester',
    assigneeId: 'u2', assigneeName: 'Jane Developer', tags: ['login', 'crash', 'validation'], comments: [
      { id: 'c1', bugId: 'b1', userId: 'u2', userName: 'Jane Developer', text: 'I can reproduce this. The email regex is throwing an unhandled exception.', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    ],
    statusHistory: [
      { from: 'new', to: 'open', userId: 'u1', userName: 'Admin User', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'b2', title: 'Shopping cart total displays wrong currency symbol', description: 'The shopping cart shows $ instead of € for European users. The amount is correct but the currency symbol is always USD regardless of locale settings.',
    stepsToReproduce: '1. Set locale to EU\n2. Add items to cart\n3. View cart total', expectedBehavior: 'Should display € symbol', actualBehavior: 'Displays $ symbol',
    severity: 'medium', predictedSeverity: 'medium', severityConfidence: 0.78, status: 'in-progress', projectId: 'p1', reporterId: 'u5', reporterName: 'Charlie QA',
    assigneeId: 'u4', assigneeName: 'Alice Dev', tags: ['cart', 'i18n', 'display'], comments: [],
    statusHistory: [
      { from: 'new', to: 'open', userId: 'u1', userName: 'Admin User', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
      { from: 'open', to: 'in-progress', userId: 'u4', userName: 'Alice Dev', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    ],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'b3', title: 'Database connection timeout during peak hours', description: 'The application experiences database connection timeouts when more than 100 concurrent users are active. This causes server errors and data loss for active transactions.',
    stepsToReproduce: '1. Simulate 100+ concurrent users\n2. Perform database operations\n3. Observe timeout errors', expectedBehavior: 'Database should handle concurrent connections', actualBehavior: 'Connection pool exhausted, timeout errors',
    severity: 'critical', predictedSeverity: 'critical', severityConfidence: 0.95, status: 'new', projectId: 'p3', reporterId: 'u3', reporterName: 'Bob Tester',
    tags: ['database', 'performance', 'critical'], comments: [],
    statusHistory: [],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'b4', title: 'Typo in checkout confirmation message', description: 'The checkout success page shows "Your order has been palced successfully" - "placed" is misspelled as "palced".',
    stepsToReproduce: '1. Complete checkout\n2. Read confirmation message', expectedBehavior: '"placed" should be spelled correctly', actualBehavior: '"palced" is shown',
    severity: 'low', predictedSeverity: 'low', severityConfidence: 0.88, status: 'resolved', projectId: 'p1', reporterId: 'u5', reporterName: 'Charlie QA',
    assigneeId: 'u2', assigneeName: 'Jane Developer', tags: ['typo', 'checkout', 'ui'], comments: [
      { id: 'c2', bugId: 'b4', userId: 'u2', userName: 'Jane Developer', text: 'Fixed in commit abc123.', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    statusHistory: [
      { from: 'new', to: 'open', userId: 'u1', userName: 'Admin User', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
      { from: 'open', to: 'in-progress', userId: 'u2', userName: 'Jane Developer', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
      { from: 'in-progress', to: 'resolved', userId: 'u2', userName: 'Jane Developer', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'b5', title: 'Mobile app navigation bar overlaps content', description: 'On iOS devices with notch, the bottom navigation bar overlaps with page content making the last item unreadable and untappable.',
    stepsToReproduce: '1. Open app on iPhone with notch\n2. Navigate to any page with scrollable content\n3. Scroll to bottom', expectedBehavior: 'Content should be visible above nav bar', actualBehavior: 'Nav bar overlaps content',
    severity: 'high', predictedSeverity: 'high', severityConfidence: 0.82, status: 'open', projectId: 'p2', reporterId: 'u5', reporterName: 'Charlie QA',
    assigneeId: 'u4', assigneeName: 'Alice Dev', tags: ['mobile', 'ios', 'navigation', 'layout'], comments: [],
    statusHistory: [
      { from: 'new', to: 'open', userId: 'u1', userName: 'Admin User', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'b6', title: 'API rate limiting not enforced on search endpoint', description: 'The /api/search endpoint does not enforce rate limiting, allowing unlimited requests. This could lead to denial of service attacks and excessive server load.',
    stepsToReproduce: '1. Send rapid requests to /api/search\n2. Observe no rate limiting headers\n3. Server accepts all requests', expectedBehavior: 'Rate limiting should be enforced (100 req/min)', actualBehavior: 'No rate limiting applied',
    severity: 'high', predictedSeverity: 'critical', severityConfidence: 0.71, status: 'new', projectId: 'p3', reporterId: 'u3', reporterName: 'Bob Tester',
    tags: ['security', 'api', 'rate-limiting'], comments: [],
    statusHistory: [],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'b7', title: 'User profile image upload fails for PNG files over 2MB', description: 'When uploading a PNG file larger than 2MB, the upload silently fails without any error message. JPEG files of the same size work fine.',
    stepsToReproduce: '1. Go to profile settings\n2. Click upload avatar\n3. Select a PNG > 2MB\n4. Click save', expectedBehavior: 'File should upload or show size limit error', actualBehavior: 'Upload fails silently',
    severity: 'medium', predictedSeverity: 'medium', severityConfidence: 0.76, status: 'closed', projectId: 'p1', reporterId: 'u3', reporterName: 'Bob Tester',
    assigneeId: 'u2', assigneeName: 'Jane Developer', tags: ['upload', 'profile', 'image'], comments: [
      { id: 'c3', bugId: 'b7', userId: 'u2', userName: 'Jane Developer', text: 'Fixed by adding proper file size validation and error messaging.', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
      { id: 'c4', bugId: 'b7', userId: 'u3', userName: 'Bob Tester', text: 'Verified fix. Now shows proper error for files over 5MB.', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
    statusHistory: [
      { from: 'new', to: 'open', userId: 'u1', userName: 'Admin User', timestamp: new Date(Date.now() - 10 * 86400000).toISOString() },
      { from: 'open', to: 'in-progress', userId: 'u2', userName: 'Jane Developer', timestamp: new Date(Date.now() - 8 * 86400000).toISOString() },
      { from: 'in-progress', to: 'resolved', userId: 'u2', userName: 'Jane Developer', timestamp: new Date(Date.now() - 6 * 86400000).toISOString() },
      { from: 'resolved', to: 'closed', userId: 'u3', userName: 'Bob Tester', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
    attachments: [],
    aiAnalyzed: true, createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const defaultNotifications: Notification[] = [
  { id: 'n1', userId: 'u2', message: 'You have been assigned bug: Login page crashes on invalid email format', type: 'assignment', read: false, bugId: 'b1', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'n2', userId: 'u4', message: 'Bug "Shopping cart total displays wrong currency" moved to In Progress', type: 'status', read: true, bugId: 'b2', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'n3', userId: 'u1', message: 'AI Engine detected potential duplicate bugs', type: 'ai', read: false, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
];

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentUser: parsed.currentUser || null,
        session: parsed.session || null,
        users: parsed.users || defaultUsers,
        bugs: (parsed.bugs || defaultBugs).map((b: Bug) => ({ ...b, attachments: b.attachments || [] })),
        projects: parsed.projects || defaultProjects,
        notifications: parsed.notifications || defaultNotifications,
        language: parsed.language || 'en',
      };
    }
  } catch { /* ignore */ }
  return {
    currentUser: null,
    session: null,
    users: defaultUsers,
    bugs: [],
    projects: [],
    notifications: defaultNotifications,
    language: 'en',
  };
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = useCallback((email: string, password: string): boolean => {
    const user = state.users.find(u => u.email === email && (verifyHash(password, u.password) || u.password === password));
    if (user) {
      const session = generateToken(user.id);
      setState(s => ({ ...s, currentUser: user, session }));
      return true;
    }
    return false;
  }, [state.users]);

  const loginAsGuest = useCallback(() => {
    const guestUser: User = {
      id: 'guest-' + uuidv4().slice(0, 8),
      name: 'Guest User',
      email: 'guest@bugtracker.com',
      password: '',
      role: 'guest',
      avatar: '👁️',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    const session = generateToken(guestUser.id);
    setState(s => ({ ...s, currentUser: guestUser, session }));
  }, []);

  const register = useCallback((name: string, email: string, password: string, role: Role): boolean => {
    if (state.users.some(u => u.email === email)) return false;
    const avatars = ['😀', '🧑‍💼', '🧑‍🔧', '🧑‍🎓', '🦸', '🧙', '🤖'];
    const hashedPassword = simpleHash(password);
    const newUser: User = {
      id: uuidv4(), name, email, password: hashedPassword, role,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    const session = generateToken(newUser.id);
    setState(s => ({ ...s, users: [...s.users, newUser], currentUser: newUser, session }));
    return true;
  }, [state.users]);

  const verifyEmail = useCallback((userId: string) => {
    setState(s => ({
      ...s,
      users: s.users.map(u => u.id === userId ? { ...u, emailVerified: true } : u),
      currentUser: s.currentUser?.id === userId ? { ...s.currentUser, emailVerified: true } : s.currentUser,
    }));
  }, []);

  const logout = useCallback(() => {
    setState(s => ({ ...s, currentUser: null, session: null }));
  }, []);

  const resetPassword = useCallback((email: string): boolean => {
    const user = state.users.find(u => u.email === email);
    return !!user;
  }, [state.users]);

  const addBug = useCallback((bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'comments' | 'aiAnalyzed' | 'attachments'>): Bug => {
    const now = new Date().toISOString();
    const bug: Bug = {
      ...bugData,
      id: uuidv4(),
      comments: [],
      statusHistory: [],
      attachments: [],
      aiAnalyzed: true,
      createdAt: now,
      updatedAt: now,
    };
    setState(s => ({ ...s, bugs: [...s.bugs, bug] }));
    return bug;
  }, []);

  const updateBug = useCallback((id: string, updates: Partial<Bug>) => {
    setState(s => ({
      ...s,
      bugs: s.bugs.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b),
    }));
  }, []);

  const changeBugStatus = useCallback((bugId: string, newStatus: BugStatus) => {
    setState(s => {
      const bug = s.bugs.find(b => b.id === bugId);
      if (!bug || !s.currentUser) return s;
      const change = {
        from: bug.status,
        to: newStatus,
        userId: s.currentUser.id,
        userName: s.currentUser.name,
        timestamp: new Date().toISOString(),
      };
      const updatedBugs = s.bugs.map(b =>
        b.id === bugId ? { ...b, status: newStatus, statusHistory: [...b.statusHistory, change], updatedAt: new Date().toISOString() } : b
      );
      const newNotif: Notification = {
        id: uuidv4(),
        userId: bug.assigneeId || bug.reporterId,
        message: `Bug "${bug.title}" status changed to ${newStatus}`,
        type: 'status',
        read: false,
        bugId,
        createdAt: new Date().toISOString(),
      };
      return { ...s, bugs: updatedBugs, notifications: [...s.notifications, newNotif] };
    });
  }, []);

  const assignBug = useCallback((bugId: string, userId: string) => {
    setState(s => {
      const user = s.users.find(u => u.id === userId);
      if (!user) return s;
      const bug = s.bugs.find(b => b.id === bugId);
      const updatedBugs = s.bugs.map(b =>
        b.id === bugId ? { ...b, assigneeId: userId, assigneeName: user.name, updatedAt: new Date().toISOString() } : b
      );
      const newNotif: Notification = {
        id: uuidv4(),
        userId,
        message: `You have been assigned bug: ${bug?.title || bugId}`,
        type: 'assignment',
        read: false,
        bugId,
        createdAt: new Date().toISOString(),
      };
      return { ...s, bugs: updatedBugs, notifications: [...s.notifications, newNotif] };
    });
  }, []);

  // New: Get bugs assigned to current user
  const getMyAssignedBugs = useCallback((userId: string) => {
    return state.bugs.filter(b => b.assigneeId === userId && b.status !== 'closed');
  }, [state.bugs]);

  // New: Get bugs reported by user
  const getBugsReportedByMe = useCallback((userId: string) => {
    return state.bugs.filter(b => b.reporterId === userId);
  }, [state.bugs]);

  // New: Get open bugs count
  const getOpenBugsCount = useCallback(() => {
    return state.bugs.filter(b => b.status === 'new' || b.status === 'open').length;
  }, [state.bugs]);

  // New: Get critical bugs count
  const getCriticalBugsCount = useCallback(() => {
    return state.bugs.filter(b => b.severity === 'critical' && b.status !== 'closed').length;
  }, [state.bugs]);

  const addComment = useCallback((bugId: string, text: string) => {
    setState(s => {
      if (!s.currentUser) return s;
      const comment: Comment = {
        id: uuidv4(),
        bugId,
        userId: s.currentUser.id,
        userName: s.currentUser.name,
        text,
        createdAt: new Date().toISOString(),
      };
      const bug = s.bugs.find(b => b.id === bugId);
      const updatedBugs = s.bugs.map(b =>
        b.id === bugId ? { ...b, comments: [...b.comments, comment], updatedAt: new Date().toISOString() } : b
      );
      const notifTargets = new Set<string>();
      if (bug?.reporterId && bug.reporterId !== s.currentUser.id) notifTargets.add(bug.reporterId);
      if (bug?.assigneeId && bug.assigneeId !== s.currentUser.id) notifTargets.add(bug.assigneeId);
      const newNotifs: Notification[] = Array.from(notifTargets).map(uid => ({
        id: uuidv4(),
        userId: uid,
        message: `${s.currentUser!.name} commented on "${bug?.title}"`,
        type: 'comment' as const,
        read: false,
        bugId,
        createdAt: new Date().toISOString(),
      }));
      return { ...s, bugs: updatedBugs, notifications: [...s.notifications, ...newNotifs] };
    });
  }, []);

  const addAttachment = useCallback((bugId: string, attachmentData: Omit<Attachment, 'id' | 'createdAt'>) => {
    setState(s => {
      const attachment: Attachment = {
        ...attachmentData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      const updatedBugs = s.bugs.map(b =>
        b.id === bugId ? { ...b, attachments: [...b.attachments, attachment], updatedAt: new Date().toISOString() } : b
      );
      return { ...s, bugs: updatedBugs };
    });
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setState(s => ({ ...s, projects: data }));
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  }, []);

  const fetchBugs = useCallback(async () => {
    try {
      const res = await fetch('/api/bugs');
      if (res.ok) {
        const data = await res.json();
        const serializedBugs = data.map((b: Record<string, unknown>) => ({
          ...b,
          tags: b.tags ? JSON.parse(b.tags as string) : [],
          comments: b.comments ? JSON.parse(b.comments as string) : [],
          attachments: b.attachments ? JSON.parse(b.attachments as string) : [],
          statusHistory: b.statusHistory ? JSON.parse(b.statusHistory as string) : [],
        }));
        setState(s => ({ ...s, bugs: serializedBugs }));
      }
    } catch (e) {
      console.error('Failed to fetch bugs', e);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchBugs();
  }, [fetchProjects, fetchBugs]);

  const addProject = useCallback(async (name: string, description: string, repoUrl?: string): Promise<Project | undefined> => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, repoUrl })
      });
      if (res.ok) {
        const project = await res.json();
        setState(s => ({ ...s, projects: [project, ...s.projects] }));
        return project;
      }
    } catch (e) {
      console.error('Failed to add project', e);
    }
    return undefined;
  }, []);

  const addNotification = useCallback((userId: string, message: string, type: Notification['type'], bugId?: string) => {
    const notif: Notification = {
      id: uuidv4(), userId, message, type, read: false, bugId,
      createdAt: new Date().toISOString(),
    };
    setState(s => ({ ...s, notifications: [...s.notifications, notif] }));
  }, []);

  const analyzeProject = useCallback(async (id: string) => {
    try {
      addNotification(state.currentUser?.id || 'sys', 'Code analysis started. This may take up to a minute...', 'system');
      const res = await fetch(`/api/projects/${id}/analyze`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addNotification(state.currentUser?.id || 'sys', `Analysis complete! Found ${data.bugsFound} bugs.`, 'system');
        await fetchBugs();
      } else {
        const data = await res.json();
        addNotification(state.currentUser?.id || 'sys', data.error || 'Analysis failed', 'system');
      }
    } catch (e) {
      console.error('Failed to analyze project', e);
      addNotification(state.currentUser?.id || 'sys', 'Network error during analysis.', 'system');
    }
  }, [state.currentUser, addNotification, fetchBugs]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState(s => ({ ...s, projects: s.projects.filter(p => p.id !== id) }));
  }, []);

  const updateUserRole = useCallback((userId: string, role: Role) => {
    setState(s => ({
      ...s,
      users: s.users.map(u => u.id === userId ? { ...u, role } : u),
    }));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setState(s => ({ ...s, users: s.users.filter(u => u.id !== userId) }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n =>
        n.userId === s.currentUser?.id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setState(s => ({ ...s, language: lang }));
  }, []);

  const getBugById = useCallback((id: string) => state.bugs.find(b => b.id === id), [state.bugs]);
  const getUserById = useCallback((id: string) => state.users.find(u => u.id === id), [state.users]);

  const isGuest = state.currentUser?.role === 'guest';

  const value: AppContextType = {
    ...state, login, loginAsGuest, register, verifyEmail, logout, resetPassword,
    addBug, updateBug, changeBugStatus,
    assignBug, addComment, addAttachment, addProject, updateProject, deleteProject,
    fetchProjects, fetchBugs, analyzeProject,
    updateUserRole, deleteUser, addNotification, markNotificationRead,
    markAllNotificationsRead, getBugById, getUserById, setLanguage, isGuest,
    getMyAssignedBugs, getBugsReportedByMe, getOpenBugsCount, getCriticalBugsCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
