import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store';
import { getAIEngine } from '../ai/engine';
import { t } from '../i18n';
import type { Severity, DuplicateResult, SeverityPrediction, Attachment } from '../types';

const SEVERITY_STYLES: Record<Severity, { bg: string; label: string }> = {
  critical: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', label: '🔴 Critical' },
  high: { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: '🟠 High' },
  medium: { bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '🟡 Medium' },
  low: { bg: 'bg-green-500/20 text-green-400 border-green-500/30', label: '🟢 Low' },
};

export default function BugReport() {
  const { addBug, bugs, projects, users, currentUser, addNotification, addAttachment, language } = useAppContext();
  const navigate = useNavigate();
  const ai = getAIEngine();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [tags, setTags] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [prediction, setPrediction] = useState<SeverityPrediction | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // File attachments
  const [pendingFiles, setPendingFiles] = useState<Omit<Attachment, 'id' | 'createdAt'>[]>([]);

  const runAI = useCallback(() => {
    if (title.length < 5 && description.length < 10) return;
    setAiLoading(true);
    setShowAI(true);
    setTimeout(() => {
      const dups = ai.detectDuplicates(title, description, bugs);
      setDuplicates(dups);
      const pred = ai.predictSeverity(title, description + ' ' + steps + ' ' + actual);
      setPrediction(pred);
      setAiLoading(false);
    }, 800);
  }, [title, description, steps, actual, bugs, ai]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.length >= 5 || description.length >= 10) runAI();
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description, runAI]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large (max 5MB): ' + file.name);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Omit<Attachment, 'id' | 'createdAt'> = {
          bugId: '', // will be set after bug creation
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          dataUrl: reader.result as string,
          uploadedBy: currentUser!.id,
        };
        setPendingFiles(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !projectId) return;

    const bug = addBug({
      title, description, stepsToReproduce: steps, expectedBehavior: expected, actualBehavior: actual,
      severity, predictedSeverity: prediction?.severity, severityConfidence: prediction?.confidence,
      status: 'new', projectId, reporterId: currentUser!.id, reporterName: currentUser!.name,
      assigneeId: assigneeId || undefined, assigneeName: assigneeId ? users.find(u => u.id === assigneeId)?.name : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      duplicateOf: duplicates.length > 0 && duplicates[0].score > 0.7 ? duplicates[0].bugId : undefined,
      duplicateScore: duplicates.length > 0 ? duplicates[0].score : undefined,
    });

    // Add attachments to the bug
    pendingFiles.forEach(file => {
      addAttachment(bug.id, { ...file, bugId: bug.id });
    });

    if (assigneeId) {
      addNotification(assigneeId, `New bug assigned: ${title}`, 'assignment', bug.id);
    }

    navigate(`/bug/${bug.id}`);
  };

  const developers = users.filter(u => u.role === 'developer');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🐛</span>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('reportBug', language)}</h1>
          <p className="text-sm text-slate-400">AI will analyze your report in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Bug report form">
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">📝 {t('bugDetails', language)}</h3>
              <div>
                <label htmlFor="bug-title" className="block text-xs font-medium text-slate-400 mb-1">{t('title', language)} *</label>
                <input id="bug-title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Brief description of the bug" aria-required="true"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label htmlFor="bug-desc" className="block text-xs font-medium text-slate-400 mb-1">{t('description', language)} *</label>
                <textarea id="bug-desc" value={description} onChange={e => setDescription(e.target.value)} required rows={4} placeholder="Detailed description of the issue..." aria-required="true"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label htmlFor="bug-steps" className="block text-xs font-medium text-slate-400 mb-1">{t('stepsToReproduce', language)}</label>
                <textarea id="bug-steps" value={steps} onChange={e => setSteps(e.target.value)} rows={3} placeholder={"1. Go to...\n2. Click on...\n3. Observe..."}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bug-expected" className="block text-xs font-medium text-slate-400 mb-1">{t('expectedBehavior', language)}</label>
                  <textarea id="bug-expected" value={expected} onChange={e => setExpected(e.target.value)} rows={2} placeholder="What should happen?"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                </div>
                <div>
                  <label htmlFor="bug-actual" className="block text-xs font-medium text-slate-400 mb-1">{t('actualBehavior', language)}</label>
                  <textarea id="bug-actual" value={actual} onChange={e => setActual(e.target.value)} rows={2} placeholder="What actually happens?"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">⚙️ Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bug-project" className="block text-xs font-medium text-slate-400 mb-1">{t('project', language)} *</label>
                  <select id="bug-project" value={projectId} onChange={e => setProjectId(e.target.value)} required aria-required="true"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="bug-severity" className="block text-xs font-medium text-slate-400 mb-1">
                    {t('severity', language)}
                    {prediction && <span className="ml-1 text-purple-400">(AI: {prediction.severity})</span>}
                  </label>
                  <select id="bug-severity" value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bug-assign" className="block text-xs font-medium text-slate-400 mb-1">{t('assignee', language)}</label>
                  <select id="bug-assign" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Unassigned</option>
                    {developers.map(d => <option key={d.id} value={d.id}>{d.avatar} {d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="bug-tags" className="block text-xs font-medium text-slate-400 mb-1">{t('tags', language)} (comma-separated)</label>
                  <input id="bug-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="ui, login, crash"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              {prediction && (
                <button type="button" onClick={() => setSeverity(prediction.severity)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  🧠 Apply AI suggestion: {SEVERITY_STYLES[prediction.severity].label} ({(prediction.confidence * 100).toFixed(0)}% confidence)
                </button>
              )}
            </div>

            {/* File Attachments */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">📎 {t('attachments', language)}</h3>
              <div
                className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-purple-500/30 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-purple-500/50', 'bg-purple-500/5'); }}
                onDragLeave={e => { e.currentTarget.classList.remove('border-purple-500/50', 'bg-purple-500/5'); }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-purple-500/50', 'bg-purple-500/5');
                  const dt = e.dataTransfer;
                  if (dt.files.length > 0 && fileInputRef.current) {
                    const dataTransfer = new DataTransfer();
                    Array.from(dt.files).forEach(f => dataTransfer.items.add(f));
                    fileInputRef.current.files = dataTransfer.files;
                    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
                role="button" aria-label="Upload attachments" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click(); }}>
                <span className="text-2xl">📁</span>
                <p className="text-xs text-slate-400 mt-2">Drop files here or click to upload</p>
                <p className="text-[10px] text-slate-600 mt-1">Max 5MB per file. Images, PDFs, text files.</p>
                <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf,.txt,.log,.md"
                  onChange={handleFileUpload} />
              </div>
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-lg">
                        {file.fileType.startsWith('image/') ? '🖼️' : file.fileType === 'application/pdf' ? '📄' : '📝'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{file.fileName}</p>
                        <p className="text-[10px] text-slate-500">{(file.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                      {file.fileType.startsWith('image/') && (
                        <img src={file.dataUrl} alt={file.fileName} className="w-10 h-10 rounded object-cover" />
                      )}
                      <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 text-sm" aria-label={`Remove ${file.fileName}`}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition">
                🐛 {t('submit', language)} Bug Report
              </button>
              <button type="button" onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl transition">
                {t('cancel', language)}
              </button>
            </div>
          </form>
        </div>

        {/* AI Panel */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧠</span>
              <h3 className="text-sm font-semibold text-white">{t('aiAnalysis', language)}</h3>
              {aiLoading && <span className="ml-auto w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            {!showAI ? (
              <p className="text-xs text-slate-500">Start typing to activate AI analysis...</p>
            ) : aiLoading ? (
              <div className="space-y-3">
                <div className="h-3 bg-white/5 rounded animate-pulse" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
                <p className="text-xs text-purple-400 animate-pulse">Processing with NLP engine...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prediction && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">{t('severityPrediction', language)} (Neural Network)</p>
                    <div className="space-y-1.5">
                      {(['critical', 'high', 'medium', 'low'] as Severity[]).map(s => (
                        <div key={s} className="flex items-center gap-2">
                          <span className="text-[10px] w-14 text-slate-500 capitalize">{s}</span>
                          <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${s === prediction.severity ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-slate-700'
                              }`} style={{ width: `${prediction.scores[s] * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-10 text-right">{(prediction.scores[s] * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${SEVERITY_STYLES[prediction.severity].bg}`}>
                        {SEVERITY_STYLES[prediction.severity].label}
                      </span>
                      <span className="text-[10px] text-slate-500">{(prediction.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    {prediction.features.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-slate-500 mb-1">Key features detected:</p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.features.map((f, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">{t('duplicateDetection', language)} (TF-IDF + Cosine Similarity)</p>
                  {duplicates.length === 0 ? (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span>✅</span>
                      <span className="text-xs text-green-400">No duplicates detected</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {duplicates.map(d => (
                        <div key={d.bugId} className={`p-2 rounded-lg border ${d.score > 0.7 ? 'bg-red-500/10 border-red-500/20' : d.score > 0.4 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-white line-clamp-1">{d.bugTitle}</p>
                            <span className={`text-[10px] font-mono font-bold ${d.score > 0.7 ? 'text-red-400' : d.score > 0.4 ? 'text-yellow-400' : 'text-blue-400'}`}>
                              {(d.score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{d.method}</p>
                        </div>
                      ))}
                      {duplicates[0].score > 0.7 && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1">⚠️ High similarity detected - possible duplicate</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-xl border border-white/5 p-4">
            <h4 className="text-xs font-semibold text-white mb-2">🔬 How it works</h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-start gap-2"><span className="text-purple-400">▸</span> TF-IDF vectorization converts text to numerical vectors</li>
              <li className="flex items-start gap-2"><span className="text-purple-400">▸</span> Cosine similarity measures vector angles for duplicate detection</li>
              <li className="flex items-start gap-2"><span className="text-purple-400">▸</span> Word embeddings capture semantic meaning of bug descriptions</li>
              <li className="flex items-start gap-2"><span className="text-purple-400">▸</span> Softmax neural network classifies severity with confidence scores</li>
              <li className="flex items-start gap-2"><span className="text-purple-400">▸</span> ReLU activation in hidden layers enables non-linear classification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
