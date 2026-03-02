/**
 * src/pages/Login.tsx
 * 
 * CORE VIEW: User Authentication Form
 * 
 * Features:
 * 1. Traditional email/password based sign-in.
 * 2. Google OAuth integration via `@react-oauth/google`.
 * 3. Guest Access: Provides a limited, read-only view of the dashboard.
 * 4. Demo Accounts: Quick access buttons to test different roles.
 * 
 * Why this code/type is used:
 * - useState: Manages form inputs (email, password) and authentication error state locally.
 * - useAppContext: Accesses global login mutations (`login`, `loginWithGoogle`, `loginAsGuest`) and localization context.
 * - useNavigate: Redirects the user to the `/dashboard` route upon successful authentication.
 * - GoogleLogin: Third-party component to handle Google's OAuth 2.0 flow natively.
 */
import { useState } from 'react'; // React hook for local component state
import { useNavigate, Link } from 'react-router-dom'; // Routing hooks and components
import { GoogleLogin } from '@react-oauth/google'; // Google OAuth integration
import { useAppContext } from '../store'; // Global app context access
import { t } from '../i18n'; // Translation utility

// Main functional component for the Login page
export default function Login() {
  // Local state for authentication credentials and error feedback
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Destructure context variables for auth mutations and language
  const { login, loginWithGoogle, loginAsGuest, language } = useAppContext();
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Form submission handler for traditional email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // End default event propagation (page refresh)
    setError(''); // Clear previous errors

    // Basic client-side validation
    if (!email || !password) { setError('Please fill in all fields'); return; }

    // Attempt login via context mutation
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard'); // Route to dashboard on success
    } else {
      setError('Invalid email or password'); // Show generic error on failure
    }
  };

  // Handler for bypass login as a read-only guest
  const handleGuest = () => {
    loginAsGuest(); // Set global guest state
    navigate('/dashboard'); // Route to dashboard with limited permissions
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-foreground text-background rounded-md flex items-center justify-center text-xl shadow-sm">🐛</div>
            <h1 className="text-3xl font-bold text-foreground">BugTracker<span className="text-muted-foreground font-normal">AI</span></h1>
          </div>
          <p className="text-muted-foreground text-sm">Smart Bug Tracking with Deep Learning</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('signIn', language)}</h2>
          {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Sign in form">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">{t('email', language)}</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bugtracker.com" aria-required="true"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">{t('password', language)}</label>
              <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-required="true"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t('forgotPassword', language)}</Link>
            </div>
            <button type="submit" className="w-full py-2.5 bg-foreground text-background font-medium rounded-md shadow-sm hover:bg-foreground/90 transition-colors">
              {t('signIn', language)}
            </button>
          </form>

          <div className="mt-4 flex flex-col items-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  const success = await loginWithGoogle(credentialResponse.credential);
                  if (success) {
                    navigate('/dashboard');
                  } else {
                    setError('Google Sign-In failed');
                  }
                }
              }}
              onError={() => {
                setError('Google Sign-In was unsuccessful');
              }}
              useOneTap
            />
          </div>

          {/* Guest Access */}
          <button onClick={handleGuest}
            className="w-full mt-3 py-2.5 bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-medium rounded-md transition-colors flex items-center justify-center gap-2">
            👁️ {t('continueAsGuest', language)}
          </button>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            {t('dontHaveAccount', language)} <Link to="/register" className="text-foreground hover:underline font-medium">{t('signUp', language)}</Link>
          </p>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 text-center">{t('demoAccounts', language)}</p>
            <div className="space-y-2 text-xs">
              {[
                { role: '👑 Admin', email: 'admin@bugtracker.com', pass: 'admin123' },
                { role: '👩‍💻 Developer', email: 'jane@bugtracker.com', pass: 'pass123' },
                { role: '🔍 Tester', email: 'bob@bugtracker.com', pass: 'pass123' },
              ].map(d => (
                <button key={d.email} type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="w-full flex items-center justify-between p-2.5 bg-background hover:bg-secondary/50 rounded-md border border-border transition-colors text-left"
                  aria-label={`Use ${d.role} demo account`}>
                  <span className="text-foreground">{d.role}</span>
                  <span className="text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
