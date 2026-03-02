/**
 * src/pages/BugDetails.tsx
 * 
 * CORE VIEW: The Bug Detailed View
 * 
 * Features:
 * 1. Displays comprehensive information about a single bug.
 * 2. Allows users to change bug status, assign developers, and add comments.
 * 3. Shows bug attachment previews.
 * 4. Displays AI analysis predictions and duplicate detection scores.
 * 
 * Why this code/type is used:
 * - useParams: Extracts the bug ID from the URL path.
 * - useNavigate: Provides programmatic navigation (e.g., back to dashboard).
 * - useAppContext: Provides access to global bugs, users, projects, and mutating actions (change status, add comment, etc).
 * - Component renders dynamically based on the current user's role (admin/developer vs guest).
 */
import { useState } from 'react'; // Hook for managing local state (comments, modals)
import { useParams, useNavigate } from 'react-router-dom'; // Hooks for routing
import { useAppContext } from '../store'; // Hook for global app state
import { getValidTransitions } from '../types'; // Utility to enforce workflow rules
import { t } from '../i18n'; // Translation utility
import type { BugStatus, Severity } from '../types'; // Type definitions

// Component mapping severity levels to specific Tailwind CSS color classes
const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

// Component mapping bug statuses to specific Tailwind CSS color classes
const STATUS_STYLES: Record<BugStatus, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  open: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'in-progress': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

