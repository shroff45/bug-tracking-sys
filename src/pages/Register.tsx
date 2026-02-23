import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const { register, verifyEmail, currentUser, language } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (register(name, email, password, role)) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-slate-400 text-sm mb-2">
              We've sent a verification email to <span className="text-purple-400 font-medium">{email}</span>
            </p>
            <p className="text-xs text-slate-500 mb-6">(Simulated — click below to verify)</p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-slate-500 mb-1">📨 From: noreply@bugtracker.ai</p>
              <p className="text-xs text-slate-500 mb-2">📋 Subject: Verify your email address</p>
              <div className="border-t border-white/5 pt-3">
                <p className="text-xs text-slate-400">Hello {name},</p>
                <p className="text-xs text-slate-400 mt-1">Click the button below to verify your email and activate your account.</p>
                <p className="text-[10px] text-slate-600 mt-2 font-mono">Token: VRF-{btoa(email).slice(0, 16)}</p>
              </div>
            </div>

            <button onClick={handleVerify}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/20 transition transform hover:scale-[1.02]">
              ✅ Verify Email & Continue
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">🐛</div>
            <h1 className="text-3xl font-bold text-white">BugTracker<span className="text-purple-400">AI</span></h1>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">{t('createAccount', language)}</h2>
          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Registration form">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-slate-300 mb-1.5">{t('fullName', language)}</label>
              <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" aria-required="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-1.5">{t('email', language)}</label>
              <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" aria-required="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-1.5">{t('password', language)}</label>
              <input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-required="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('role', language)}</label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select role">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    role="radio" aria-checked={role === r.value} aria-label={`${r.label} - ${r.desc}`}
                    className={`p-3 rounded-xl border text-center transition ${role === r.value ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}>
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-xs font-medium">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition transform hover:scale-[1.02]">
              {t('createAccount', language)}
            </button>
          </form>
          <p className="mt-6 text-center text-slate-400 text-sm">
            {t('alreadyHaveAccount', language)} <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">{t('signIn', language)}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
