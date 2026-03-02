/**
 * src/store.tsx
 * 
 * GLOBAL STATE MANAGEMENT (React Context API)
 * 
 * This file acts as the single source of truth for the entire frontend application's data.
 * Instead of passing props down multiple levels (prop-drilling), any component can call 
 * `useAppContext()` to access users, bugs, projects, and the active session.
 * 
 * How it works:
 * 1. It holds the React State for data arrays (bugs: [], users: [], etc.)
 * 2. It exposes "Action Functions" (e.g., addBug, login, changeBugStatus)
 * 3. These action functions first make an Async API call to the backend (via api/index.ts)
 * 4. Once the backend confirms the change, the action function calls `fetchBugs()` or 
 *    equivalent to re-download the latest truth from the database, instantly updating the UI.
 * 
 * Persistence:
 * The user's active login token and language preferences are cached in `localStorage`
 * so they don't get logged out if they refresh the page.
 * 
 * Why this code/type is used:
 * - createContext/useContext: Native React API for providing global state without external libraries like Redux.
 * - useState/useEffect/useCallback: Core hooks for managing internal context state and memoizing heavy action functions.
 * - UUID (v4): Used strictly for generating temporary local IDs (e.g., mock notifications) before backend sync.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'; // React API
import { v4 as uuidv4 } from 'uuid'; // Unique ID generator
import type { User, Bug, Project, Notification, Role, BugStatus, Attachment, Session, Language } from './types'; // Domain models
import { generateToken } from './types'; // Legacy mock token generator
import * as api from './api'; // Backend API communication layer

/**
 * AppState: Defines the shape of the domain data held in memory.
 */
interface AppState {
  currentUser: User | null; // Logged-in user profile
  session: Session | null; // Active JWT tracking
  users: User[]; // All registered users
  bugs: Bug[]; // All system bugs
  projects: Project[]; // All tracked projects
  notifications: Notification[]; // Global alert feed
  language: Language; // Active UI locale setting
}

/**
 * AppContextType: Extends AppState with the callable mutation functions exposed to consumers.
 */
interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginAsGuest: () => void;
  register: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  verifyEmail: (userId: string) => void;
  logout: () => void;
  resetPassword: (email: string) => boolean;
  addBug: (bug: Omit<Bug, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'comments' | 'aiAnalyzed' | 'attachments'>) => Promise<Bug | undefined>;
  updateBug: (id: string, updates: Partial<Bug>) => Promise<void>;
  changeBugStatus: (bugId: string, newStatus: BugStatus) => Promise<void>;
  assignBug: (bugId: string, userId: string) => Promise<void>;
  addComment: (bugId: string, text: string) => Promise<void>;
  addAttachment: (bugId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchBugs: () => Promise<void>;
  analyzeProject: (id: string) => Promise<void>;
  addProject: (name: string, description: string, repoUrl?: string) => Promise<Project | undefined>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateUserRole: (userId: string, role: Role) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addNotification: (userId: string, message: string, type: Notification['type'], bugId?: string) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  getBugById: (id: string) => Bug | undefined;
  getUserById: (id: string) => User | undefined;
  setLanguage: (lang: Language) => void;
  isGuest: boolean;
  getMyAssignedBugs: (userId: string) => Bug[];
  getBugsReportedByMe: (userId: string) => Bug[];
  getOpenBugsCount: () => number;
  getCriticalBugsCount: () => number;
}

// Local storage key for re-initiating sessions
const STORAGE_KEY = 'bugtracker_ai_state';

// Bootstrap helper: Pulls session data from localStorage on initial render to prevent login flashes
function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentUser: parsed.currentUser || null,
        session: parsed.session || null,
        users: [],
        bugs: [],
        projects: [],
        notifications: [],
        language: parsed.language || 'en',
      };
    }
  } catch { /* ignore */ }
  return {
    currentUser: null,
    session: null,
    users: [],
    bugs: [],
    projects: [],
    notifications: [],
    language: 'en', // Default locale fallback
  };
}