// Main functional component for rendering bug details
export default function BugDetails() {
  const { id } = useParams(); // Extract route parameter 'id'
  const navigate = useNavigate(); // Navigation function
  // Destructure application context
  const { getBugById, changeBugStatus, addComment, assignBug, currentUser, users, projects, isGuest, language } = useAppContext();
  const bug = getBugById(id!); // Find the bug by ID (non-null assertion, handles undefined gracefully later)

  const [comment, setComment] = useState(''); // Local state for the new comment input
  const [showAttachmentModal, setShowAttachmentModal] = useState<string | null>(null); // State tracking the currently open attachment modal

  // Render 404 state if bug ID is invalid
  if (!bug) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl mb-4 block">🔍</span>
        <h2 className="text-xl font-bold text-foreground mb-2">Bug Not Found</h2>
        <p className="text-muted-foreground mb-4">The bug you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-md shadow-sm transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Find related entities to display names/details instead of just IDs
  const project = projects.find(p => p.id === bug.projectId); // Find associated project
  const reporter = users.find(u => u.id === bug.reporterId); // Find reporter user
  const assignee = bug.assigneeId ? users.find(u => u.id === bug.assigneeId) : null; // Find assigned user
  // Determine allowed status transitions based on user role and current bug state
  const validTransitions = currentUser ? getValidTransitions(bug.status, currentUser.role) : [];

  // Handler for updating the bug status
  const handleStatusChange = (newStatus: BugStatus) => {
    changeBugStatus(bug.id, newStatus); // Dispatches status change action
  };

  // Handler for adding a new comment
  const handleComment = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent standard form submission
    if (!comment.trim()) return; // Don't submit empty comments
    addComment(bug.id, comment); // Dispatch action
    setComment(''); // Clear input after submission
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 transition-colors" aria-label="Back to dashboard">
            ← {t('dashboard', language)}
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-2">{bug.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${SEVERITY_STYLES[bug.severity]}`}>
              {bug.severity}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${STATUS_STYLES[bug.status]}`}>
              {bug.status}
            </span>
            {bug.aiAnalyzed && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                🧠 AI Analyzed
              </span>
            )}
            {bug.predictedSeverity && (
              <span className="text-[10px] text-muted-foreground">
                AI predicted: {bug.predictedSeverity} ({((bug.severityConfidence || 0) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="bg-card rounded-md border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('description', language)}</h3>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{bug.description}</p>
          </div>

          {/* Public Impact (AI Analyzed) */}
          {bug.publicImpact && (
            <div className="bg-blue-500/10 rounded-md border border-blue-500/20 p-5 mt-4">
              <h3 className="text-sm font-semibold text-blue-500 mb-2 flex items-center gap-2">
                <span>🌍</span> Public/Market Impact
              </h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{bug.publicImpact}</p>
            </div>
          )}

          {/* Steps, Expected, Actual */}
          {(bug.stepsToReproduce || bug.expectedBehavior || bug.actualBehavior) && (
            <div className="bg-card rounded-md border border-border p-5 space-y-4">
              {bug.stepsToReproduce && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">{t('stepsToReproduce', language)}</h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
                </div>
              )}
              {bug.expectedBehavior && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">{t('expectedBehavior', language)}</h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{bug.expectedBehavior}</p>
                </div>
              )}
              {bug.actualBehavior && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">{t('actualBehavior', language)}</h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{bug.actualBehavior}</p>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {bug.attachments.length > 0 && (
            <div className="bg-card rounded-md border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">📎 {t('attachments', language)} ({bug.attachments.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bug.attachments.map(att => (
                  <div key={att.id} className="bg-background rounded-md border border-border overflow-hidden group">
                    {att.fileType.startsWith('image/') ? (
                      <button onClick={() => setShowAttachmentModal(att.id)} className="w-full" aria-label={`View ${att.fileName}`}>
                        <img src={att.dataUrl} alt={att.fileName} className="w-full h-24 object-cover group-hover:opacity-80 transition" />
                      </button>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-3xl bg-secondary/50">
                        {att.fileType === 'application/pdf' ? '📄' : '📝'}
                      </div>
                    )}
                    <div className="p-2 border-t border-border">
                      <p className="text-[10px] text-foreground truncate">{att.fileName}</p>
                      <p className="text-[9px] text-muted-foreground">{(att.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachment modal */}
          {showAttachmentModal && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAttachmentModal(null)} role="dialog" aria-label="Attachment preview">
              <div className="max-w-3xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <img src={bug.attachments.find(a => a.id === showAttachmentModal)?.dataUrl} alt="Attachment preview" className="max-w-full max-h-[80vh] rounded-xl" />
                <button onClick={() => setShowAttachmentModal(null)} className="absolute top-4 right-4 text-white text-2xl hover:text-red-400" aria-label="Close preview">✕</button>
              </div>
            </div>
          )}

          {/* Status History */}
          {bug.statusHistory.length > 0 && (
            <div className="bg-card rounded-md border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">📋 Status History</h3>
              <div className="space-y-3">
                {bug.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full flex-shrink-0" />
                    <div>
                      <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] ${STATUS_STYLES[h.from]}`}>{h.from}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] ${STATUS_STYLES[h.to]}`}>{h.to}</span>
                      <span className="text-muted-foreground ml-2">by {h.userName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-card rounded-md border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">💬 {t('comments', language)} ({bug.comments.length})</h3>
            {bug.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {bug.comments.map(c => (
                  <div key={c.id} className="bg-background rounded-md p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{c.userName}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-foreground/90">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
            {!isGuest && (
              <form onSubmit={handleComment} className="flex gap-2" aria-label="Add comment">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Comment text" />
                <button type="submit" disabled={!comment.trim()}
                  className="px-4 py-2 bg-foreground hover:bg-foreground/90 disabled:opacity-30 disabled:hover:bg-foreground text-background font-medium text-sm rounded-md transition-colors shadow-sm">
                  Send
                </button>
              </form>
            )}
            {isGuest && (
              <p className="text-xs text-slate-500 text-center py-2">👁️ Guest users cannot add comments</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Metadata */}
          <div className="bg-card rounded-md border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground">Details</h3>
            {[
              { label: t('project', language), value: project?.name || 'Unknown' },
              { label: 'Reporter', value: `${reporter?.avatar || ''} ${reporter?.name || 'Unknown'}` },
              { label: t('assignee', language), value: assignee ? `${assignee.avatar} ${assignee.name}` : 'Unassigned' },
              { label: 'Created', value: new Date(bug.createdAt).toLocaleDateString() },
              { label: 'Updated', value: new Date(bug.updatedAt).toLocaleDateString() },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[11px] text-foreground font-medium">{item.value}</span>
              </div>
            ))}
            {bug.tags && bug.tags.length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground block mb-1.5">{t('tags', language)}</span>
                <div className="flex flex-wrap gap-1">
                  {bug.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded-sm border border-border">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {bug.duplicateOf && (
              <div className="p-2 bg-destructive/10 rounded-md border border-destructive/20 mt-2">
                <p className="text-[10px] text-destructive">⚠️ Possible duplicate ({((bug.duplicateScore || 0) * 100).toFixed(0)}% match)</p>
              </div>
            )}
          </div>

          {/* Status Actions */}
          {!isGuest && validTransitions.length > 0 && (
            <div className="bg-card rounded-md border border-border p-4">
              <h3 className="text-xs font-semibold text-foreground mb-3">{t('status', language)} Actions</h3>
              <div className="space-y-2">
                {validTransitions.map(status => (
                  <button key={status} onClick={() => handleStatusChange(status)}
                    className={`w-full px-3 py-2 rounded-md text-xs font-medium border transition-colors hover:opacity-80 ${STATUS_STYLES[status]}`}
                    aria-label={`Change status to ${status}`}>
                    Move to {status}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Your role ({currentUser?.role}) allows: {validTransitions.join(', ')}
              </p>
            </div>
          )}

          {/* Assign Actions */}
          {!isGuest && currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer') && (
            <div className="bg-card rounded-md border border-border p-4">
              <h3 className="text-xs font-semibold text-foreground mb-3">{t('assignee', language)}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background border border-border rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <span className="text-xs text-foreground">
                      {bug.assigneeName || t('unassigned', language)}
                    </span>
                  </div>
                  <button onClick={() => {
                    const developers = users.filter(u => u.role === 'developer' || u.role === 'admin');
                    if (developers.length > 0) {
                      assignBug(bug.id, developers[0].id);
                    }
                  }} className="text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Assign to developer">
                    ↻
                  </button>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      assignBug(bug.id, e.target.value);
                    }
                  }}
                  value={bug.assigneeId || ''}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Select assignee"
                >
                  <option value="">{t('unassigned', language)}</option>
                  {users.filter(u => u.role === 'developer' || u.role === 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {isGuest && (
            <div className="bg-yellow-500/10 rounded-md border border-yellow-500/20 p-4">
              <p className="text-xs text-yellow-500">👁️ Guest users cannot modify bugs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
