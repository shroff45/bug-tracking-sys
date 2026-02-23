import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { t } from '../i18n';
import { canDragBug } from '../types';
import type { BugStatus, Severity, Bug } from '../types';

const STATUS_COLS: { status: BugStatus; label: string; color: string; icon: string; accent: string; glow: string }[] = [
  { status: 'new', label: 'New', color: 'border-blue-500/30 bg-blue-500/5', icon: '🆕', accent: 'border-l-blue-500', glow: 'shadow-blue-500/30 border-blue-500/60' },
  { status: 'open', label: 'Open', color: 'border-orange-500/30 bg-orange-500/5', icon: '📂', accent: 'border-l-orange-500', glow: 'shadow-orange-500/30 border-orange-500/60' },
  { status: 'in-progress', label: 'In Progress', color: 'border-yellow-500/30 bg-yellow-500/5', icon: '🔧', accent: 'border-l-yellow-500', glow: 'shadow-yellow-500/30 border-yellow-500/60' },
  { status: 'resolved', label: 'Resolved', color: 'border-green-500/30 bg-green-500/5', icon: '✅', accent: 'border-l-green-500', glow: 'shadow-green-500/30 border-green-500/60' },
  { status: 'closed', label: 'Closed', color: 'border-slate-500/30 bg-slate-500/5', icon: '🔒', accent: 'border-l-slate-500', glow: 'shadow-slate-500/30 border-slate-500/60' },
];

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
};

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

// Toast notification component
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-green-500/30 flex items-center gap-2.5 text-sm font-medium">
        <span className="text-lg">✅</span> {message}
      </div>
    </div>
  );
}

