/**
 * src/pages/BugReport.tsx
 * 
 * CORE VIEW: The Issue Registration Form
 * 
 * Features:
 * 1. Collects standard bug details (Title, Description, Steps, Expected/Actual).
 * 2. LIVE AI PREVIEW: As the user types the title and description, a debounced 
 *    effect triggers the frontend AI Engine (`src/ai/engine.ts`) to immediately predict
 *    severity and flag potential duplicates *before* submission.
 * 3. File Attachments: Allows dragging and dropping files which are converted to Base64
 *    and appended to the submission payload.
 * 4. Integration: Calls `addBug` and `addAttachment` from `src/store.tsx` which posts 
 *    to the backend database.
 * 
 * Why this code/type is used:
 * - useState: Manages granular form state (title, desc, attachments, AI results) and UI flags.
 * - useEffect / useCallback: Handles the debounced AI analysis to avoid spamming calculations on every keystroke.
 * - useRef: Used to trigger the hidden file input element when dropping files or clicking the dropzone.
 * - useAppContext: Accesses global app context needed for submitting the bug.
 */
import { useState, useEffect, useCallback, useRef } from 'react'; // Core React hooks
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation
import { useAppContext } from '../store'; // Hook to access global store and actions
import { getAIEngine } from '../ai/engine'; // Helper to fetch frontend ML instance
import { t } from '../i18n'; // Translation fn
import type { Severity, DuplicateResult, SeverityPrediction, Attachment } from '../types'; // Type definitions

// Mapping of severities to visual UI styles
const SEVERITY_STYLES: Record<Severity, { bg: string; label: string }> = {
  critical: { bg: 'bg-destructive/10 text-destructive border-destructive/20', label: '🔴 Critical' },
  high: { bg: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: '🟠 High' },
  medium: { bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: '🟡 Medium' },
  low: { bg: 'bg-green-500/10 text-green-500 border-green-500/20', label: '🟢 Low' },
};

