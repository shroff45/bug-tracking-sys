/**
 * src/api/index.ts
 * 
 * DATA LAYER: REST API Client SDK
 * 
 * This file serves as the main SDK/Client for the frontend application linking it to the Express backend.
 * It provides strongly typed wrapper functions for all backend REST API endpoints.
 * By centralizing these calls here, React components don't need to know the exact 
 * URL paths or HTTP methods, they just call these clean async functions.
 * 
 * Why this code/type is used:
 * - Centralized fetching: Using a base `apiFetch` function keeps logic like JWT attaching and JSON parsing in one place.
 * - TypeScript Generics (`apiFetch<T>`): Guarantees the shape of the data returned by the server matches internal domain models.
 * - Default Exports: Arrow functions cleanly declare the exact inputs and outputs for every valid mutation/query in the system.
 */
import { apiFetch } from './apiClient';
import type { User, Project, Bug, Notification, Role, BugStatus, Comment, Attachment, SeverityPrediction, DuplicateResult } from '../types';

// ==========================================
// Authentication Endpoints
// ==========================================

export const loginUser = (email: string, password: string) =>
    apiFetch<{ user: User, token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

export const registerUser = (name: string, email: string, password: string, role: Role) =>
    apiFetch<{ user: User, token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
    });

export const loginWithGoogle = (credential: string) =>
    apiFetch<{ user: User, token: string }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential })
    });

// ==========================================
// User Management Endpoints
// ==========================================

export const fetchUsers = () => apiFetch<User[]>('/users');
export const updateUserRole = (id: string, role: Role) =>
    apiFetch<User>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
export const deleteUser = (id: string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' });

// ==========================================
// Project Management Endpoints
// ==========================================

export const fetchProjects = () => apiFetch<Project[]>('/projects');
export const createProject = (name: string, description: string, repoUrl?: string) =>
    apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify({ name, description, repoUrl }) });
export const updateProject = (id: string, updates: Partial<Project>) =>
    apiFetch<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteProject = (id: string) =>
    apiFetch<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' });
export const analyzeProject = (id: string) =>
    apiFetch<{ message: string, bugsFound: number }>(`/projects/${id}/analyze`, { method: 'POST' });

// ==========================================
// Bug / Issue Tracking Endpoints
// ==========================================

export const fetchBugs = () => apiFetch<Bug[]>('/bugs');
export const createBug = (bugData: Partial<Bug>) =>
    apiFetch<Bug>('/bugs', { method: 'POST', body: JSON.stringify(bugData) });
export const updateBug = (id: string, updates: Partial<Bug>) =>
    apiFetch<Bug>(`/bugs/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const changeBugStatus = (id: string, status: BugStatus, userId: string, userName: string) =>
    apiFetch<{ success: boolean, newStatus: string }>(`/bugs/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, userId, userName })
    });
export const assignBug = (id: string, userId: string, userName: string) =>
    apiFetch<{ success: boolean, assigneeId: string, assigneeName: string }>(`/bugs/${id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ userId, userName })
    });
export const addBugComment = (id: string, userId: string, userName: string, text: string) =>
    apiFetch<Comment>(`/bugs/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ userId, userName, text })
    });
export const addBugAttachment = (id: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) =>
    apiFetch<Attachment>(`/bugs/${id}/attachments`, {
        method: 'POST',
        body: JSON.stringify(attachment)
    });

// ==========================================
// Notification System Endpoints
// ==========================================

export const fetchNotifications = (userId: string) => apiFetch<Notification[]>(`/notifications/${userId}`);
export const markNotificationRead = (id: string) => apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = (userId: string) => apiFetch<{ success: boolean }>(`/notifications/user/${userId}/read-all`, { method: 'PUT' });

// ==========================================
// AI Engine / Gemini Endpoints
// ==========================================

/**
 * Sends bug title and description to the backend Gemini route to predict exact severity.
 */
export const predictSeverity = (title: string, description: string) =>
    apiFetch<SeverityPrediction>('/ai/predict-severity', {
        method: 'POST',
        body: JSON.stringify({ title, description })
    });

/**
 * Takes bug info and performs a Retrieval-Augmented Generation (RAG) check 
 * against the SQLite DB via the backend AI route to find duplicate bugs.
 */
export const detectDuplicates = (title: string, description: string) =>
    apiFetch<DuplicateResult[]>('/ai/detect-duplicates', {
        method: 'POST',
        body: JSON.stringify({ title, description })
    });
