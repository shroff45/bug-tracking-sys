/**
 * src/pages/Dashboard.tsx
 * 
 * CORE VIEW: The main Kanban Board and Analytics Hub.
 * 
 * Features:
 * 1. Filter, Sort, and Search Open/Closed issues.
 * 2. Drag and Drop: Relies on HTML5 Drag and Drop API (+ Keyboard accessibility).
 * 3. Read/Write Context: Reads the global `bugs` array from `store.tsx`. When a user 
 *    drags a bug, it fires `changeBugStatus(id, newStatus)` which calls the backend 
 *    and immediately syncs the UI.
 * 4. Statistics Panel: Computes active metrics based on the filtered list.
 */
/**
 * src/pages/Dashboard.tsx
 * 
 * CORE VIEW: The main Kanban Board and Analytics Hub.
 * 
 * Features:
 * 1. Filter, Sort, and Search Open/Closed issues.
 * 2. Drag and Drop: Relies on HTML5 Drag and Drop API (+ Keyboard accessibility).
 * 3. Read/Write Context: Reads the global `bugs` array from `store.tsx`. When a user 
 *    drags a bug, it fires `changeBugStatus(id, newStatus)` which calls the backend 
 *    and immediately syncs the UI.
 * 4. Statistics Panel: Computes active metrics based on the filtered list.
 * 
 * Why this code/type is used:
 * - useState/useMemo: Manages complex local state for filters, search, and calculated statistics efficiently.
 * - useRef: Manages references to DOM elements necessary for custom Drag & Drop ghost images and context menus.
 * - useEffect/useCallback: Handles global event listeners for keyboard-accessible Drag & Drop and click-away detection.
 * - HTML5 DnD API (onDragStart, onDragOver, onDrop): Used over external libraries for lightweight, native drag-and-drop support.
 */
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'; // Core React hooks for state, memoization, and lifecycle
import { useNavigate, Link } from 'react-router-dom'; // Routing utilities
import { useAppContext } from '../store'; // Global state access
import { t } from '../i18n'; // Translation utility
import { canDragBug } from '../types'; // Domain logic for permissions
import type { BugStatus, Severity, Bug } from '../types'; // Type definitions

// Define the configuration for the Kanban columns, mapping status to display properties
const STATUS_COLS: { status: BugStatus; label: string; color: string; icon: string; accent: string; glow: string }[] = [
  { status: 'new', label: 'New', color: 'border-border bg-card/50', icon: '🆕', accent: 'border-l-blue-500', glow: 'ring-1 ring-blue-500/50' },
  { status: 'open', label: 'Open', color: 'border-border bg-card/50', icon: '📂', accent: 'border-l-orange-500', glow: 'ring-1 ring-orange-500/50' },
  { status: 'in-progress', label: 'In Progress', color: 'border-border bg-card/50', icon: '🔧', accent: 'border-l-yellow-500', glow: 'ring-1 ring-yellow-500/50' },
  { status: 'resolved', label: 'Resolved', color: 'border-border bg-card/50', icon: '✅', accent: 'border-l-green-500', glow: 'ring-1 ring-green-500/50' },
  { status: 'closed', label: 'Closed', color: 'border-border bg-card/50', icon: '🔒', accent: 'border-l-zinc-500', glow: 'ring-1 ring-zinc-500/50' },
];

// Map severity levels to label background and text colors
const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
};

// Map severity levels to card border colors
const SEVERITY_BORDER: Record<Severity, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

// Toast notification component used for temporary action feedback (e.g., successful move)
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-foreground text-background px-4 py-3 rounded-md shadow-md flex items-center gap-2.5 text-sm font-medium">
        <span className="text-lg">✅</span> {message}
      </div>
    </div>
  );
}

