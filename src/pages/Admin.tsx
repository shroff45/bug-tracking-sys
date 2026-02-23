import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store';
import { t } from '../i18n';
import type { Role } from '../types';

export default function Admin() {
  const navigate = useNavigate();
  const { users, projects, updateUserRole, deleteUser, addProject, updateProject, deleteProject, analyzeProject, currentUser, language } = useAppContext();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectRepo, setNewProjectRepo] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRepo, setEditRepo] = useState('');
  const [analyzingProject, setAnalyzingProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [searchUsers, setSearchUsers] = useState('');

  const handleNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    addProject(newProjectName, newProjectDesc, newProjectRepo);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectRepo('');
  };

  const handleEditProject = (id: string) => {
    const p = projects.find(p => p.id === id);
    if (p) { setEditingProject(id); setEditName(p.name); setEditDesc(p.description); setEditRepo(p.repoUrl || ''); }
  };

  const handleSaveProject = () => {
    if (editingProject) {
      updateProject(editingProject, { name: editName, description: editDesc, repoUrl: editRepo });
      setEditingProject(null);
    }
  };

  const roleColors: Record<Role, string> = {
    admin: 'bg-red-500/20 text-red-400',
    developer: 'bg-blue-500/20 text-blue-400',
    tester: 'bg-green-500/20 text-green-400',
    guest: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" role="main" aria-label="Admin Panel">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">⚙️</span>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('adminPanel', language)}</h1>
          <p className="text-sm text-slate-400">Manage users, roles, and projects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 w-fit" role="tablist">
        {[
          { key: 'users' as const, label: `👥 ${t('users', language)}`, count: users.filter(u => u.role !== 'guest').length },
          { key: 'projects' as const, label: `📁 ${t('projects', language)}`, count: projects.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} role="tab" aria-selected={activeTab === tab.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            {tab.label} <span className="text-[10px] opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search Users */}
          <div className="flex items-center gap-3">
            <input value={searchUsers} onChange={e => setSearchUsers(e.target.value)} placeholder="Search users..."
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Search users" />
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full" aria-label="User management table">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">{t('email', language)}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">{t('role', language)}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Verified</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role !== 'guest').map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{user.avatar}</span>
                        <span className="text-sm text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <select value={user.role}
                        onChange={e => updateUserRole(user.id, e.target.value as Role)}
                        disabled={user.id === currentUser?.id}
                        className={`px-2 py-1 text-xs font-medium rounded border-0 cursor-pointer disabled:opacity-50 ${roleColors[user.role]}`}
                        aria-label={`Change role for ${user.name}`}>
                        <option value="admin">👑 Admin</option>
                        <option value="developer">👩‍💻 Developer</option>
                        <option value="tester">🔍 Tester</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${user.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                        {user.emailVerified ? '✅ Yes' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUser?.id && (
                        <button onClick={() => { if (confirm(`Delete user ${user.name}?`)) deleteUser(user.id); }}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition"
                          aria-label={`Delete ${user.name}`}>
                          🗑️ {t('delete', language)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* New Project Form */}
          <form onSubmit={handleNewProject} className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-5"
            aria-label="Create new project">
            <h3 className="text-sm font-semibold text-white mb-3">➕ New Project</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project name" required
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Project name" />
              <input value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Description"
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Project description" />
              <input value={newProjectRepo} onChange={e => setNewProjectRepo(e.target.value)} placeholder="GitHub Repo URL (Optional)"
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Repository URL" />
              <button type="submit" className="col-span-1 sm:col-span-3 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition">
                Create Project
              </button>
            </div>
          </form>

          {/* Projects List */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full" aria-label="Projects management table">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Repository</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          aria-label="Edit project name" />
                      ) : (
                        <span className="text-sm text-white font-medium">📁 {project.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                          aria-label="Edit project description" />
                      ) : (
                        <span className="text-xs text-slate-400">{project.description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <input value={editRepo} onChange={e => setEditRepo(e.target.value)} placeholder="GitHub URL"
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                          aria-label="Edit repo URL" />
                      ) : (
                        <span className="text-xs text-slate-400">{project.repoUrl || 'No repo linked'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingProject === project.id ? (
                          <>
                            <button onClick={handleSaveProject} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-green-500/10 transition" aria-label="Save changes">
                              ✅ {t('save', language)}
                            </button>
                            <button onClick={() => setEditingProject(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition" aria-label="Cancel editing">
                              {t('cancel', language)}
                            </button>
                          </>
                        ) : (
                          <>
                            {project.repoUrl && (
                              <button
                                onClick={async () => {
                                  setAnalyzingProject(project.id);
                                  await analyzeProject(project.id);
                                  setAnalyzingProject(null);
                                  navigate('/dashboard');
                                }}
                                disabled={analyzingProject === project.id}
                                className={`text-xs px-2 py-1 rounded transition ${analyzingProject === project.id ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400' : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'}`} aria-label={`Analyze ${project.name}`}>
                                {analyzingProject === project.id ? '⏳ Analyzing...' : '🤖 Analyze Codebase'}
                              </button>
                            )}
                            <button onClick={() => handleEditProject(project.id)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition" aria-label={`Edit ${project.name}`}>
                              ✏️ {t('edit', language)}
                            </button>
                            <button onClick={() => { if (confirm(`Delete project ${project.name}?`)) deleteProject(project.id); }}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition" aria-label={`Delete ${project.name}`}>
                              🗑️ {t('delete', language)}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
