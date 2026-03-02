/**
 * src/App.tsx
 * 
 * CORE ARCHITECTURE: Application Routing & Protection
 * 
 * Defines the main routing structure of the application using React Router.
 * It wraps the application with the global state provider (AppProvider) and 
 * sets up component-based route protection based on user authentication and roles.
 * 
 * Why this code/type is used:
 * - react-router-dom (BrowserRouter, Routes, Route, Navigate): Standard declarative routing library for React single-page applications. Allows deep linking and history management without full page reloads.
 * - GoogleOAuthProvider: Wraps the entire app to enable native Google Sign-In button rendering and token handling anywhere in the tree.
 * - Custom Route Wrappers (ProtectedRoute, AdminRoute): Abstract away the authorization logic (checking context state) from the UI components themselves, keeping route definitions clean and declarative.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import BugReport from './pages/BugReport';
import BugDetails from './pages/BugDetails';
import Analytics from './pages/Analytics';
import AIEnginePage from './pages/AIEnginePage';
import Admin from './pages/Admin';

/**
 * ProtectedRoute: Requires the user to be logged in. 
 * If not logged in, redirects to the /login page securely dropping the current attempt.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext(); // Extract identity from global context
  if (!currentUser) return <Navigate to="/login" replace />; // 'replace' prevents dead back-button loops
  return <>{children}</>; // Render the actual requested route component
}

/**
 * AdminRoute: Requires the user to be logged in AND have the 'admin' role.
 * Redirects non-admins safely to the dashboard, and completely unauthenticated users to login.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />; // Stop unauthorized escalation
  return <>{children}</>;
}

/**
 * AuthRoute: Prevents logged-in users from seeing auth pages (login/register).
 * Redirects them straight to the dashboard if they already have an active functional session.
 */
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  if (currentUser) return <Navigate to="/dashboard" replace />; // Auto-forward
  return <>{children}</>;
}

/**
 * WriteProtectedRoute: Prevents users with 'guest' privileges from uploading/writing data.
 * Used for pages like 'Report Bug' where mutating access to the database is strictly required.
 */
function WriteProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isGuest } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (isGuest) return <Navigate to="/dashboard" replace />; // Block read-only guests
  return <>{children}</>;
}

/**
 * AppRoutes: Defines the URL paths string definitions and maps them to React Components.
 * Utilizes nested routes within the `<Layout />` component for the main app UI framing.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public / Authentication Routes - Wrapped to prevent logged in users from visiting */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

      {/* Protected Application Routes wrapped in the main Layout (Sidebar/Header shell) */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Index route: Automatically push to dashboard when hitting the root domain */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        {/* Write-protected route: Only authenticated, non-guests can report bugs */}
        <Route path="report" element={<WriteProtectedRoute><BugReport /></WriteProtectedRoute>} />

        {/* Dynamic route: Captures the bug ID from the URL params */}
        <Route path="bug/:id" element={<BugDetails />} />

        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-engine" element={<AIEnginePage />} />

        {/* Admin-only route for system management (Role checking) */}
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      {/* Fallback route (Catch-all): Send 404s back to the safety of the dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/**
 * App: The root React Component that initializes the router hierarchy, global state, and OAuth keys.
 */
import { GoogleOAuthProvider } from '@react-oauth/google';

export function App() {
  // Pulls the client ID from vite environment variables, falling back to dummy string for local dev limits
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

  return (
    // 1. Injects Google API scripts for sign in
    <GoogleOAuthProvider clientId={clientId}>
      {/* 2. Starts tracking browser history/URL */}
      <BrowserRouter>
        {/* 3. Boots up the global state orchestrator */}
        <AppProvider>
          {/* 4. Renders the actual routing logic */}
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
