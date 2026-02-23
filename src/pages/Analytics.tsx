import { useMemo } from 'react';
import { useAppContext } from '../store';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_COLORS = { new: '#3b82f6', open: '#eab308', 'in-progress': '#a855f7', resolved: '#22c55e', closed: '#64748b' };

export default function Analytics() {
  const { bugs, users, projects } = useAppContext();

  const severityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    bugs.forEach(b => counts[b.severity]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bugs]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { new: 0, open: 0, 'in-progress': 0, resolved: 0, closed: 0 };
    bugs.forEach(b => counts[b.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bugs]);

  const projectData = useMemo(() => {
    return projects.map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
      bugs: bugs.filter(b => b.projectId === p.id).length,
      open: bugs.filter(b => b.projectId === p.id && (b.status === 'open' || b.status === 'new')).length,
      resolved: bugs.filter(b => b.projectId === p.id && (b.status === 'resolved' || b.status === 'closed')).length,
    }));
  }, [bugs, projects]);

  const teamData = useMemo(() => {
    return users.filter(u => u.role === 'developer').map(u => ({
      name: u.name.split(' ')[0],
      assigned: bugs.filter(b => b.assigneeId === u.id).length,
      resolved: bugs.filter(b => b.assigneeId === u.id && (b.status === 'resolved' || b.status === 'closed')).length,
      active: bugs.filter(b => b.assigneeId === u.id && b.status === 'in-progress').length,
    }));
  }, [bugs, users]);

  const trendData = useMemo(() => {
    const days = 14;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const created = bugs.filter(b => {
        const d = new Date(b.createdAt);
        return d.toDateString() === date.toDateString();
      }).length;
      const resolved = bugs.filter(b => {
        const lastResolved = b.statusHistory.find(h => h.to === 'resolved');
        if (!lastResolved) return false;
        return new Date(lastResolved.timestamp).toDateString() === date.toDateString();
      }).length;
      data.push({ date: dateStr, created, resolved });
    }
    return data;
  }, [bugs]);

  const aiStats = useMemo(() => {
    const aiAnalyzed = bugs.filter(b => b.aiAnalyzed);
    const correctPredictions = aiAnalyzed.filter(b => b.predictedSeverity === b.severity);
    return {
      total: aiAnalyzed.length,
      correct: correctPredictions.length,
      accuracy: aiAnalyzed.length > 0 ? ((correctPredictions.length / aiAnalyzed.length) * 100).toFixed(1) : '0',
    };
  }, [bugs]);

  const avgResolution = useMemo(() => {
    const resolved = bugs.filter(b => b.status === 'resolved' || b.status === 'closed');
    if (resolved.length === 0) return 'N/A';
    const total = resolved.reduce((sum, b) => {
      const created = new Date(b.createdAt).getTime();
      const updated = new Date(b.updatedAt).getTime();
      return sum + (updated - created);
    }, 0);
    const avgDays = total / resolved.length / 86400000;
    return `${avgDays.toFixed(1)} days`;
  }, [bugs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">📈</span>
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400">Project health monitoring and AI insights</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bugs', value: bugs.length, icon: '🐛', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/20' },
          { label: 'AI Accuracy', value: `${aiStats.accuracy}%`, icon: '🧠', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20' },
          { label: 'Avg Resolution', value: avgResolution, icon: '⏱️', color: 'from-green-500/20 to-emerald-500/20 border-green-500/20' },
          { label: 'Active Projects', value: projects.length, icon: '📁', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/20' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bug Trends */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Bug Trends (14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="created" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Team Workload</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="assigned" fill="#a855f7" radius={[4, 4, 0, 0]} name="Assigned" />
              <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved" />
              <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-white/5 rounded-xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">📁 Project Bug Density</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={projectData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} width={100} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="open" fill="#eab308" stackId="a" name="Open" />
            <Bar dataKey="resolved" fill="#22c55e" stackId="a" name="Resolved" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
