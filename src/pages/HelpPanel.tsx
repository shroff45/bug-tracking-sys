import { useState } from 'react';
import { useAppContext } from '../store';

export default function HelpPanel({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'guide' | 'shortcuts' | 'faq'>('guide');

    const { currentUser } = useAppContext();

    const tabs = [
        { key: 'guide' as const, label: '📖 Quick Start', },
        { key: 'shortcuts' as const, label: '⌨️ Shortcuts', },
        { key: 'faq' as const, label: '❓ FAQ', },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in"
                onClick={e => e.stopPropagation()} role="dialog" aria-label="Help Panel" aria-modal="true">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <h2 className="text-lg font-bold text-white">Help & Documentation</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition" aria-label="Close help panel">
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex-1 px-4 py-3 text-xs font-medium transition ${activeTab === t.key ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                            aria-selected={activeTab === t.key} role="tab">
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 space-y-4" role="tabpanel">
                    {activeTab === 'guide' && (
                        <>
                            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-4">
                                <h3 className="text-sm font-semibold text-white mb-1">Welcome, {currentUser?.name || 'User'}! 👋</h3>
                                <p className="text-xs text-slate-400">Here's how to get started with BugTracker AI.</p>
                            </div>

                            {[
                                { icon: '🐛', title: 'Reporting a Bug', steps: ['Navigate to "Report Bug" from the sidebar', 'Fill in the title and description', 'AI will automatically detect duplicates and predict severity', 'Attach screenshots if needed', 'Click "Submit Bug Report"'] },
                                { icon: '📊', title: 'Using the Dashboard', steps: ['View bugs organized in Kanban columns by status', 'Drag and drop bugs to change status (Admins & Devs)', 'Use search bar and filters to find specific bugs', 'Click any bug card to see full details'] },
                                { icon: '🧠', title: 'AI Engine Features', steps: ['Duplicate Detection: Uses TF-IDF + Word Embeddings', 'Severity Prediction: 2-layer Neural Network classifier', 'Visit "AI Engine" page to see model metrics', 'Retrain the model to improve predictions'] },
                                { icon: '⚙️', title: 'Admin Panel', steps: ['Only accessible by Admin users', 'Manage team members and assign roles', 'Create, edit, and delete projects', 'Configure project-specific team assignments'] },
                            ].map(section => (
                                <div key={section.title} className="bg-white/5 rounded-xl border border-white/5 p-4">
                                    <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                                        <span>{section.icon}</span> {section.title}
                                    </h4>
                                    <ol className="space-y-2">
                                        {section.steps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                                <span className="w-5 h-5 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'shortcuts' && (
                        <>
                            <p className="text-xs text-slate-500 mb-2">Keyboard shortcuts for power users:</p>
                            {[
                                { keys: ['Ctrl', 'N'], desc: 'New bug report' },
                                { keys: ['Ctrl', 'K'], desc: 'Search bugs' },
                                { keys: ['Ctrl', '/'], desc: 'Toggle help panel' },
                                { keys: ['Esc'], desc: 'Close modals & panels' },
                                { keys: ['Tab'], desc: 'Navigate between elements' },
                                { keys: ['Enter'], desc: 'Confirm action / Submit form' },
                                { keys: ['←', '→'], desc: 'Switch dashboard columns' },
                            ].map(shortcut => (
                                <div key={shortcut.desc} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-xs text-slate-300">{shortcut.desc}</span>
                                    <div className="flex items-center gap-1">
                                        {shortcut.keys.map(k => (
                                            <kbd key={k} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">{k}</kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'faq' && (
                        <>
                            {[
                                { q: 'How does AI duplicate detection work?', a: 'The system uses TF-IDF vectorization and Word Embeddings to convert bug descriptions into numerical vectors. Cosine similarity measures the angle between vectors — higher similarity means more likely duplicate. An ensemble method combines both approaches for accuracy.' },
                                { q: 'How accurate is severity prediction?', a: 'The neural network classifier achieves ~85% accuracy. It analyzes keywords and patterns in bug descriptions to predict severity levels (Critical, High, Medium, Low) with confidence scores.' },
                                { q: 'Can I retrain the AI model?', a: 'Yes! Go to the AI Engine page and click "Retrain Model". The system will run 20 epochs of training and show real-time loss/accuracy curves.' },
                                { q: 'What user roles are available?', a: 'Admin: Full system access. Developer: Can update bug status and be assigned bugs. Tester: Can report and verify bugs. Guest: Read-only access to public bugs.' },
                                { q: 'How are passwords stored?', a: 'Passwords are hashed using a simulated Bcrypt algorithm before storage. Plain text passwords are never saved in the database.' },
                                { q: 'Can I attach files to bugs?', a: 'Yes. When reporting a bug, you can upload screenshots and documents. Files are encoded and stored along with the bug report.' },
                            ].map(item => (
                                <details key={item.q} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden group">
                                    <summary className="p-3 text-xs font-medium text-white cursor-pointer hover:bg-white/5 transition flex items-center gap-2">
                                        <span className="text-purple-400 transition group-open:rotate-90">▸</span>
                                        {item.q}
                                    </summary>
                                    <div className="px-3 pb-3 pt-0 text-xs text-slate-400 leading-relaxed border-t border-white/5 mt-0 pt-3">
                                        {item.a}
                                    </div>
                                </details>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 p-4">
                    <p className="text-[10px] text-slate-600 text-center">BugTracker AI v2.0 — Smart Bug Tracking with Deep Learning</p>
                </div>
            </div>
        </div>
    );
}