// Context menu for quick status change
function ContextMenu({ x, y, bug, onClose, onChangeStatus }: {
  x: number; y: number; bug: Bug;
  onClose: () => void; onChangeStatus: (bugId: string, status: BugStatus) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  const statuses: { status: BugStatus; label: string; icon: string }[] = [
    { status: 'new', label: 'New', icon: '🆕' },
    { status: 'open', label: 'Open', icon: '📂' },
    { status: 'in-progress', label: 'In Progress', icon: '🔧' },
    { status: 'resolved', label: 'Resolved', icon: '✅' },
    { status: 'closed', label: 'Closed', icon: '🔒' },
  ];

  return (
    <div ref={ref} className="fixed z-50 bg-slate-800 border border-white/15 rounded-xl shadow-2xl shadow-black/50 py-1.5 min-w-[200px] animate-scale-in"
      style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 300) }}
      role="menu" aria-label="Change bug status">
      <div className="px-3 py-2 border-b border-white/10">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Move to</p>
        <p className="text-xs text-white font-medium truncate mt-0.5">{bug.title}</p>
      </div>
      {statuses.map(s => (
        <button key={s.status} onClick={() => { onChangeStatus(bug.id, s.status); onClose(); }}
          disabled={bug.status === s.status}
          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition ${bug.status === s.status
            ? 'text-purple-400 bg-purple-500/10 font-medium cursor-default'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          role="menuitem">
          <span>{s.icon}</span>
          <span>{s.label}</span>
          {bug.status === s.status && <span className="ml-auto text-[10px] text-purple-400">Current</span>}
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { bugs, projects, users, changeBugStatus, currentUser, language, isGuest } = useAppContext();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Drag-and-drop state
  const [dragBugId, setDragBugId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<BugStatus | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bug: Bug } | null>(null);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Expanded card state (inline preview)
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Keyboard DnD state
  const [kbDragBugId, setKbDragBugId] = useState<string | null>(null);
  const [kbDragColIdx, setKbDragColIdx] = useState<number>(0);

  // Refs
  const dragImageRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<BugStatus, HTMLDivElement>>(new Map());

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bugs.forEach(b => b.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [bugs]);

  // Filter bugs
  const filtered = useMemo(() => {
    return bugs.filter(b => {
      if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterProject && b.projectId !== filterProject) return false;
      if (filterSeverity && b.severity !== filterSeverity) return false;
      if (filterAssignee && b.assigneeId !== filterAssignee) return false;
      if (filterTag && (!b.tags || !b.tags.includes(filterTag))) return false;
      if (filterDateFrom && new Date(b.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(b.createdAt) > new Date(filterDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [bugs, search, filterProject, filterSeverity, filterAssignee, filterTag, filterDateFrom, filterDateTo]);

  const stats = useMemo(() => ({
    total: filtered.length,
    new: filtered.filter(b => b.status === 'new').length,
    open: filtered.filter(b => b.status === 'open').length,
    inProgress: filtered.filter(b => b.status === 'in-progress').length,
    resolved: filtered.filter(b => b.status === 'resolved').length,
    closed: filtered.filter(b => b.status === 'closed').length,
    critical: filtered.filter(b => b.severity === 'critical').length,
  }), [filtered]);

  const userCanDrag = currentUser ? canDragBug(currentUser.role) : false;

  // --- Drag handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, bugId: string) => {
    if (!userCanDrag) return;
    setDragBugId(bugId);
    setExpandedCard(null);
    // Custom ghost image
    if (dragImageRef.current) {
      const bug = bugs.find(b => b.id === bugId);
      if (bug) {
        dragImageRef.current.textContent = bug.title;
        dragImageRef.current.style.display = 'block';
        e.dataTransfer.setDragImage(dragImageRef.current, 12, 12);
        // Hide after next frame
        requestAnimationFrame(() => {
          if (dragImageRef.current) dragImageRef.current.style.display = 'none';
        });
      }
    }
    e.dataTransfer.effectAllowed = 'move';
  }, [userCanDrag, bugs]);

  const handleDragOver = useCallback((e: React.DragEvent, status: BugStatus) => {
    if (!userCanDrag || !dragBugId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverColumn(status);
  }, [userCanDrag, dragBugId]);

  const handleDragLeave = useCallback((e: React.DragEvent, status: BugStatus) => {
    // Only clear if we're actually leaving this column (not entering a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (hoverColumn === status) setHoverColumn(null);
    }
  }, [hoverColumn]);

  const handleDrop = useCallback((e: React.DragEvent, status: BugStatus) => {
    e.preventDefault();
    if (dragBugId && userCanDrag) {
      const bug = bugs.find(b => b.id === dragBugId);
      if (bug && bug.status !== status) {
        changeBugStatus(dragBugId, status);
        setJustDroppedId(dragBugId);
        setToast(`Moved "${bug.title}" → ${status.replace('-', ' ')}`);
        setTimeout(() => setJustDroppedId(null), 800);
      }
    }
    setDragBugId(null);
    setHoverColumn(null);
  }, [dragBugId, userCanDrag, bugs, changeBugStatus]);

  const handleDragEnd = useCallback(() => {
    setDragBugId(null);
    setHoverColumn(null);
  }, []);

  // --- Context menu ---
  const handleContextMenu = useCallback((e: React.MouseEvent, bug: Bug) => {
    if (!userCanDrag || isGuest) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, bug });
  }, [userCanDrag, isGuest]);

  const handleContextStatusChange = useCallback((bugId: string, status: BugStatus) => {
    const bug = bugs.find(b => b.id === bugId);
    if (bug && bug.status !== status) {
      changeBugStatus(bugId, status);
      setJustDroppedId(bugId);
      setToast(`Moved "${bug.title}" → ${status.replace('-', ' ')}`);
      setTimeout(() => setJustDroppedId(null), 800);
    }
  }, [bugs, changeBugStatus]);

  // --- Keyboard DnD ---
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, bug: Bug) => {
    if (!userCanDrag || isGuest) return;

    if (e.key === 'Enter' && !kbDragBugId) {
      // Pick up
      e.preventDefault();
      const colIdx = STATUS_COLS.findIndex(c => c.status === bug.status);
      setKbDragBugId(bug.id);
      setKbDragColIdx(colIdx);
      setHoverColumn(bug.status);
    }
  }, [userCanDrag, isGuest, kbDragBugId]);

  // Global keyboard listener for keyboard DnD
  useEffect(() => {
    if (!kbDragBugId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setKbDragBugId(null);
        setHoverColumn(null);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(kbDragColIdx + 1, STATUS_COLS.length - 1);
        setKbDragColIdx(next);
        setHoverColumn(STATUS_COLS[next].status);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(kbDragColIdx - 1, 0);
        setKbDragColIdx(prev);
        setHoverColumn(STATUS_COLS[prev].status);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const targetStatus = STATUS_COLS[kbDragColIdx].status;
        const bug = bugs.find(b => b.id === kbDragBugId);
        if (bug && bug.status !== targetStatus) {
          changeBugStatus(kbDragBugId, targetStatus);
          setJustDroppedId(kbDragBugId);
          setToast(`Moved "${bug.title}" → ${targetStatus.replace('-', ' ')}`);
          setTimeout(() => setJustDroppedId(null), 800);
        }
        setKbDragBugId(null);
        setHoverColumn(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [kbDragBugId, kbDragColIdx, bugs, changeBugStatus]);

  // --- Card expand toggle ---
  const toggleExpand = useCallback((e: React.MouseEvent, bugId: string) => {
    e.stopPropagation();
    setExpandedCard(prev => prev === bugId ? null : bugId);
  }, []);

  const clearFilters = () => {
    setSearch(''); setFilterProject(''); setFilterSeverity('');
    setFilterAssignee(''); setFilterTag(''); setFilterDateFrom(''); setFilterDateTo('');
  };

  // Export bugs to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Severity', 'Status', 'Project', 'Assignee', 'Reporter', 'Created', 'Tags'];
    const rows = filtered.map(b => [
      b.id,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.description.replace(/"/g, '""')}"`,
      b.severity,
      b.status,
      projects.find(p => p.id === b.projectId)?.name || '',
      b.assigneeName || '',
      b.reporterName,
      new Date(b.createdAt).toLocaleDateString(),
      b.tags ? b.tags.join(', ') : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bugs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = filterProject || filterSeverity || filterAssignee || filterTag || filterDateFrom || filterDateTo;
  const developers = users.filter(u => u.role === 'developer' || u.role === 'admin');
  const isDragging = !!dragBugId || !!kbDragBugId;

  return (
    <div className="space-y-6" role="main" aria-label="Dashboard">
      {/* Hidden drag ghost image */}
      <div ref={dragImageRef}
        className="fixed -top-[200px] left-0 bg-purple-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-xl max-w-[200px] truncate pointer-events-none z-[9999]"
        style={{ display: 'none' }} />

      {/* Keyboard DnD announcement */}
      {kbDragBugId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-purple-600/90 backdrop-blur text-white px-5 py-2.5 rounded-xl shadow-xl shadow-purple-500/20 text-sm font-medium flex items-center gap-3">
            <span className="animate-pulse">🎯</span>
            Use <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] mx-0.5">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] mx-0.5">→</kbd> to move, <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] mx-0.5">Enter</kbd> to drop, <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] mx-0.5">Esc</kbd> to cancel
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isGuest && (
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/report" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 transition flex items-center gap-2">
            <span>🐛</span> {t('reportBug', language)}
          </Link>
          <Link to="/analytics" className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium rounded-xl transition flex items-center gap-2">
            <span>📈</span> {t('analytics', language)}
          </Link>
          <Link to="/ai-engine" className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium rounded-xl transition flex items-center gap-2">
            <span>🧠</span> {t('aiEngine', language)}
          </Link>
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium rounded-xl transition flex items-center gap-2">
              <span>⚙️</span> {t('adminPanel', language)}
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: t('totalBugs', language), value: stats.total, icon: '🐛', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/20' },
          { label: t('new', language), value: stats.new, icon: '🆕', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20' },
          { label: t('open', language), value: stats.open, icon: '📂', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/20' },
          { label: t('inProgress', language), value: stats.inProgress, icon: '🔧', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/20' },
          { label: t('resolved', language), value: stats.resolved, icon: '✅', color: 'from-green-500/20 to-emerald-500/20 border-green-500/20' },
          { label: t('closed', language), value: stats.closed, icon: '🔒', color: 'from-slate-500/20 to-gray-500/20 border-slate-500/20' },
          { label: t('critical', language), value: stats.critical, icon: '🔴', color: 'from-red-500/20 to-rose-500/20 border-red-500/20' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-3 border`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{s.icon}</span>
              <span className="text-lg font-bold text-white">{s.value}</span>
            </div>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search', language)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={t('search', language)} />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('project', language)}>
            <option value="">{t('allProjects', language)}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('severity', language)}>
            <option value="">{t('allSeverities', language)}</option>
            <option value="critical">🔴 {t('critical', language)}</option>
            <option value="high">🟠 {t('high', language)}</option>
            <option value="medium">🟡 {t('medium', language)}</option>
            <option value="low">🟢 {t('low', language)}</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${showFilters || hasActiveFilters ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}
            aria-expanded={showFilters} aria-label="Advanced filters">
            🔽 {t('filter', language)} {hasActiveFilters && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 px-2 py-1" aria-label="Clear all filters">✕ Clear</button>
          )}
          <button onClick={exportToCSV} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white transition flex items-center gap-1" aria-label="Export to CSV">
            📥 Export
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">{t('assignee', language)}</label>
              <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={t('assignee', language)}>
                <option value="">All Assignees</option>
                {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">{t('tags', language)}</label>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={t('tags', language)}>
                <option value="">All Tags</option>
                {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Date From</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Filter from date" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Date To</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Filter to date" />
            </div>
          </div>
        )}
      </div>

      {/* Drag hint */}
      {userCanDrag && !isGuest && !isDragging && (
        <p className="text-[10px] text-slate-600 text-center">
          💡 Drag cards between columns to change status • Right-click for quick menu • Press Enter on a focused card to start keyboard drag
        </p>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ═══ KANBAN BOARD ═══════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" role="region" aria-label="Bug status board">
        {STATUS_COLS.map(col => {
          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          const colBugs = filtered.filter(b => b.status === col.status).sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));
          const isHovered = hoverColumn === col.status && isDragging;
          const draggedBugCurrentCol = dragBugId ? bugs.find(b => b.id === dragBugId)?.status : null;
          const isSameCol = draggedBugCurrentCol === col.status;

          return (
            <div key={col.status}
              ref={el => { if (el) columnRefs.current.set(col.status, el); }}
              className={`rounded-xl border p-3 min-h-[220px] transition-all duration-300 relative
                ${col.color}
                ${isHovered && !isSameCol ? `shadow-lg ${col.glow} scale-[1.02] ring-2 ring-offset-2 ring-offset-slate-900` : ''}
                ${isHovered && isSameCol ? 'opacity-60' : ''}
                ${isDragging && !isHovered ? 'opacity-70' : ''}
              `}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={e => handleDragLeave(e, col.status)}
              onDrop={e => handleDrop(e, col.status)}
              role="region"
              aria-label={`${col.label} column - ${colBugs.length} bugs`}
              aria-dropeffect={isDragging ? 'move' : 'none'}>

              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>{col.icon}</span> {col.label}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${isHovered && !isSameCol ? 'bg-white/20 text-white scale-110' : 'bg-white/10 text-slate-400'
                  }`}>{colBugs.length}</span>
              </div>

              {/* Drop zone indicator */}
              {isHovered && !isSameCol && (
                <div className="mb-2 border-2 border-dashed border-white/30 rounded-lg p-3 flex items-center justify-center animate-pulse-slow">
                  <span className="text-xs text-white/50 font-medium">⬇ Drop here</span>
                </div>
              )}

              {/* Bug cards */}
              <div className="space-y-2">
                {colBugs.map(bug => {
                  const isBeingDragged = dragBugId === bug.id || kbDragBugId === bug.id;
                  const wasJustDropped = justDroppedId === bug.id;
                  const isExpanded = expandedCard === bug.id;

                  return (
                    <div key={bug.id}
                      draggable={userCanDrag && !isGuest}
                      onDragStart={e => handleDragStart(e, bug.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => navigate(`/bug/${bug.id}`)}
                      onContextMenu={e => handleContextMenu(e, bug)}
                      className={`p-3 rounded-lg border-l-[3px] transition-all duration-300 group relative
                        ${SEVERITY_BORDER[bug.severity]}
                        ${isBeingDragged
                          ? 'opacity-30 scale-95 bg-slate-900/30 border-white/5 rotate-1'
                          : wasJustDropped
                            ? 'animate-drop-in bg-slate-900/80 border-white/10 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/40'
                            : 'bg-slate-900/60 border-white/5 hover:border-purple-500/30 hover:bg-slate-800/80 hover:shadow-md hover:shadow-purple-500/10 hover:-translate-y-0.5'
                        }
                        ${userCanDrag && !isGuest ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                      `}
                      role="article"
                      aria-label={`Bug: ${bug.title}`}
                      aria-grabbed={isBeingDragged}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !kbDragBugId) handleCardKeyDown(e, bug);
                        else if (e.key === 'Enter' && !kbDragBugId) navigate(`/bug/${bug.id}`);
                      }}>

                      {/* Card content */}
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs text-white font-medium line-clamp-2 group-hover:text-purple-300 transition-colors flex-1">
                          {bug.title}
                        </p>
                        {/* Expand button */}
                        <button onClick={e => toggleExpand(e, bug.id)}
                          className="p-0.5 text-[10px] text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          aria-label={isExpanded ? 'Collapse' : 'Expand preview'}
                          title="Preview">
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {/* Expanded description preview */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-white/5 animate-expand">
                          <p className="text-[10px] text-slate-400 line-clamp-4 leading-relaxed">{bug.description}</p>
                          {bug.tags && bug.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {bug.tags.map(tag => (
                                <span key={tag} className="text-[8px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata row */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${SEVERITY_COLORS[bug.severity]}`}>
                          {bug.severity}
                        </span>
                        {bug.aiAnalyzed && <span className="text-[9px] text-purple-400" title="AI Analyzed">🧠</span>}
                        {bug.attachments.length > 0 && <span className="text-[9px] text-slate-500" title="Has attachments">📎</span>}
                        {bug.comments.length > 0 && (
                          <span className="text-[9px] text-slate-500 flex items-center gap-0.5" title={`${bug.comments.length} comments`}>
                            💬 {bug.comments.length}
                          </span>
                        )}
                        {/* Time ago */}
                        <span className="text-[8px] text-slate-600 ml-auto">
                          {formatTimeAgo(bug.createdAt)}
                        </span>
                      </div>

                      {/* Assignee */}
                      {bug.assigneeName && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[7px] text-white font-bold">
                            {bug.assigneeName.charAt(0)}
                          </div>
                          <p className="text-[10px] text-slate-500">{bug.assigneeName}</p>
                        </div>
                      )}

                      {/* Drag handle indicator */}
                      {userCanDrag && !isGuest && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-40 transition text-[8px] text-slate-500 select-none pointer-events-none">⠿</div>
                      )}
                    </div>
                  );
                })}
                {colBugs.length === 0 && !isHovered && (
                  <div className="text-center py-8">
                    <p className="text-2xl opacity-20 mb-1">{col.icon}</p>
                    <p className="text-[10px] text-slate-600">No bugs</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Overview */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">👥 {t('team', language)}</h3>
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className="text-xs text-purple-400 hover:text-purple-300 transition">
              {t('manageUsers', language)} →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {users.filter(u => u.role !== 'guest').map(user => {
            const assigned = bugs.filter(b => b.assigneeId === user.id && b.status !== 'closed');
            const resolved = bugs.filter(b => b.assigneeId === user.id && (b.status === 'resolved' || b.status === 'closed'));
            return (
              <div key={user.id} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{user.avatar}</span>
                  <div>
                    <p className="text-xs font-medium text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-center">
                    <p className="text-xs font-bold text-orange-400">{assigned.length}</p>
                    <p className="text-[9px] text-slate-500">{t('open', language)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-green-400">{resolved.length}</p>
                    <p className="text-[9px] text-slate-500">{t('resolved', language)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Stats (if logged in) */}
      {currentUser && !isGuest && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📋</span>
              <h4 className="text-sm font-semibold text-white">{t('myAssignedBugs', language)}</h4>
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {bugs.filter(b => b.assigneeId === currentUser.id && b.status !== 'closed').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✅</span>
              <h4 className="text-sm font-semibold text-white">{t('resolvedBugs', language)}</h4>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {bugs.filter(b => b.assigneeId === currentUser.id && (b.status === 'resolved' || b.status === 'closed')).length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🐛</span>
              <h4 className="text-sm font-semibold text-white">{t('reportedByMe', language)}</h4>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {bugs.filter(b => b.reporterId === currentUser.id).length}
            </p>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} bug={contextMenu.bug}
          onClose={() => setContextMenu(null)} onChangeStatus={handleContextStatusChange} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// Helper: relative time
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
