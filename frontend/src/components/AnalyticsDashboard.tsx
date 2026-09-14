'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { usePostStore } from '@/lib/store';
import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp, FileText, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  linkedin: '#0077B5',
  devto: '#08090A',
  hashnode: '#2962FF',
  medium: '#00AB6C',
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    red: 'text-red-400 bg-red-400/10',
    sky: 'text-sky-400 bg-sky-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
  };
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon size={16} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-zinc-700 mt-1">{sub}</div>}
    </div>
  );
}

export function AnalyticsDashboard() {
  const { posts } = usePostStore();

  const stats = useMemo(() => {
    const total = posts.length;
    const drafts = posts.filter((p) => p.status === 'DRAFT').length;
    const published = posts.filter((p) => p.status === 'PUBLISHED').length;
    const scheduled = posts.filter((p) => p.status === 'SCHEDULED').length;

    // Platform counts
    const platformCounts: Record<string, number> = {};
    let failedCount = 0;
    posts.forEach((p) => {
      Object.entries(p.platforms || {}).forEach(([platform, status]) => {
        if (status.status === 'PUBLISHED') {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        }
        if (status.status === 'FAILED') failedCount++;
      });
    });

    // Tag frequency
    const tagCounts: Record<string, number> = {};
    posts.forEach((p) => (p.tags || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Posts per day (last 30 days)
    const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const perDay = last30.map((day) => {
      const key = format(day, 'MMM d');
      const count = posts.filter((p) => format(new Date(p.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
      return { date: key, posts: count };
    });

    // Avg word count
    const avgWords = total === 0 ? 0 : Math.round(
      posts.reduce((acc, p) => acc + (p.bodyMarkdown?.split(/\s+/).filter(Boolean).length || 0), 0) / total
    );

    // Status donut
    const statusData = [
      { name: 'Published', value: published },
      { name: 'Draft', value: drafts },
      { name: 'Scheduled', value: scheduled },
      { name: 'Failed', value: failedCount },
    ].filter((d) => d.value > 0);

    return { total, drafts, published, scheduled, failedCount, platformCounts, topTags, perDay, avgWords, statusData };
  }, [posts]);

  const platformChartData = Object.entries(stats.platformCounts).map(([name, count]) => ({ name, count }));

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Analytics</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Overview of your publishing activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard icon={FileText} label="Total Posts" value={stats.total} color="sky" />
        <StatCard icon={CheckCircle} label="Published" value={stats.published} color="emerald" />
        <StatCard icon={FileText} label="Drafts" value={stats.drafts} color="amber" />
        <StatCard icon={Clock} label="Scheduled" value={stats.scheduled} color="violet" />
        <StatCard icon={AlertTriangle} label="Failed" value={stats.failedCount} sub="need attention" color="red" />
      </div>

      {/* Avg word count banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
        <Zap size={16} className="text-emerald-400 shrink-0" />
        <div>
          <span className="text-sm font-semibold text-white">{stats.avgWords.toLocaleString()}</span>
          <span className="text-xs text-zinc-500 ml-2">average words per post</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Publishing activity */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" /> Posts Created (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.perDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                interval={6} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Bar dataKey="posts" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Post Status Breakdown</h3>
          {stats.statusData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-700 text-xs">No posts yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                  {stats.statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Platform publishes + Top tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform bar */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Published Per Platform</h3>
          {platformChartData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-zinc-700 text-xs">No published posts yet</div>
          ) : (
            <div className="space-y-2.5">
              {platformChartData.map(({ name, count }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs capitalize text-zinc-400">{name}</span>
                    <span className="text-xs text-zinc-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((count / Math.max(...platformChartData.map(d => d.count))) * 100)}%`,
                        backgroundColor: PLATFORM_COLORS[name] || '#10b981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top tags */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Top Tags Used</h3>
          {stats.topTags.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-zinc-700 text-xs">No tags added yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map(({ name, count }) => (
                <span
                  key={name}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/8 rounded-full text-xs text-zinc-400"
                >
                  #{name}
                  <span className="text-zinc-600">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
