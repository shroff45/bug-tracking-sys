import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAppContext } from '../store';
import { t } from '../i18n';
import type { Role } from '../types';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('tester');
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const { register, verifyEmail, currentUser, loginWithGoogle, language } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    const success = await register(name, email, password, role);
    if (success) {
      setShowVerification(true);
    } else {
      setError('Email already exists');
    }
  };

  const handleVerify = () => {
    if (currentUser) {
      verifyEmail(currentUser.id);
      navigate('/dashboard');
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 shadow-md text-center">
            <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h2>
            <p className="text-muted-foreground text-sm mb-2">
              We've sent a verification email to <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-6">(Simulated — click below to verify)</p>

            <div className="bg-background border border-border rounded-md p-4 mb-4 text-left">
              <p className="text-xs text-muted-foreground mb-1">📨 From: noreply@bugtracker.ai</p>
              <p className="text-xs text-muted-foreground mb-2">📋 Subject: Verify your email address</p>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-foreground/80">Hello {name},</p>
                <p className="text-xs text-foreground/80 mt-1">Click the button below to verify your email and activate your account.</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">Token: VRF-{btoa(email).slice(0, 16)}</p>
              </div>
            </div>

            <button onClick={handleVerify}
              className="w-full py-2.5 bg-foreground text-background font-medium rounded-md shadow-sm hover:bg-foreground/90 transition-colors">
              ✅ Verify Email & Continue
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roles: { value: Role; label: string; icon: string; desc: string }[] = [
    { value: 'tester', label: 'Tester', icon: '🔍', desc: 'Report and verify bugs' },
    { value: 'developer', label: 'Developer', icon: '👩‍💻', desc: 'Fix bugs and update status' },
    { value: 'admin', label: 'Admin', icon: '👑', desc: 'Full system access' },
  ];

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
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('createAccount', language)}</h2>
          {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Registration form">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1.5">{t('fullName', language)}</label>
              <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" aria-required="true"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-1.5">{t('email', language)}</label>
              <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" aria-required="true"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-foreground mb-1.5">{t('password', language)}</label>
              <input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-required="true"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('role', language)}</label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select role">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    role="radio" aria-checked={role === r.value} aria-label={`${r.label} - ${r.desc}`}
                    className={`p-3 rounded-md border text-center transition-colors ${role === r.value ? 'bg-secondary border-border text-secondary-foreground shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      }`}>
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-xs font-medium">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-foreground text-background font-medium rounded-md shadow-sm hover:bg-foreground/90 transition-colors">
              {t('createAccount', language)}
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
          <p className="mt-6 text-center text-muted-foreground text-sm">
            {t('alreadyHaveAccount', language)} <Link to="/login" className="text-foreground hover:underline font-medium">{t('signIn', language)}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
