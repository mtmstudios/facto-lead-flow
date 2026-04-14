import { useMemo } from 'react';
import { useLeads, type Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { formatCurrency, formatRelativeTime, isOverdue } from '@/lib/constants';
import { UserPlus, Phone, CalendarDays, Award, TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

const PIE_COLORS = ['#14B8A6', '#F59E0B', '#F97316', '#8B5CF6', '#22C55E', '#6B7280', '#EF4444', '#3B82F6', '#EC4899'];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

function KPICard({ title, value, subtitle, icon: Icon, trend, color, delay = 0 }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ElementType; trend?: number; color?: string; delay?: number;
}) {
  return (
    <motion.div variants={itemVariants} className="kpi-card">
      <Card className="glass-card h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className="text-3xl font-extrabold tracking-tight count-up">{value}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {trend !== undefined && trend !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
                {subtitle}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/8 flex items-center justify-center ring-1 ring-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="space-y-3">
          <div className="h-3 w-20 skeleton-shimmer" />
          <div className="h-8 w-24 skeleton-shimmer" />
          <div className="h-3 w-32 skeleton-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: leads = [], isLoading } = useLeads();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = leads.filter(l => new Date(l.created_at).getMonth() === now.getMonth() && new Date(l.created_at).getFullYear() === now.getFullYear());
    const lastMonth = leads.filter(l => {
      const d = new Date(l.created_at);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const newThisMonth = thisMonth.filter(l => l.status === 'Neu').length;
    const newLastMonth = lastMonth.filter(l => l.status === 'Neu').length;
    const kontaktiertCount = thisMonth.filter(l => l.status !== 'Neu').length;
    const termineCount = thisMonth.filter(l => l.status === 'Termin' || l.status === 'Qualifiziert').length;
    const mandateCount = thisMonth.filter(l => l.status === 'Mandat').length;
    const mandateUmsatz = thisMonth.filter(l => l.status === 'Mandat').reduce((s, l) => s + (l.mandats_wert || 0), 0);
    const kontaktQuote = thisMonth.length > 0 ? Math.round((kontaktiertCount / thisMonth.length) * 100) : 0;
    const terminRate = leads.length > 0 ? Math.round((termineCount / leads.length) * 100) : 0;
    const trend = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 0;

    return { newThisMonth, kontaktiertCount, termineCount, mandateCount, mandateUmsatz, kontaktQuote, terminRate, trend };
  }, [leads]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const quellenData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { const q = l.quelle || 'Unbekannt'; counts[q] = (counts[q] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const weeklyData = useMemo(() => {
    const weeks: { week: string; leads: number; mandate: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const weekLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= start && d < end; });
      weeks.push({
        week: `KW${Math.ceil((start.getDate() + new Date(start.getFullYear(), 0, 1).getDay()) / 7)}`,
        leads: weekLeads.length,
        mandate: weekLeads.filter(l => l.status === 'Mandat').length,
      });
    }
    return weeks;
  }, [leads]);

  const recentLeads = useMemo(() => leads.slice(0, 8), [leads]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leads.length} Leads insgesamt
            <span className="inline-flex items-center ml-2">
              <span className="pulse-dot mr-1.5" />
              <span className="text-xs">Live</span>
            </span>
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Neue Leads" value={stats.newThisMonth} subtitle="zum Vormonat" icon={UserPlus} trend={stats.trend} />
        <KPICard title="Kontaktiert" value={stats.kontaktiertCount} subtitle={`${stats.kontaktQuote}% Kontaktquote`} icon={Phone} />
        <KPICard title="Termine" value={stats.termineCount} subtitle={`${stats.terminRate}% Conversion`} icon={CalendarDays} />
        <KPICard title="Mandate" value={stats.mandateCount} subtitle={formatCurrency(stats.mandateUmsatz)} icon={Award} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Leads — Wide */}
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Neueste Leads</CardTitle>
                </div>
                <button
                  onClick={() => navigate('/leads')}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  Alle ansehen <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentLeads.map((lead, i) => (
                  <motion.button
                    key={lead.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-primary/[0.03] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/8 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {lead.vorname[0]}{lead.nachname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {lead.vorname} {lead.nachname}
                          {isOverdue(lead) && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                              Überfällig
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <StatusBadge status={lead.status} />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(lead.created_at)}</span>
                    </div>
                  </motion.button>
                ))}
                {recentLeads.length === 0 && (
                  <p className="px-5 py-12 text-center text-sm text-muted-foreground">Noch keine Leads vorhanden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column — Charts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Donut Chart */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold">Leads nach Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {statusData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-[140px] h-[140px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={65}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {statusData.slice(0, 6).map((s, i) => (
                        <div key={s.name} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {s.name}
                          </span>
                          <span className="text-xs font-medium tabular-nums">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Keine Daten</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart — Sources */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Quellen</CardTitle>
              </CardHeader>
              <CardContent>
                {quellenData.length > 0 ? (
                  <div className="space-y-3">
                    {quellenData.slice(0, 5).map((q, i) => {
                      const max = quellenData[0].value;
                      const pct = max > 0 ? (q.value / max) * 100 : 0;
                      return (
                        <div key={q.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{q.name}</span>
                            <span className="text-xs font-medium tabular-nums">{q.value}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                              className="h-full rounded-full bg-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Keine Daten</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Area Chart — Full Width */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Lead-Verlauf (12 Wochen)</CardTitle>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-6 rounded-full bg-primary" /> Neue Leads
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-6 rounded-full bg-emerald-500" /> Mandate
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(170, 80%, 45%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(170, 80%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mandateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" stroke="hsl(170, 80%, 45%)" strokeWidth={2} fill="url(#leadGradient)" name="Neue Leads" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="mandate" stroke="#22C55E" strokeWidth={2} fill="url(#mandateGradient)" name="Mandate" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
