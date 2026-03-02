/**
 * src/pages/Analytics.tsx
 * 
 * CORE VIEW: The Analytics Dashboard
 * 
 * Features:
 * 1. Displays project health metrics including bug severity, status breakdown, and trends.
 * 2. Visualizes team workload and AI prediction accuracy.
 * 3. Uses Recharts for responsive, interactive charting.
 * 
 * Why this code/type is used:
 * - useMemo: Used heavily to calculate aggregrate data only when dependencies change, optimizing performance.
 * - useAppContext: Used to access global state for bugs, users, and projects to calculate metrics.
 * - Recharts components (PieChart, BarChart, LineChart): Used for robust, declarative charting in React.
 */
import { useMemo } from 'react'; // Hook for memoizing expensive calculations
import { useAppContext } from '../store'; // Hook to access global context
// Import necessary chart components from recharts library
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

// Colors mapped to bug severities for chart rendering
const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
// Colors mapped to bug statuses for chart rendering
const STATUS_COLORS = { new: '#3b82f6', open: '#eab308', 'in-progress': '#a855f7', resolved: '#22c55e', closed: '#64748b' };

// Analytics component displays various charts based on application data
export default function Analytics() {
  // Access global state elements needed for analytics
  const { bugs, users, projects } = useAppContext();

  // Memoized data for the Severity Distribution Pie Chart
  const severityData = useMemo(() => {
    // Initialize counters for each severity level
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    bugs.forEach(b => counts[b.severity]++); // Increment count based on bug severity
    // Convert object back to array form required by Recharts
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bugs]); // Re-calculate when 'bugs' array changes

  // Memoized data for the Status Breakdown Bar Chart
  const statusData = useMemo(() => {
    // Initialize counters for each status type
    const counts: Record<string, number> = { new: 0, open: 0, 'in-progress': 0, resolved: 0, closed: 0 };
    bugs.forEach(b => counts[b.status]++); // Increment count based on bug status
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
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Project health monitoring and AI insights</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bugs', value: bugs.length, icon: '🐛' },
          { label: 'AI Accuracy', value: `${aiStats.accuracy}%`, icon: '🧠' },
          { label: 'Avg Resolution', value: avgResolution, icon: '⏱️' },
          { label: 'Active Projects', value: projects.length, icon: '📁' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)', color: 'hsl(var(--foreground))', fontSize: '12px' }} cursor={{ fill: 'hsl(var(--secondary))' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bug Trends */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Bug Trends (14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="created" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Team Workload</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)', color: 'hsl(var(--foreground))', fontSize: '12px' }} cursor={{ fill: 'hsl(var(--secondary))' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="assigned" fill="#a855f7" radius={[4, 4, 0, 0]} name="Assigned" />
              <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved" />
              <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">📁 Project Bug Density</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={projectData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)', color: 'hsl(var(--foreground))', fontSize: '12px' }} cursor={{ fill: 'hsl(var(--secondary))' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="open" fill="#eab308" stackId="a" name="Open" />
            <Bar dataKey="resolved" fill="#22c55e" stackId="a" name="Resolved" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
