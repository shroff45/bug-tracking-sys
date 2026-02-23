import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store';
import { getValidTransitions } from '../types';
import { t } from '../i18n';
import type { BugStatus, Severity } from '../types';

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const STATUS_STYLES: Record<BugStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  open: 'bg-orange-500/20 text-orange-400',
  'in-progress': 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

export default function BugDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBugById, changeBugStatus, addComment, assignBug, currentUser, users, projects, isGuest, language } = useAppContext();
  const bug = getBugById(id!);
  const [comment, setComment] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState<string | null>(null);

  if (!bug) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl mb-4 block">🔍</span>
        <h2 className="text-xl font-bold text-white mb-2">Bug Not Found</h2>
        <p className="text-slate-400 mb-4">The bug you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const project = projects.find(p => p.id === bug.projectId);
  const reporter = users.find(u => u.id === bug.reporterId);
  const assignee = bug.assigneeId ? users.find(u => u.id === bug.assigneeId) : null;
  const validTransitions = currentUser ? getValidTransitions(bug.status, currentUser.role) : [];

  const handleStatusChange = (newStatus: BugStatus) => {
    changeBugStatus(bug.id, newStatus);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment(bug.id, comment);
    setComment('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-slate-500 hover:text-purple-400 mb-2 flex items-center gap-1 transition" aria-label="Back to dashboard">
            ← {t('dashboard', language)}
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">{bug.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${SEVERITY_STYLES[bug.severity]}`}>
              {bug.severity}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_STYLES[bug.status]}`}>
              {bug.status}
            </span>
            {bug.aiAnalyzed && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                🧠 AI Analyzed
              </span>
            )}
            {bug.predictedSeverity && (
              <span className="text-[10px] text-slate-500">
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
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">{t('description', language)}</h3>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.description}</p>
          </div>

          {/* Steps, Expected, Actual */}
          {(bug.stepsToReproduce || bug.expectedBehavior || bug.actualBehavior) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              {bug.stepsToReproduce && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">{t('stepsToReproduce', language)}</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
                </div>
              )}
              {bug.expectedBehavior && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">{t('expectedBehavior', language)}</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.expectedBehavior}</p>
                </div>
              )}
              {bug.actualBehavior && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">{t('actualBehavior', language)}</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.actualBehavior}</p>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {bug.attachments.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">📎 {t('attachments', language)} ({bug.attachments.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bug.attachments.map(att => (
                  <div key={att.id} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden group">
                    {att.fileType.startsWith('image/') ? (
                      <button onClick={() => setShowAttachmentModal(att.id)} className="w-full" aria-label={`View ${att.fileName}`}>
                        <img src={att.dataUrl} alt={att.fileName} className="w-full h-24 object-cover group-hover:opacity-80 transition" />
                      </button>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-3xl bg-white/5">
                        {att.fileType === 'application/pdf' ? '📄' : '📝'}
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-[10px] text-white truncate">{att.fileName}</p>
                      <p className="text-[9px] text-slate-500">{(att.fileSize / 1024).toFixed(1)} KB</p>
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
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">📋 Status History</h3>
              <div className="space-y-3">
                {bug.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                    <div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_STYLES[h.from]}`}>{h.from}</span>
                      <span className="mx-1 text-slate-500">→</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_STYLES[h.to]}`}>{h.to}</span>
                      <span className="text-slate-500 ml-2">by {h.userName}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 ml-auto">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">💬 {t('comments', language)} ({bug.comments.length})</h3>
            {bug.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {bug.comments.map(c => (
                  <div key={c.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{c.userName}</span>
                      <span className="text-[10px] text-slate-600">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
            {!isGuest && (
              <form onSubmit={handleComment} className="flex gap-2" aria-label="Add comment">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Comment text" />
                <button type="submit" disabled={!comment.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 text-white text-sm rounded-lg transition">
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
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white">Details</h3>
            {[
              { label: t('project', language), value: project?.name || 'Unknown' },
              { label: 'Reporter', value: `${reporter?.avatar || ''} ${reporter?.name || 'Unknown'}` },
              { label: t('assignee', language), value: assignee ? `${assignee.avatar} ${assignee.name}` : 'Unassigned' },
              { label: 'Created', value: new Date(bug.createdAt).toLocaleDateString() },
              { label: 'Updated', value: new Date(bug.updatedAt).toLocaleDateString() },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{item.label}</span>
                <span className="text-[11px] text-white">{item.value}</span>
              </div>
            ))}
            {bug.tags && bug.tags.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">{t('tags', language)}</span>
                <div className="flex flex-wrap gap-1">
                  {bug.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {bug.duplicateOf && (
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-[10px] text-red-400">⚠️ Possible duplicate ({((bug.duplicateScore || 0) * 100).toFixed(0)}% match)</p>
              </div>
            )}
          </div>

          {/* Status Actions */}
          {!isGuest && validTransitions.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white mb-3">{t('status', language)} Actions</h3>
              <div className="space-y-2">
                {validTransitions.map(status => (
                  <button key={status} onClick={() => handleStatusChange(status)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium border transition hover:opacity-80 ${STATUS_STYLES[status]} border-white/10`}
                    aria-label={`Change status to ${status}`}>
                    Move to {status}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2">
                Your role ({currentUser?.role}) allows: {validTransitions.join(', ')}
              </p>
            </div>
          )}

          {/* Assign Actions */}
          {!isGuest && currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer') && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white mb-3">{t('assignee', language)}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <span className="text-xs text-slate-300">
                      {bug.assigneeName || t('unassigned', language)}
                    </span>
                  </div>
                  <button onClick={() => {
                    const developers = users.filter(u => u.role === 'developer' || u.role === 'admin');
                    if (developers.length > 0) {
                      assignBug(bug.id, developers[0].id);
                    }
                  }} className="text-xs text-purple-400 hover:text-purple-300" aria-label="Assign to developer">
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
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/20 p-4">
              <p className="text-xs text-yellow-400">👁️ Guest users cannot modify bugs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