// Main functional component for rendering the Bug Report form
export default function BugReport() {
  // Destructure application context variables and functions
  const { addBug, bugs, projects, users, currentUser, addNotification, addAttachment, language } = useAppContext();
  const navigate = useNavigate(); // Hook for routing
  const ai = getAIEngine(); // Get reference to AI engine instance
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to hidden file input for attachments

  // Local state for bug details form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [tags, setTags] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // Local state for AI real-time analysis
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]); // Tracks detected duplicate bugs
  const [prediction, setPrediction] = useState<SeverityPrediction | null>(null); // Tracks AI severity prediction
  const [aiLoading, setAiLoading] = useState(false); // Indicates if AI is currently analyzing
  const [showAI, setShowAI] = useState(false); // Flag to control rendering of AI panel

  // File attachments state tracking pending uploads
  const [pendingFiles, setPendingFiles] = useState<Omit<Attachment, 'id' | 'createdAt'>[]>([]);

  // Memoized function to run AI prediction
  const runAI = useCallback(() => {
    // Only run if title/desc are sufficiently long to be analyzed
    if (title.length < 5 && description.length < 10) return;
    setAiLoading(true); // Set loading state on
    setShowAI(true); // Expand AI panel

    // Use setTimeout to allow UI to update loading state before heavy lifting blocks main thread
    setTimeout(() => {
      // Execute synchronous AI logic from ai handler
      const dups = ai.detectDuplicates(title, description, bugs);
      setDuplicates(dups);
      const pred = ai.predictSeverity(title, description + ' ' + steps + ' ' + actual);
      setPrediction(pred);
      setAiLoading(false); // Disable loading when done
    }, 800); // Artificial delay to simulate processing and prevent flicker
  }, [title, description, steps, actual, bugs, ai]); // Recreate callback if inputs or bugs change

  // Effect to debounce the runAI function
  // We don't want to run the AI engine on EVERY keystroke, but after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => { // Schedule function execution
      if (title.length >= 5 || description.length >= 10) runAI(); // Run AI threshold condition
    }, 1000); // Wait 1 second of inactivity before triggering
    return () => clearTimeout(timer); // Clear the timeout if inputs change before 1s (debounce)
  }, [title, description, runAI]);

  // Handle file uploads (from file input or drop interaction)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Iterate over FileList and process each file
    Array.from(files).forEach(file => {
      // Validate file size limit
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large (max 5MB): ' + file.name);
        return;
      }
      // Read file asynchronously as base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        // Upon complete, construct attachment object
        const attachment: Omit<Attachment, 'id' | 'createdAt'> = {
          bugId: '', // will be set asynchronously after bug creation
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          dataUrl: reader.result as string, // Base64 encoding result
          uploadedBy: currentUser!.id,
        };
        // Add new attachment to tracking state
        setPendingFiles(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file); // Trigger async reading
    });
    e.target.value = ''; // Reset input to allow re-uploading the same file if needed
  };

  // Function to remove a pending attachment from the list
  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Sets a default project ID gracefully if none is currently selected and list has loaded
  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  // Main form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // End default event propagation (page refresh)
    // Perform basic client-side validation
    if (!title || !description) {
      alert("Title and description are required.");
      return;
    }
    if (!projectId) {
      alert("Please select a project.");
      return;
    }

    // Call store async mutation to push new bug data
    const bug = await addBug({
      title, description, stepsToReproduce: steps, expectedBehavior: expected, actualBehavior: actual,
      severity, predictedSeverity: prediction?.severity, severityConfidence: prediction?.confidence,
      status: 'new', projectId, reporterId: currentUser!.id, reporterName: currentUser!.name,
      assigneeId: assigneeId || undefined, assigneeName: assigneeId ? users.find(u => u.id === assigneeId)?.name : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean), // Normalize comma-separated tags
      duplicateOf: duplicates.length > 0 && duplicates[0].score > 0.7 ? duplicates[0].bugId : undefined, // Autoflag high prob duplicates
      duplicateScore: duplicates.length > 0 ? duplicates[0].score : undefined,
    });

    // Handle attachments mapping if bug was successfully created
    if (bug) {
      for (const file of pendingFiles) {
        await addAttachment(bug.id, { ...file, bugId: bug.id }); // Propagate IDs properly
      }

      // If assigned specifically, notify the assigned developer immediately
      if (assigneeId) {
        addNotification(assigneeId, `New bug assigned: ${title}`, 'assignment', bug.id);
      }

      navigate(`/bug/${bug.id}`); // Navigate directly to the detailed view of the new bug
    } else {
      alert("Failed to create bug. Please check your inputs or server connection.");
    }
  };

  // Filter useful user array containing valid developer candidates
  const developers = users.filter(u => u.role === 'developer');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🐛</span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('reportBug', language)}</h1>
          <p className="text-sm text-muted-foreground">AI will analyze your report in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Bug report form">
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">📝 {t('bugDetails', language)}</h3>
              <div>
                <label htmlFor="bug-title" className="block text-xs font-medium text-muted-foreground mb-1">{t('title', language)} *</label>
                <input id="bug-title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Brief description of the bug" aria-required="true"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="bug-desc" className="block text-xs font-medium text-muted-foreground mb-1">{t('description', language)} *</label>
                <textarea id="bug-desc" value={description} onChange={e => setDescription(e.target.value)} required rows={4} placeholder="Detailed description of the issue..." aria-required="true"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
              </div>
              <div>
                <label htmlFor="bug-steps" className="block text-xs font-medium text-muted-foreground mb-1">{t('stepsToReproduce', language)}</label>
                <textarea id="bug-steps" value={steps} onChange={e => setSteps(e.target.value)} rows={3} placeholder={"1. Go to...\n2. Click on...\n3. Observe..."}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bug-expected" className="block text-xs font-medium text-muted-foreground mb-1">{t('expectedBehavior', language)}</label>
                  <textarea id="bug-expected" value={expected} onChange={e => setExpected(e.target.value)} rows={2} placeholder="What should happen?"
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                </div>
                <div>
                  <label htmlFor="bug-actual" className="block text-xs font-medium text-muted-foreground mb-1">{t('actualBehavior', language)}</label>
                  <textarea id="bug-actual" value={actual} onChange={e => setActual(e.target.value)} rows={2} placeholder="What actually happens?"
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">⚙️ Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bug-project" className="block text-xs font-medium text-muted-foreground mb-1">{t('project', language)} *</label>
                  <select id="bug-project" value={projectId} onChange={e => setProjectId(e.target.value)} required aria-required="true"
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="bug-severity" className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('severity', language)}
                    {prediction && <span className="ml-1 text-primary">(AI: {prediction.severity})</span>}
                  </label>
                  <select id="bug-severity" value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bug-assign" className="block text-xs font-medium text-muted-foreground mb-1">{t('assignee', language)}</label>
                  <select id="bug-assign" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Unassigned</option>
                    {developers.map(d => <option key={d.id} value={d.id}>{d.avatar} {d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="bug-tags" className="block text-xs font-medium text-muted-foreground mb-1">{t('tags', language)} (comma-separated)</label>
                  <input id="bug-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="ui, login, crash"
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
              {prediction && (
                <button type="button" onClick={() => setSeverity(prediction.severity)}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                  🧠 Apply AI suggestion: {SEVERITY_STYLES[prediction.severity].label} ({(prediction.confidence * 100).toFixed(0)}% confidence)
                </button>
              )}
            </div>

            {/* File Attachments */}
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">📎 {t('attachments', language)}</h3>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary/50', 'bg-primary/5'); }}
                onDragLeave={e => { e.currentTarget.classList.remove('border-primary/50', 'bg-primary/5'); }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-primary/50', 'bg-primary/5');
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
                <p className="text-xs text-muted-foreground mt-2">Drop files here or click to upload</p>
                <p className="text-[10px] text-muted-foreground mt-1">Max 5MB per file. Images, PDFs, text files.</p>
                <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf,.txt,.log,.md"
                  onChange={handleFileUpload} />
              </div>
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md border border-border">
                      <span className="text-lg">
                        {file.fileType.startsWith('image/') ? '🖼️' : file.fileType === 'application/pdf' ? '📄' : '📝'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{file.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                      {file.fileType.startsWith('image/') && (
                        <img src={file.dataUrl} alt={file.fileName} className="w-10 h-10 rounded object-cover" />
                      )}
                      <button type="button" onClick={() => removeFile(i)} className="text-destructive hover:text-destructive/80 text-sm transition-colors" aria-label={`Remove ${file.fileName}`}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleSubmit} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors shadow-sm">
                🐛 {t('submit', language)} Bug Report
              </button>
              <button type="button" onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-background border border-border text-foreground hover:bg-secondary rounded-md text-sm font-medium transition-colors">
                {t('cancel', language)}
              </button>
            </div>
          </form>
        </div>

        {/* AI Panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧠</span>
              <h3 className="text-sm font-semibold text-foreground">{t('aiAnalysis', language)}</h3>
              {aiLoading && <span className="ml-auto w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            </div>

            {!showAI ? (
              <p className="text-xs text-muted-foreground">Start typing to activate AI analysis...</p>
            ) : aiLoading ? (
              <div className="space-y-3">
                <div className="h-3 bg-secondary rounded animate-pulse" />
                <div className="h-3 bg-secondary rounded animate-pulse w-3/4" />
                <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                <p className="text-xs text-primary animate-pulse">Processing with NLP engine...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prediction && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('severityPrediction', language)} (Neural Network)</p>
                    <div className="space-y-1.5">
                      {(['critical', 'high', 'medium', 'low'] as Severity[]).map(s => (
                        <div key={s} className="flex items-center gap-2">
                          <span className="text-[10px] w-14 text-muted-foreground capitalize">{s}</span>
                          <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${s === prediction.severity ? 'bg-primary' : 'bg-muted-foreground/30'
                              }`} style={{ width: `${prediction.scores[s] * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-10 text-right">{(prediction.scores[s] * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${SEVERITY_STYLES[prediction.severity].bg}`}>
                        {SEVERITY_STYLES[prediction.severity].label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{(prediction.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    {prediction.features.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-muted-foreground mb-1">Key features detected:</p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.features.map((f, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-secondary text-foreground text-[10px] rounded border border-border">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t('duplicateDetection', language)} (TF-IDF + Cosine Similarity)</p>
                  {duplicates.length === 0 ? (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md border border-green-500/20">
                      <span>✅</span>
                      <span className="text-xs text-green-500">No duplicates detected</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {duplicates.map(d => (
                        <div key={d.bugId} className={`p-2 rounded-md border ${d.score > 0.7 ? 'bg-destructive/10 border-destructive/20' : d.score > 0.4 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-foreground line-clamp-1">{d.bugTitle}</p>
                            <span className={`text-[10px] font-mono font-bold ${d.score > 0.7 ? 'text-destructive' : d.score > 0.4 ? 'text-yellow-500' : 'text-blue-500'}`}>
                              {(d.score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{d.method}</p>
                        </div>
                      ))}
                      {duplicates[0].score > 0.7 && (
                        <p className="text-[10px] text-destructive flex items-center gap-1">⚠️ High similarity detected - possible duplicate</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-foreground mb-2">🔬 How it works</h4>
            <ul className="space-y-2 text-[11px] text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-primary">▸</span> TF-IDF vectorization converts text to numerical vectors</li>
              <li className="flex items-start gap-2"><span className="text-primary">▸</span> Cosine similarity measures vector angles for duplicate detection</li>
              <li className="flex items-start gap-2"><span className="text-primary">▸</span> Word embeddings capture semantic meaning of bug descriptions</li>
              <li className="flex items-start gap-2"><span className="text-primary">▸</span> Softmax neural network classifies severity with confidence scores</li>
              <li className="flex items-start gap-2"><span className="text-primary">▸</span> ReLU activation in hidden layers enables non-linear classification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
