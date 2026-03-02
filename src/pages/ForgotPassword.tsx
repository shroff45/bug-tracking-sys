/**
 * src/pages/ForgotPassword.tsx
 * 
 * CORE VIEW: Password Recovery Flow
 * 
 * Features:
 * 1. Step 1: Collects user email and simulates sending a password reset link.
 * 2. Step 2: Simulates the password reset form with a mock token.
 * 3. Step 3: Confirmation view before redirecting back to login.
 * 
 * Why this code/type is used:
 * - useState: Manages the multi-step form state locally, tracking error states and progression flags (`sent`, `resetComplete`).
 * - useAppContext: Accesses the mock `resetPassword` function and `users` array to validate the email exists in the local store.
 * - Conditional Rendering: Renders three distinct UI states within a single component file based on local state progression.
 */
import { useState } from 'react'; // React hook for local state management
import { Link } from 'react-router-dom'; // Router component for declarative navigation
import { useAppContext } from '../store'; // Global state access for user validation

// Main functional component for the Forgot Password flow
export default function ForgotPassword() {
    // Local state variables for form inputs and step tracking
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false); // Flag indicating if reset email was "sent"
    const [error, setError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetComplete, setResetComplete] = useState(false); // Flag indicating password reset success

    // Context hook to access user data and reset mutation
    const { resetPassword, users } = useAppContext();

    // Handler for initial email submission (Step 1 -> Step 2)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!email) { setError('Please enter your email'); return; }

        // Attempt password reset initialization (mocked in store)
        if (resetPassword(email)) {
            setSent(true); // Progress to Step 2
        } else {
            setError('No account found with this email'); // Validation failure
        }
    };

    // Handler for new password submission (Step 2 -> Step 3)
    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic password strength validation
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }

        // Simulate password reset logic (checking if user exists)
        const _user = users.find(u => u.email === email);
        if (_user) {
            setResetComplete(true); // Progress to Step 3 (Success)
        }
    };

    // UI Rendering blocks

    // View Stage 3: Reset Success View
    if (resetComplete) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border rounded-lg p-8 shadow-md text-center">
                        <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset Complete</h2>
                        <p className="text-muted-foreground mb-6">Your password has been successfully reset.</p>
                        <Link to="/login" className="inline-block w-full py-2.5 bg-foreground text-background font-medium rounded-md text-center shadow-sm transition-colors hover:bg-foreground/90">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // View Stage 2: Reset Form View (Simulated Token)
    if (sent) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border rounded-lg p-8 shadow-md">
                        <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📧</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Check Your Email</h2>
                        <p className="text-muted-foreground text-sm mb-6 text-center">
                            We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>.
                            <br /><span className="text-xs text-muted-foreground mt-1 block">(Simulated — enter your new password below)</span>
                        </p>
                        {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{error}</div>}
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="p-3 bg-background border border-border rounded-md">
                                <p className="text-xs text-foreground mb-1">🔑 Reset Token</p>
                                <p className="text-xs text-muted-foreground font-mono">RST-{btoa(email).slice(0, 12)}...valid</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
                            </div>
                            <button type="submit" className="w-full py-2.5 bg-foreground text-background font-medium rounded-md shadow-sm hover:bg-foreground/90 transition-colors">
                                Reset Password
                            </button>
                        </form>
                        <p className="mt-4 text-center">
                            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // View Stage 1: Initial Email Request Form (Default View)
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-foreground text-background rounded-md flex items-center justify-center text-xl shadow-sm">🐛</div>
                        <h1 className="text-3xl font-bold text-foreground">BugTracker<span className="text-muted-foreground font-normal">AI</span></h1>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Forgot Password</h2>
                    <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a password reset link.</p>
                    {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-foreground text-background font-medium rounded-md shadow-sm hover:bg-foreground/90 transition-colors">
                            Send Reset Link
                        </button>
                    </form>
                    <p className="mt-6 text-center text-muted-foreground text-sm">
                        Remember your password? <Link to="/login" className="text-foreground hover:underline font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
