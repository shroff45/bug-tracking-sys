import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { t } from '../i18n';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginAsGuest, language } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (login(email, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">🐛</div>
            <h1 className="text-3xl font-bold text-white">BugTracker<span className="text-purple-400">AI</span></h1>
          </div>
          <p className="text-slate-400">Smart Bug Tracking with Deep Learning</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">{t('signIn', language)}</h2>
          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Sign in form">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1.5">{t('email', language)}</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bugtracker.com" aria-required="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1.5">{t('password', language)}</label>
              <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-required="true"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition">{t('forgotPassword', language)}</Link>
            </div>
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition transform hover:scale-[1.02]">
              {t('signIn', language)}
            </button>
          </form>

          {/* Guest Access */}
          <button onClick={handleGuest}
            className="w-full mt-3 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 font-medium rounded-xl transition flex items-center justify-center gap-2">
            👁️ {t('continueAsGuest', language)}
          </button>

          <p className="mt-6 text-center text-slate-400 text-sm">
            {t('dontHaveAccount', language)} <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">{t('signUp', language)}</Link>
          </p>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 mb-3 text-center">{t('demoAccounts', language)}</p>
            <div className="space-y-2 text-xs">
              {[
                { role: '👑 Admin', email: 'admin@bugtracker.com', pass: 'admin123' },
                { role: '👩‍💻 Developer', email: 'jane@bugtracker.com', pass: 'pass123' },
                { role: '🔍 Tester', email: 'bob@bugtracker.com', pass: 'pass123' },
              ].map(d => (
                <button key={d.email} type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="w-full flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition text-left"
                  aria-label={`Use ${d.role} demo account`}>
                  <span className="text-slate-300">{d.role}</span>
                  <span className="text-slate-500">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
