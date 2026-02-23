import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store';
import { t, LANGUAGES } from '../i18n';
import HelpPanel from './HelpPanel';

export default function Layout() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead, logout, language, setLanguage, isGuest } = useAppContext();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const myNotifs = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  // Keyboard shortcut: Ctrl+/ to toggle help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); setShowHelp(h => !h); }
      if (e.key === 'Escape') { setShowHelp(false); setShowNotif(false); setShowLang(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const links = [
    { to: '/dashboard', icon: '📊', label: t('dashboard', language) },
    ...(!isGuest ? [{ to: '/report', icon: '🐛', label: t('reportBug', language) }] : []),
    { to: '/analytics', icon: '📈', label: t('analytics', language) },
    { to: '/ai-engine', icon: '🧠', label: t('aiEngine', language) },
    ...(currentUser?.role === 'admin' ? [{ to: '/admin', icon: '⚙️', label: t('adminPanel', language) }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900/80 border-r border-white/5 flex flex-col transition-all duration-300 flex-shrink-0`}
        role="navigation" aria-label="Main navigation">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-purple-500/20 flex-shrink-0">🐛</div>
            {sidebarOpen && <span className="text-lg font-bold">BugTracker<span className="text-purple-400">AI</span></span>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Navigation links">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              aria-label={l.label}>
              <span className="text-lg">{l.icon}</span>
              {sidebarOpen && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>
        {/* Sidebar footer */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <span>{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0" role="banner">
          <div className="flex items-center gap-2">
            {isGuest && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-medium rounded-full border border-yellow-500/30">
                👁️ {t('guestAccess', language)} (Read-Only)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button onClick={() => { setShowLang(!showLang); setShowNotif(false); }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition text-sm"
                aria-label="Change language" aria-haspopup="true" aria-expanded={showLang}>
                {LANGUAGES.find(l => l.code === language)?.flag || '🌐'}
              </button>
              {showLang && (
                <div className="absolute right-0 top-12 w-44 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" role="menu">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setShowLang(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition ${language === l.code ? 'bg-purple-600/20 text-purple-400' : 'text-slate-300 hover:bg-white/5'}`}
                      role="menuitem">
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Help Button */}
            <button onClick={() => setShowHelp(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              aria-label="Open help panel" title="Help (Ctrl+/)">
              ❓
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setShowNotif(!showNotif); setShowLang(false); }}
                className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                aria-label={`${t('notifications', language)} - ${unreadCount} unread`} aria-haspopup="true" aria-expanded={showNotif}>
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold" aria-hidden="true">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" role="menu">
                  <div className="flex items-center justify-between p-3 border-b border-white/10">
                    <span className="text-sm font-semibold">{t('notifications', language)}</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-xs text-purple-400 hover:text-purple-300" aria-label={t('markAllRead', language)}>
                        {t('markAllRead', language)}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {myNotifs.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500 text-center">{t('noNotifications', language)}</p>
                    ) : (
                      myNotifs.slice(-10).reverse().map(n => (
                        <button key={n.id}
                          onClick={() => { markNotificationRead(n.id); if (n.bugId) { navigate(`/bug/${n.bugId}`); setShowNotif(false); } }}
                          className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition ${!n.read ? 'bg-purple-500/5' : ''}`}
                          role="menuitem">
                          <div className="flex items-start gap-2">
                            <span className="text-sm mt-0.5">
                              {n.type === 'assignment' ? '📌' : n.type === 'status' ? '🔄' : n.type === 'comment' ? '💬' : n.type === 'ai' ? '🧠' : '📢'}
                            </span>
                            <div>
                              <p className={`text-xs ${!n.read ? 'text-white' : 'text-slate-400'}`}>{n.message}</p>
                              <p className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-purple-500 rounded-full ml-auto flex-shrink-0 mt-1" aria-label="Unread" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button onClick={() => { setShowNotif(false); setShowLang(false); }}
                className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10 hover:bg-white/5 rounded-lg transition"
                aria-label="User menu" aria-haspopup="true">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm" aria-hidden="true">
                  {currentUser?.avatar || '👤'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-white">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{currentUser?.role}</p>
                </div>
              </button>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition" aria-label={t('signOut', language)} title="Sign Out">
              🚪
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" role="main">
          <Outlet />
        </main>
      </div>

      {/* Help Panel */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </div>
  );
}
