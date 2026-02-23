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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function WriteProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isGuest } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (isGuest) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="report" element={<WriteProtectedRoute><BugReport /></WriteProtectedRoute>} />
        <Route path="bug/:id" element={<BugDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-engine" element={<AIEnginePage />} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
