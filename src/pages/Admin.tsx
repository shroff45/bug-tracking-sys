/**
 * src/pages/Admin.tsx
 * 
 * CORE VIEW: The Admin Panel
 * 
 * Features:
 * 1. User Management: Allows viewing users and changing their roles.
 * 2. Project Management: Allows creating, editing, and deleting projects.
 * 3. AI Analysis: Allows triggering codebase analysis for projects.
 * 
 * Why this code/type is used:
 * - useState: Used for managing local component state (form inputs, active tabs).
 * - useAppContext: Used to access global state and functions like users, projects, mutations.
 * - t (i18n): Used for internationalization to render text in the active language.
 */
// Import useState hook for local UI state management
import { useState } from 'react';
// Import useNavigate for programmatic navigation
import { useNavigate } from 'react-router-dom';
// Import custom hook to access global application context
import { useAppContext } from '../store';
// Import translation function for multi-language support
import { t } from '../i18n';
// Import Role type definition for type safety
import type { Role } from '../types';

// Define the Admin functional component
export default function Admin() {
  // Initialize navigate function for routing
  const navigate = useNavigate();
  // Destructure needed states and functions from the global context
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

  // Handler for form submission to create a new project
  const handleNewProject = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission which refreshes the page
    if (!newProjectName) return; // Guard clause: do nothing if project name is empty
    addProject(newProjectName, newProjectDesc, newProjectRepo); // Call global addProject action
    // Reset form inputs
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectRepo('');
  };

  // Handler to activate edit mode for a specific project
  const handleEditProject = (id: string) => {
    const p = projects.find(p => p.id === id); // Find the project in the global projects array
    if (p) {
      // Populate state with existing values
      setEditingProject(id); setEditName(p.name); setEditDesc(p.description); setEditRepo(p.repoUrl || '');
    }
  };

  // Handler to save changes made during edit mode
  const handleSaveProject = () => {
    if (editingProject) {
      // Dispatch update with new values
      updateProject(editingProject, { name: editName, description: editDesc, repoUrl: editRepo });
      setEditingProject(null); // Exit edit mode
    }
  };

  // Define a mapping of roles to Tailwind CSS color classes for the UI
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
          <h1 className="text-2xl font-bold text-foreground">{t('adminPanel', language)}</h1>
          <p className="text-sm text-muted-foreground">Manage users, roles, and projects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/50 rounded-lg p-1 border border-border w-fit" role="tablist">
        {[
          { key: 'users' as const, label: `👥 ${t('users', language)}`, count: users.filter(u => u.role !== 'guest').length },
          { key: 'projects' as const, label: `📁 ${t('projects', language)}`, count: projects.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} role="tab" aria-selected={activeTab === tab.key}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label} <span className="text-[10px] opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search Users */}
          <div className="flex items-center gap-3">
            <input value={searchUsers} onChange={e => setSearchUsers(e.target.value)} placeholder="Search users..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Search users" />
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full" aria-label="User management table">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t('email', language)}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t('role', language)}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Verified</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role !== 'guest').map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{user.avatar}</span>
                        <span className="text-sm text-foreground font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.email}</td>
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
                      <span className={`text-xs font-medium ${user.emailVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                        {user.emailVerified ? '✅ Yes' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUser?.id && (
                        <button onClick={() => { if (confirm(`Delete user ${user.name}?`)) deleteUser(user.id); }}
                          className="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
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
          <form onSubmit={handleNewProject} className="bg-card rounded-lg border border-border p-5"
            aria-label="Create new project">
            <h3 className="text-sm font-semibold text-foreground mb-3">➕ New Project</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project name" required
                className="px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Project name" />
              <input value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Description"
                className="px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Project description" />
              <input value={newProjectRepo} onChange={e => setNewProjectRepo(e.target.value)} placeholder="GitHub Repo URL (Optional)"
                className="px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Repository URL" />
              <button type="submit" className="col-span-1 sm:col-span-3 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium rounded-md transition-colors">
                Create Project
              </button>
            </div>
          </form>

          {/* Projects List */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full" aria-label="Projects management table">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Repository</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          className="px-2 py-1 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          aria-label="Edit project name" />
                      ) : (
                        <span className="text-sm text-foreground font-medium">📁 {project.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                          className="px-2 py-1 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                          aria-label="Edit project description" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{project.description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <input value={editRepo} onChange={e => setEditRepo(e.target.value)} placeholder="GitHub URL"
                          className="px-2 py-1 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                          aria-label="Edit repo URL" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{project.repoUrl || 'No repo linked'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingProject === project.id ? (
                          <>
                            <button onClick={handleSaveProject} className="text-xs text-green-500 hover:text-green-600 px-2 py-1 rounded hover:bg-green-500/10 transition-colors" aria-label="Save changes">
                              ✅ {t('save', language)}
                            </button>
                            <button onClick={() => setEditingProject(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors" aria-label="Cancel editing">
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
                                className={`text-xs px-2 py-1 rounded transition-colors ${analyzingProject === project.id ? 'opacity-50 cursor-not-allowed bg-secondary text-muted-foreground' : 'text-primary hover:text-primary/80 hover:bg-primary/10'}`} aria-label={`Analyze ${project.name}`}>
                                {analyzingProject === project.id ? '⏳ Analyzing...' : '🤖 Analyze Codebase'}
                              </button>
                            )}
                            <button onClick={() => handleEditProject(project.id)} className="text-xs text-blue-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors" aria-label={`Edit ${project.name}`}>
                              ✏️ {t('edit', language)}
                            </button>
                            <button onClick={() => { if (confirm(`Delete project ${project.name}?`)) deleteProject(project.id); }}
                              className="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded hover:bg-destructive/10 transition-colors" aria-label={`Delete ${project.name}`}>
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
