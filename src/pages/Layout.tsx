/**
 * src/pages/Layout.tsx
 * 
 * CORE VIEW: Main Application Shell
 * 
 * Features:
 * 1. Persistent Sidebar Navigation mapping to core application routes.
 * 2. Top Header including Language switcher, Notifications panel, and User Profile.
 * 3. Keyboard Shortcuts: Exposes a global listener (`Ctrl+/`) to trigger the help panel.
 * 4. Nested Routing: Relies on react-router's `<Outlet />` component to render child pages.
 * 
 * Why this code/type is used:
 * - useState/useEffect: Manages local UI toggles (sidebar open/close, dropdowns) and global keyboard event listeners.
 * - useAppContext: Injects global settings (theme, language, identity state) directly into the shell framing.
 * - React Router (Outlet, NavLink, useNavigate): Coordinates URL-based view changes within the main content pane without reloading the shell.
 */
import { useState, useEffect } from 'react'; // React core hooks
import { Outlet, NavLink, useNavigate } from 'react-router-dom'; // Routing mechanisms
import { useAppContext } from '../store'; // Global state provider
import { t, LANGUAGES } from '../i18n'; // Internationalization system
import HelpPanel from './HelpPanel'; // Reusable overlay component

// Main functional component for the application layout shell
export default function Layout() {
  // Destructure application context variables and mutators
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead, logout, language, setLanguage, isGuest } = useAppContext();
  const navigate = useNavigate(); // Hook for programmatic routing

  // Local UI state for popovers and sidebar
  const [showNotif, setShowNotif] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Compute unread notifications specific to the current user
  const myNotifs = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  // Setup global keyboard shortcuts
  // Listens for 'Ctrl+/' to toggle the persistent help panel
  // Listens for 'Escape' to proactively close any open popovers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Prevent default browser behavior (which often activates search) for Ctrl+/
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); setShowHelp(h => !h); }
      if (e.key === 'Escape') { setShowHelp(false); setShowNotif(false); setShowLang(false); }
    };
    window.addEventListener('keydown', handler); // Bind event listener
    return () => window.removeEventListener('keydown', handler); // Clean up on unmount
  }, []);

  // Configuration array for dynamic sidebar link generation
  // Uses conditional spread operator to hide restricted endpoints based on user roles
  const links = [
    { to: '/dashboard', icon: '📊', label: t('dashboard', language) },
    // Only display bug reporting capabilities if the user is authenticated (not a guest)
    ...(!isGuest ? [{ to: '/report', icon: '🐛', label: t('reportBug', language) }] : []),
    { to: '/analytics', icon: '📈', label: t('analytics', language) },
    { to: '/ai-engine', icon: '🧠', label: t('aiEngine', language) },
    // Only display admin configurations if the user has the 'admin' elevated role
    ...(currentUser?.role === 'admin' ? [{ to: '/admin', icon: '⚙️', label: t('adminPanel', language) }] : []),
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border flex flex-col transition-all duration-300 flex-shrink-0`}
        role="navigation" aria-label="Main navigation">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-md flex items-center justify-center text-sm flex-shrink-0">🐛</div>
            {sidebarOpen && <span className="text-sm font-semibold tracking-tight text-foreground">BugTracker<span className="text-zinc-400">AI</span></span>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Navigation links">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-zinc-800/50'}`}
              aria-label={l.label}>
              <span className="text-base">{l.icon}</span>
              {sidebarOpen && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>
        {/* Sidebar footer */}
        <div className="p-3 border-t border-border space-y-1">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-zinc-800/50 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <span>{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 flex-shrink-0" role="banner">
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
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-zinc-800/50 transition-colors text-sm"
                aria-label="Change language" aria-haspopup="true" aria-expanded={showLang}>
                {LANGUAGES.find(l => l.code === language)?.flag || '🌐'}
              </button>
              {showLang && (
                <div className="absolute right-0 top-10 w-40 bg-popover border border-border rounded-md shadow-md z-50 overflow-hidden" role="menu">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setShowLang(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${language === l.code ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-zinc-800/50 hover:text-foreground'}`}
                      role="menuitem">
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Help Button */}
            <button onClick={() => setShowHelp(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-zinc-800/50 transition-colors"
              aria-label="Open help panel" title="Help (Ctrl+/)">
              ❓
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setShowNotif(!showNotif); setShowLang(false); }}
                className="relative p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-zinc-800/50 transition-colors"
                aria-label={`${t('notifications', language)} - ${unreadCount} unread`} aria-haspopup="true" aria-expanded={showNotif}>
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold" aria-hidden="true">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-10 w-80 bg-popover border border-border rounded-md shadow-md z-50 overflow-hidden" role="menu">
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">{t('notifications', language)}</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-xs text-zinc-400 hover:text-zinc-300" aria-label={t('markAllRead', language)}>
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
                          className={`w-full text-left p-3 border-b border-border hover:bg-zinc-800/30 transition-colors ${!n.read ? 'bg-secondary/30' : ''}`}
                          role="menuitem">
                          <div className="flex items-start gap-2">
                            <span className="text-sm mt-0.5">
                              {n.type === 'assignment' ? '📌' : n.type === 'status' ? '🔄' : n.type === 'comment' ? '💬' : n.type === 'ai' ? '🧠' : '📢'}
                            </span>
                            <div>
                              <p className={`text-xs ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                              <p className="text-[10px] text-zinc-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-zinc-300 rounded-full ml-auto flex-shrink-0 mt-1" aria-label="Unread" />}
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
                className="flex items-center gap-2 ml-2 pl-2 border-l border-border hover:bg-zinc-800/30 rounded-md transition-colors"
                aria-label="User menu" aria-haspopup="true">
                <div className="w-7 h-7 bg-zinc-800 border border-border rounded-full flex items-center justify-center text-xs" aria-hidden="true">
                  {currentUser?.avatar || '👤'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-foreground leading-tight">{currentUser?.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize leading-tight">{currentUser?.role}</p>
                </div>
              </button>
            </div>
            <button onClick={logout} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-zinc-800/50 transition-colors" aria-label={t('signOut', language)} title="Sign Out">
              🚪
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background" role="main">
          <Outlet />
        </main>
      </div>

      {/* Help Panel */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </div>
  );
}