// Instantiate the React Context
const AppContext = createContext<AppContextType | null>(null);

// Custom Hook mapping for deep consumer access
export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// Highest-level wrapper component that provides value to the component tree
export function AppProvider({ children }: { children: React.ReactNode }) {
  // Primary state machine
  const [state, setState] = useState<AppState>(loadState);

  // Effect: Sync volatile preferences to localStorage strictly on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentUser: state.currentUser,
      session: state.session,
      language: state.language
    }));
  }, [state.currentUser, state.session, state.language]);

  // Async API Dispatchers (Fetching)

  // Fetch full user roster
  const fetchUsers = useCallback(async () => {
    try {
      const users = await api.fetchUsers();
      setState(s => ({ ...s, users }));
    } catch (e) { console.error("Could not fetch users", e); }
  }, []);

  // Fetch active projects
  const fetchProjects = useCallback(async () => {
    try {
      const projects = await api.fetchProjects();
      setState(s => ({ ...s, projects }));
    } catch (e) { console.error('Failed to fetch projects', e); }
  }, []);

  // Fetch and deeply parse bug entities (JSON string arrays -> Arrays)
  const fetchBugs = useCallback(async () => {
    try {
      const data = await api.fetchBugs();
      const serializedBugs = data.map((b: any) => ({
        ...b,
        // Tags arrive as JSON strings from SQLite adapter, parse defensively
        tags: b.tags ? (typeof b.tags === 'string' ? JSON.parse(b.tags) : b.tags) : [],
        comments: b.comments || [],
        attachments: b.attachments || [],
        statusHistory: b.statusHistory || [],
        aiAnalyzed: Boolean(b.aiAnalyzed)
      }));
      setState(s => ({ ...s, bugs: serializedBugs }));
    } catch (e) {
      console.error('Failed to fetch bugs', e);
    }
  }, []);

  // Fetch user-directed notifications array
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const notifications = await api.fetchNotifications(userId);
      setState(s => ({ ...s, notifications }));
    } catch (e) { console.error('Failed to fetch notifications', e); }
  }, []);

  // Effect: Hydration. Runs once when auth dictates it's safe to load domain data.
  useEffect(() => {
    fetchUsers();
    fetchProjects();
    fetchBugs();
    // Only fetch notifs if explicitly logged in and NOT operating as a dummy guest
    if (state.currentUser && !isGuest) {
      fetchNotifications(state.currentUser.id);
    }
  }, [state.currentUser]);


  // Async API Dispatchers (Mutations)

  // Standard authentication pipeline
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.loginUser(email, password);
      if (response && response.user && response.token) {
        const sessionObj = {
          token: response.token,
          userId: response.user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        setState(s => ({ ...s, currentUser: response.user, session: sessionObj }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login Error:", e);
      return false;
    }
  }, []);

  // OAuth authentication wrapper targeting Google identity
  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    try {
      const response = await api.loginWithGoogle(credential);
      if (response && response.user && response.token) {
        const sessionObj = {
          token: response.token,
          userId: response.user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        setState(s => ({ ...s, currentUser: response.user, session: sessionObj }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Google Login Error:", e);
      return false;
    }
  }, []);

  // Syntactic sugar action to mock a read-only unprivileged identity
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

  // Standard account creation pipeline
  const register = useCallback(async (name: string, email: string, password: string, role: Role): Promise<boolean> => {
    try {
      const response = await api.registerUser(name, email, password, role);
      if (response && response.user && response.token) {
        const sessionObj = {
          token: response.token,
          userId: response.user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        setState(s => ({ ...s, currentUser: response.user, session: sessionObj }));
        await fetchUsers(); // Refresh consumer user list to include the newly created user
        return true;
      }
      return false;
    } catch (e) {
      console.error("Register Error:", e);
      return false;
    }
  }, [fetchUsers]);

  const verifyEmail = useCallback((userId: string) => {
    // Local mock logic for now unless explicitly wired to backend validator
    setState(s => ({
      ...s,
      currentUser: s.currentUser?.id === userId ? { ...s.currentUser, emailVerified: true } : s.currentUser,
    }));
  }, []);

  // Hard clears active auth session and associated user caches
  const logout = useCallback(() => {
    setState(s => ({ ...s, currentUser: null, session: null, notifications: [] }));
  }, []);

  const resetPassword = useCallback((email: string): boolean => {
    // Mock logic for UI testing capabilities
    return !!state.users.find(u => u.email === email);
  }, [state.users]);

  // Issue tracking pipelines
  const addBug = useCallback(async (bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'comments' | 'aiAnalyzed' | 'attachments'>): Promise<Bug | undefined> => {
    try {
      const newBug = await api.createBug(bugData);
      if (newBug) {
        await fetchBugs(); // Sync immediately so kanban reflects push
        return newBug;
      }
    } catch (e) {
      console.error("Failed adding bug", e);
    }
    return undefined;
  }, [fetchBugs]);

  const updateBug = useCallback(async (id: string, updates: Partial<Bug>) => {
    try {
      await api.updateBug(id, updates);
      await fetchBugs(); // Force refresh to map complex relations
    } catch (e) { console.error("Failed updateBug", e); }
  }, [fetchBugs]);

  // Updates column placement + history tracking securely
  const changeBugStatus = useCallback(async (bugId: string, newStatus: BugStatus) => {
    if (!state.currentUser) return;
    try {
      await api.changeBugStatus(bugId, newStatus, state.currentUser.id, state.currentUser.name);
      await fetchBugs(); // Trigger reactive pipeline to update drag zones
      await fetchNotifications(state.currentUser.id); // Reload notices to get history log
    } catch (e) { console.error("Failed changeBugStatus", e); }
  }, [state.currentUser, fetchBugs, fetchNotifications]);

  const assignBug = useCallback(async (bugId: string, userId: string) => {
    try {
      const assignee = state.users.find(u => u.id === userId);
      const name = assignee ? assignee.name : 'Unknown';
      await api.assignBug(bugId, userId, name);
      await fetchBugs();
      if (state.currentUser) await fetchNotifications(state.currentUser.id);
    } catch (e) { console.error("Failed assignBug", e); }
  }, [state.users, state.currentUser, fetchBugs, fetchNotifications]);

  const addComment = useCallback(async (bugId: string, text: string) => {
    if (!state.currentUser) return;
    try {
      await api.addBugComment(bugId, state.currentUser.id, state.currentUser.name, text);
      await fetchBugs();
    } catch (e) { console.error("Failed addComment", e); }
  }, [state.currentUser, fetchBugs]);

  const addAttachment = useCallback(async (bugId: string, attachmentData: Omit<Attachment, 'id' | 'createdAt'>) => {
    try {
      await api.addBugAttachment(bugId, attachmentData);
      await fetchBugs();
    } catch (e) { console.error("Failed addAttachment", e); }
  }, [fetchBugs]);

  const addProject = useCallback(async (name: string, description: string, repoUrl?: string): Promise<Project | undefined> => {
    try {
      const project = await api.createProject(name, description, repoUrl);
      if (project) {
        await fetchProjects();
        return project;
      }
    } catch (e) {
      console.error('Failed to add project', e);
    }
    return undefined;
  }, [fetchProjects]);

  // Specialized notification proxy (currently bypasses API for UX speed where acceptable)
  // System notifications (like AI events) still managed locally mostly for simplicity, 
  // but could be sent to DB via a generic notifications router if needed. 
  const addNotification = useCallback((userId: string, message: string, type: Notification['type'], bugId?: string) => {
    const notif: Notification = {
      id: uuidv4(), userId, message, type, read: false, bugId,
      createdAt: new Date().toISOString(),
    };
    setState(s => ({ ...s, notifications: [...s.notifications, notif] }));
  }, []);

  // Dedicated custom endpoint that runs deeply integrated semantic tests on server-side
  const analyzeProject = useCallback(async (id: string) => {
    try {
      // Simulate real-time signaling while polling
      addNotification(state.currentUser?.id || 'sys', 'Code analysis started. This may take up to a minute...', 'system');
      const res = await fetch(`/api/projects/${id}/analyze`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addNotification(state.currentUser?.id || 'sys', `Analysis complete! Found ${data.bugsFound} bugs.`, 'system');
        await fetchBugs(); // Sync newly generated automated bugs into dashboard
      } else {
        const data = await res.json();
        addNotification(state.currentUser?.id || 'sys', data.error || 'Analysis failed', 'system');
      }
    } catch (e) {
      console.error('Failed to analyze project', e);
      addNotification(state.currentUser?.id || 'sys', 'Network error during analysis.', 'system');
    }
  }, [state.currentUser, addNotification, fetchBugs]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      await api.updateProject(id, updates);
      await fetchProjects();
    } catch (e) { console.error("Failed updateProject", e); }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await api.deleteProject(id);
      await fetchProjects();
    } catch (e) { console.error("Failed deleteProject", e); }
  }, [fetchProjects]);

  const updateUserRole = useCallback(async (userId: string, role: Role) => {
    try {
      await api.updateUserRole(userId, role);
      await fetchUsers();
    } catch (e) { console.error("Failed update role", e); }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await api.deleteUser(userId);
      await fetchUsers();
    } catch (e) { console.error("Failed delete user", e); }
  }, [fetchUsers]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      if (state.currentUser) await fetchNotifications(state.currentUser.id);
    } catch (e) { console.error("Failed mark notif read", e); }
    // Optimistic UI update: Assume success and clear notification visually immediately
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }, [state.currentUser, fetchNotifications]);

  const markAllNotificationsRead = useCallback(async () => {
    if (state.currentUser) {
      try {
        await api.markAllNotificationsRead(state.currentUser.id);
        await fetchNotifications(state.currentUser.id);
      } catch (e) { console.error("Failed mark all read", e); }
    }
    // Optimistic UI update for bulk clear
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n =>
        n.userId === s.currentUser?.id ? { ...n, read: true } : n
      ),
    }));
  }, [state.currentUser, fetchNotifications]);

  const setLanguage = useCallback((lang: Language) => {
    setState(s => ({ ...s, language: lang })); // Update active locale mapping
  }, []);

  // Quick lookup utilities minimizing component logic
  const getBugById = useCallback((id: string) => state.bugs.find(b => b.id === id), [state.bugs]);
  const getUserById = useCallback((id: string) => state.users.find(u => u.id === id), [state.users]);

  // Derived authorization property
  const isGuest = state.currentUser?.role === 'guest';

  // Derived getters for contextual rendering (mostly used by Analytics dashboard)
  const getMyAssignedBugs = useCallback((userId: string) => {
    return state.bugs.filter(b => b.assigneeId === userId && b.status !== 'closed');
  }, [state.bugs]);

  const getBugsReportedByMe = useCallback((userId: string) => {
    return state.bugs.filter(b => b.reporterId === userId);
  }, [state.bugs]);

  const getOpenBugsCount = useCallback(() => {
    return state.bugs.filter(b => b.status === 'new' || b.status === 'open').length;
  }, [state.bugs]);

  const getCriticalBugsCount = useCallback(() => {
    return state.bugs.filter(b => b.severity === 'critical' && b.status !== 'closed').length;
  }, [state.bugs]);

  // Wrap all state elements into the comprehensive object expected by AppContextType
  const value: AppContextType = {
    ...state, login, loginWithGoogle, loginAsGuest, register, verifyEmail, logout, resetPassword,
    addBug, updateBug, changeBugStatus,
    assignBug, addComment, addAttachment, addProject, updateProject, deleteProject,
    fetchProjects, fetchBugs, analyzeProject,
    updateUserRole, deleteUser, addNotification, markNotificationRead,
    markAllNotificationsRead, getBugById, getUserById, setLanguage, isGuest,
    getMyAssignedBugs, getBugsReportedByMe, getOpenBugsCount, getCriticalBugsCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
