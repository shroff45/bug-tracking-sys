import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetComplete, setResetComplete] = useState(false);
    const { resetPassword, users } = useAppContext();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) { setError('Please enter your email'); return; }
        if (resetPassword(email)) {
            setSent(true);
        } else {
            setError('No account found with this email');
        }
    };

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        // Simulate password reset
        const _user = users.find(u => u.email === email);
        if (_user) {
            setResetComplete(true);
        }
    };

    if (resetComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Password Reset Complete</h2>
                        <p className="text-slate-400 mb-6">Your password has been successfully reset.</p>
                        <Link to="/login" className="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl text-center shadow-lg shadow-purple-500/30 transition hover:from-purple-500 hover:to-indigo-500">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📧</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Check Your Email</h2>
                        <p className="text-slate-400 text-sm mb-6 text-center">
                            We've sent a password reset link to <span className="text-purple-400 font-medium">{email}</span>.
                            <br /><span className="text-xs text-slate-500 mt-1 block">(Simulated — enter your new password below)</span>
                        </p>
                        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">{error}</div>}
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="text-xs text-purple-400 mb-1">🔑 Reset Token</p>
                                <p className="text-xs text-slate-500 font-mono">RST-{btoa(email).slice(0, 12)}...valid</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition">
                                Reset Password
                            </button>
                        </form>
                        <p className="mt-4 text-center">
                            <Link to="/login" className="text-sm text-slate-400 hover:text-purple-400 transition">← Back to Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
                    <p className="text-sm text-slate-400 mb-6">Enter your email to receive a password reset link.</p>
                    {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition transform hover:scale-[1.02]">
                            Send Reset Link
                        </button>
                    </form>
                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Remember your password? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