// Context menu component for right-clicking bugs to perform quick status changes
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
    <div ref={ref} className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[200px] animate-scale-in"
      style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 300) }}
      role="menu" aria-label="Change bug status">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Move to</p>
        <p className="text-xs text-foreground font-medium truncate mt-0.5">{bug.title}</p>
      </div>
      {statuses.map(s => (
        <button key={s.status} onClick={() => { onChangeStatus(bug.id, s.status); onClose(); }}
          disabled={bug.status === s.status}
          className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2.5 transition-colors ${bug.status === s.status
            ? 'text-foreground bg-secondary font-medium cursor-default'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
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

// Main Dashboard functional component
export default function Dashboard() {
  // Destructure application context state and mutations
  const { bugs, projects, users, changeBugStatus, currentUser, language, isGuest } = useAppContext();
  const navigate = useNavigate(); // Hook for routing

  // State variables for various filters applied to the bug list
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Controls visibility of advanced filters

  // State for HTML5 Drag-and-drop
  const [dragBugId, setDragBugId] = useState<string | null>(null); // ID of bug being dragged
  const [hoverColumn, setHoverColumn] = useState<BugStatus | null>(null); // Status column currently hovered over
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null); // ID of bug just dropped (for animation)

  // State for the custom context menu (right click)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bug: Bug } | null>(null);

  // State for toast notifications
  const [toast, setToast] = useState<string | null>(null);

  // State to track which Kanban card is expanded to show inline preview
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // State for keyboard-accessible Drag-and-drop
  const [kbDragBugId, setKbDragBugId] = useState<string | null>(null); // ID of bug being 'carried' by keyboard
  const [kbDragColIdx, setKbDragColIdx] = useState<number>(0); // Index of the column the kb ghost is currently in

  // Refs for DOM nodes required for advanced interactions
  const dragImageRef = useRef<HTMLDivElement>(null); // Ref to the ghost image element shown during drag
  const columnRefs = useRef<Map<BugStatus, HTMLDivElement>>(new Map()); // Refs to the column drop zones

  // Memoize the extraction of all unique tags from bugs for the filter dropdown
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bugs.forEach(b => b.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [bugs]);

  // Memoize the filtered bug list to avoid recalculating on every re-render unless dependencies change
  const filtered = useMemo(() => {
    return bugs.filter(b => {
      // Sequential guard clauses to filter out non-matching bugs
      if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterProject && b.projectId !== filterProject) return false;
      if (filterSeverity && b.severity !== filterSeverity) return false;
      if (filterAssignee && b.assigneeId !== filterAssignee) return false;
      if (filterTag && (!b.tags || !b.tags.includes(filterTag))) return false;
      if (filterDateFrom && new Date(b.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(b.createdAt) > new Date(filterDateTo + 'T23:59:59')) return false;
      return true; // Bug passed all active filters
    });
  }, [bugs, search, filterProject, filterSeverity, filterAssignee, filterTag, filterDateFrom, filterDateTo]);

  // Derived statistics computed from the currently filtered bugs
  const stats = useMemo(() => ({
    total: filtered.length,
    new: filtered.filter(b => b.status === 'new').length,
    open: filtered.filter(b => b.status === 'open').length,
    inProgress: filtered.filter(b => b.status === 'in-progress').length,
    resolved: filtered.filter(b => b.status === 'resolved').length,
    closed: filtered.filter(b => b.status === 'closed').length,
    critical: filtered.filter(b => b.severity === 'critical').length,
  }), [filtered]);

  // Determine if the current user has permission to drag/change bug statuses
  const userCanDrag = currentUser ? canDragBug(currentUser.role) : false;

  // --- HTML5 Drag handlers ---

  // Fired when the user starts dragging a bug card
  const handleDragStart = useCallback((e: React.DragEvent, bugId: string) => {
    if (!userCanDrag) return;
    setDragBugId(bugId);
    setExpandedCard(null); // Collapse immediately if expanded
    // Set custom ghost image for nicer visual feedback instead of browser default
    if (dragImageRef.current) {
      const bug = bugs.find(b => b.id === bugId);
      if (bug) {
        dragImageRef.current.textContent = bug.title;
        dragImageRef.current.style.display = 'block';
        e.dataTransfer.setDragImage(dragImageRef.current, 12, 12);
        // Hide DOM element after next frame so it doesn't stay visible
        requestAnimationFrame(() => {
          if (dragImageRef.current) dragImageRef.current.style.display = 'none';
        });
      }
    }
    e.dataTransfer.effectAllowed = 'move';
  }, [userCanDrag, bugs]);

  // Fired continuously while dragging over a column
  const handleDragOver = useCallback((e: React.DragEvent, status: BugStatus) => {
    if (!userCanDrag || !dragBugId) return;
    e.preventDefault(); // Must prevent default to allow dropping
    e.dataTransfer.dropEffect = 'move';
    setHoverColumn(status); // Update state to highlight dropzone
  }, [userCanDrag, dragBugId]);

  // Fired when dragging leaves a column
  const handleDragLeave = useCallback((e: React.DragEvent, status: BugStatus) => {
    // Check bounding rect to ensure we actually exited the column boundary, 
    // not just hovering over a child element inside it
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (hoverColumn === status) setHoverColumn(null);
    }
  }, [hoverColumn]);

  // Fired when the user releases the drag over a valid dropzone
  const handleDrop = useCallback((e: React.DragEvent, status: BugStatus) => {
    e.preventDefault();
    if (dragBugId && userCanDrag) {
      const bug = bugs.find(b => b.id === dragBugId);
      // Only mutate if the column is different from current status
      if (bug && bug.status !== status) {
        changeBugStatus(dragBugId, status); // Dispatch state change
        setJustDroppedId(dragBugId); // Trigger drop animation
        setToast(`Moved "${bug.title}" → ${status.replace('-', ' ')}`); // Show success toast
        setTimeout(() => setJustDroppedId(null), 800); // Clear animation state
      }
    }
    // Reset drag states
    setDragBugId(null);
    setHoverColumn(null);
  }, [dragBugId, userCanDrag, bugs, changeBugStatus]);

  // Fired when drag operation ends (whether dropped successfully or canceled)
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

  // Initiates keyboard-based drag session when pressing Enter on a focused card
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, bug: Bug) => {
    if (!userCanDrag || isGuest) return;

    if (e.key === 'Enter' && !kbDragBugId) {
      // Pick up the card virtually
      e.preventDefault();
      const colIdx = STATUS_COLS.findIndex(c => c.status === bug.status);
      setKbDragBugId(bug.id); // Set active kb dragged id
      setKbDragColIdx(colIdx); // Track starting column index
      setHoverColumn(bug.status); // Highlight starting column visually
    }
  }, [userCanDrag, isGuest, kbDragBugId]);

  // Global keyboard listener to intercept arrow keys when a keyboard drag session is active
  useEffect(() => {
    if (!kbDragBugId) return; // Only bind if actively dragging via kb
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel operation
        setKbDragBugId(null);
        setHoverColumn(null);
        return;
      }
      if (e.key === 'ArrowRight') {
        // Move ghost right by incrementing index
        e.preventDefault();
        const next = Math.min(kbDragColIdx + 1, STATUS_COLS.length - 1);
        setKbDragColIdx(next);
        setHoverColumn(STATUS_COLS[next].status); // Highlight new column
      }
      if (e.key === 'ArrowLeft') {
        // Move ghost left by decrementing index
        e.preventDefault();
        const prev = Math.max(kbDragColIdx - 1, 0);
        setKbDragColIdx(prev);
        setHoverColumn(STATUS_COLS[prev].status); // Highlight new column
      }
      if (e.key === 'Enter') {
        // Drop the item in the currently active column
        e.preventDefault();
        const targetStatus = STATUS_COLS[kbDragColIdx].status;
        const bug = bugs.find(b => b.id === kbDragBugId);
        if (bug && bug.status !== targetStatus) {
          changeBugStatus(kbDragBugId, targetStatus); // Dispatch state change
          setJustDroppedId(kbDragBugId);
          setToast(`Moved "${bug.title}" → ${targetStatus.replace('-', ' ')}`);
          setTimeout(() => setJustDroppedId(null), 800);
        }
        // Reset states
        setKbDragBugId(null);
        setHoverColumn(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler); // Cleanup on unmount/state change
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
          <Link to="/report" className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2">
            <span>🐛</span> {t('reportBug', language)}
          </Link>
          <Link to="/analytics" className="px-4 py-2 bg-secondary border border-border text-foreground hover:bg-secondary/80 text-sm font-medium rounded-md transition-colors flex items-center gap-2">
            <span>📈</span> {t('analytics', language)}
          </Link>
          <Link to="/ai-engine" className="px-4 py-2 bg-secondary border border-border text-foreground hover:bg-secondary/80 text-sm font-medium rounded-md transition-colors flex items-center gap-2">
            <span>🧠</span> {t('aiEngine', language)}
          </Link>
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className="px-4 py-2 bg-secondary border border-border text-foreground hover:bg-secondary/80 text-sm font-medium rounded-md transition-colors flex items-center gap-2">
              <span>⚙️</span> {t('adminPanel', language)}
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: t('totalBugs', language), value: stats.total, icon: '🐛' },
          { label: t('new', language), value: stats.new, icon: '🆕' },
          { label: t('open', language), value: stats.open, icon: '📂' },
          { label: t('inProgress', language), value: stats.inProgress, icon: '🔧' },
          { label: t('resolved', language), value: stats.resolved, icon: '✅' },
          { label: t('closed', language), value: stats.closed, icon: '🔒' },
          { label: t('critical', language), value: stats.critical, icon: '🔴' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-md p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{s.icon}</span>
              <span className="text-lg font-bold text-foreground">{s.value}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-md border border-border p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search', language)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label={t('search', language)} />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label={t('project', language)}>
            <option value="">{t('allProjects', language)}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label={t('severity', language)}>
            <option value="">{t('allSeverities', language)}</option>
            <option value="critical">🔴 {t('critical', language)}</option>
            <option value="high">🟠 {t('high', language)}</option>
            <option value="medium">🟡 {t('medium', language)}</option>
            <option value="low">🟢 {t('low', language)}</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${showFilters || hasActiveFilters ? 'bg-secondary text-foreground' : 'bg-background border border-border text-muted-foreground hover:text-foreground'}`}
            aria-expanded={showFilters} aria-label="Advanced filters">
            🔽 {t('filter', language)} {hasActiveFilters && <span className="w-2 h-2 bg-zinc-400 rounded-full" />}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-destructive hover:text-destructive/80 px-2 py-1" aria-label="Clear all filters">✕ Clear</button>
          )}
          <button onClick={exportToCSV} className="px-3 py-2 bg-background border border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-1" aria-label="Export to CSV">
            📥 Export
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">{t('assignee', language)}</label>
              <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={t('assignee', language)}>
                <option value="">All Assignees</option>
                {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">{t('tags', language)}</label>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={t('tags', language)}>
                <option value="">All Tags</option>
                {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Date From</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Filter from date" />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Date To</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              className={`rounded-md border p-3 min-h-[220px] transition-all duration-300 relative
                ${col.color}
                ${isHovered && !isSameCol ? `shadow-sm ${col.glow} scale-[1.01]` : ''}
                ${isHovered && isSameCol ? 'opacity-60' : ''}
                ${isDragging && !isHovered ? 'opacity-70' : ''}
              `}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={e => handleDragLeave(e, col.status)}
              onDrop={e => handleDrop(e, col.status)}
              role="region"
              aria-label={`${col.label} column - ${colBugs.length} bugs`}
              aria-dropeffect={isDragging ? 'move' : 'none'}>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>{col.icon}</span> {col.label}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${isHovered && !isSameCol ? 'bg-secondary text-secondary-foreground scale-110' : 'bg-background border border-border text-muted-foreground'
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
                      className={`p-3 rounded-md border-l-[3px] transition-all duration-200 group relative
                        ${SEVERITY_BORDER[bug.severity]}
                        ${isBeingDragged
                          ? 'opacity-40 scale-95 bg-background border-border rotate-1'
                          : wasJustDropped
                            ? 'animate-drop-in bg-card border-border shadow-md ring-1 ring-ring'
                            : 'bg-card border-border hover:border-muted-foreground/30 hover:shadow-sm hover:-translate-y-0.5'
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
                        <p className="text-xs text-foreground font-medium line-clamp-2 transition-colors flex-1">
                          {bug.title}
                        </p>
                        {/* Expand button */}
                        <button onClick={e => toggleExpand(e, bug.id)}
                          className="p-0.5 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          aria-label={isExpanded ? 'Collapse' : 'Expand preview'}
                          title="Preview">
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {/* Expanded description preview */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-border animate-expand">
                          <p className="text-[10px] text-muted-foreground line-clamp-4 leading-relaxed">{bug.description}</p>
                          {bug.publicImpact && (
                            <div className="mt-2 p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
                              <p className="text-[9px] text-blue-400 font-medium mb-0.5">🌍 Public Impact:</p>
                              <p className="text-[9px] text-muted-foreground line-clamp-2">{bug.publicImpact}</p>
                            </div>
                          )}
                          {bug.tags && bug.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {bug.tags.map(tag => (
                                <span key={tag} className="text-[8px] bg-secondary text-secondary-foreground border border-border px-1.5 py-0.5 rounded-full">{tag}</span>
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
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                          <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[7px] text-foreground font-bold">
                            {bug.assigneeName.charAt(0)}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{bug.assigneeName}</p>
                        </div>
                      )}

                      {/* Drag handle indicator */}
                      {userCanDrag && !isGuest && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-40 transition text-[8px] text-muted-foreground select-none pointer-events-none">⠿</div>
                      )}
                    </div>
                  );
                })}
                {colBugs.length === 0 && !isHovered && (
                  <div className="text-center py-8">
                    <p className="text-2xl opacity-40 mb-1 grayscale">{col.icon}</p>
                    <p className="text-[10px] text-muted-foreground">No bugs</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Overview */}
      <div className="bg-card rounded-md border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">👥 {t('team', language)}</h3>
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('manageUsers', language)} →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {users.filter(u => u.role !== 'guest').map(user => {
            const assigned = bugs.filter(b => b.assigneeId === user.id && b.status !== 'closed');
            const resolved = bugs.filter(b => b.assigneeId === user.id && (b.status === 'resolved' || b.status === 'closed'));
            return (
              <div key={user.id} className="bg-background rounded-md p-3 border border-border hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg grayscale">{user.avatar}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground leading-tight">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize leading-tight">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">{assigned.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t('open', language)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">{resolved.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t('resolved', language)}</p>
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
          <div className="bg-card rounded-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm grayscale">📋</span>
              <h4 className="text-sm font-semibold text-foreground">{t('myAssignedBugs', language)}</h4>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {bugs.filter(b => b.assigneeId === currentUser.id && b.status !== 'closed').length}
            </p>
          </div>
          <div className="bg-card rounded-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm grayscale">✅</span>
              <h4 className="text-sm font-semibold text-foreground">{t('resolvedBugs', language)}</h4>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {bugs.filter(b => b.assigneeId === currentUser.id && (b.status === 'resolved' || b.status === 'closed')).length}
            </p>
          </div>
          <div className="bg-card rounded-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm grayscale">🐛</span>
              <h4 className="text-sm font-semibold text-foreground">{t('reportedByMe', language)}</h4>
            </div>
            <p className="text-2xl font-bold text-foreground">
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
