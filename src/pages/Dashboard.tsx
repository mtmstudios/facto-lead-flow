import { useMemo } from 'react';
import { useLeads, type Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { formatCurrency, formatRelativeTime, isOverdue } from '@/lib/constants';
import { UserPlus, Phone, CalendarDays, Award, TrendingUp, TrendingDown, ArrowRight, Activity, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';

const PIE_COLORS = ['#14B8A6', '#F59E0B', '#F97316', '#8B5CF6', '#22C55E', '#6B7280', '#EF4444', '#3B82F6', '#EC4899'];

const FUNNEL_COLORS = ['#14B8A6', '#38BDF8', '#F59E0B', '#F97316', '#A78BFA', '#8B5CF6', '#C084FC', '#A855F7', '#22C55E'];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ElementType; trend?: number;
}) {
  return (
    <motion.div variants={itemVariants} className="kpi-card">
      <Card className="glass-card h-full">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 md:space-y-2">
              <p className="text-[11px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className="text-2xl md:text-3xl font-extrabold tracking-tight count-up">{value}</p>
              <p className="text-[11px] md:text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                {trend !== undefined && trend !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
                <span className="truncate">{subtitle}</span>
              </p>
            </div>
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-primary/8 flex items-center justify-center ring-1 ring-primary/10 shrink-0">
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
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

const FUNNEL_STAGES = [
  'Neu', 'Mail gesendet', 'Kontaktiert', 'Erstgespräch geplant',
  'Erstgespräch durchgeführt', 'Fragenkatalog gesendet', 'Fragenkatalog beantwortet',
  'Qualifiziert', 'Mandat'
];

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
    const termineCount = thisMonth.filter(l => ['Erstgespräch geplant', 'Erstgespräch durchgeführt', 'Qualifiziert'].includes(l.status)).length;
    const mandateCount = thisMonth.filter(l => l.status === 'Mandat').length;
    const mandateUmsatz = thisMonth.filter(l => l.status === 'Mandat').reduce((s, l) => s + (l.mandats_wert || 0), 0);
    const kontaktQuote = thisMonth.length > 0 ? Math.round((kontaktiertCount / thisMonth.length) * 100) : 0;
    const terminRate = leads.length > 0 ? Math.round((termineCount / leads.length) * 100) : 0;
    const trend = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 0;

    return { newThisMonth, kontaktiertCount, termineCount, mandateCount, mandateUmsatz, kontaktQuote, terminRate, trend };
  }, [leads]);

  // Conversion Funnel data
  const funnelData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return [];
    return FUNNEL_STAGES.map((stage, i) => {
      // Count leads that are AT or PAST this stage
      const stagesAtOrPast = FUNNEL_STAGES.slice(i);
      const count = leads.filter(l => stagesAtOrPast.includes(l.status)).length;
      const pct = Math.round((count / total) * 100);
      return { stage, count, pct, color: FUNNEL_COLORS[i] };
    });
  }, [leads]);

  // Overdue leads
  const overdueLeads = useMemo(() => leads.filter(isOverdue), [leads]);

  // Next appointments
  const upcomingTermine = useMemo(() => {
    const now = new Date();
    return leads
      .filter(l => l.termin_am && new Date(l.termin_am) >= now)
      .sort((a, b) => new Date(a.termin_am!).getTime() - new Date(b.termin_am!).getTime())
      .slice(0, 3);
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
      className="space-y-6 md:space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {leads.length} Leads
            <span className="inline-flex items-center ml-2">
              <span className="pulse-dot mr-1.5" />
              <span className="text-[11px]">Live</span>
            </span>
          </p>
        </div>
      </motion.div>

      {/* Quick Actions — Overdue + Upcoming */}
      {(overdueLeads.length > 0 || upcomingTermine.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Overdue Warning */}
          {overdueLeads.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-destructive/20 bg-destructive/[0.03]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-destructive">{overdueLeads.length} überfällige Leads</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Seit über 4 Stunden ohne Kontakt</p>
                      <div className="mt-2 space-y-1">
                        {overdueLeads.slice(0, 3).map(lead => (
                          <button
                            key={lead.id}
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors w-full text-left"
                          >
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{lead.vorname} {lead.nachname}</span>
                            <span className="text-muted-foreground ml-auto shrink-0">{lead.unternehmen || ''}</span>
                          </button>
                        ))}
                      </div>
                      {overdueLeads.length > 3 && (
                        <button onClick={() => navigate('/leads')} className="text-xs text-destructive hover:underline mt-1.5">
                          +{overdueLeads.length - 3} weitere ansehen
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upcoming Appointments */}
          {upcomingTermine.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-primary/15 bg-primary/[0.02]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Nächste Termine</p>
                      <div className="mt-2 space-y-1.5">
                        {upcomingTermine.map(lead => {
                          const d = new Date(lead.termin_am!);
                          return (
                            <button
                              key={lead.id}
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              className="flex items-center gap-2 text-xs w-full text-left hover:text-primary transition-colors"
                            >
                              <span className="text-primary font-semibold tabular-nums shrink-0">
                                {d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} {d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="truncate">{lead.vorname} {lead.nachname}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={() => navigate('/kalender')} className="text-xs text-primary hover:underline mt-1.5 flex items-center gap-1">
                        Kalender öffnen <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard title="Neue Leads" value={stats.newThisMonth} subtitle="zum Vormonat" icon={UserPlus} trend={stats.trend} />
        <KPICard title="Kontaktiert" value={stats.kontaktiertCount} subtitle={`${stats.kontaktQuote}% Quote`} icon={Phone} />
        <KPICard title="Termine" value={stats.termineCount} subtitle={`${stats.terminRate}% Conversion`} icon={CalendarDays} />
        <KPICard title="Mandate" value={stats.mandateCount} subtitle={formatCurrency(stats.mandateUmsatz)} icon={Award} />
      </div>

      {/* Conversion Funnel */}
      {funnelData.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnelData.map((stage, i) => {
                  const maxCount = funnelData[0].count;
                  const barWidth = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 4) : 4;
                  const convRate = i > 0 && funnelData[i - 1].count > 0
                    ? Math.round((stage.count / funnelData[i - 1].count) * 100)
                    : null;
                  return (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-[130px] md:w-[180px] shrink-0 truncate text-right">
                        {stage.stage}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            className="h-full rounded-md flex items-center px-2 min-w-[32px]"
                            style={{ backgroundColor: stage.color + '30' }}
                          >
                            <span className="text-[11px] font-bold tabular-nums" style={{ color: stage.color }}>{stage.count}</span>
                          </motion.div>
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums w-10 shrink-0">
                          {stage.pct}%
                        </span>
                        {convRate !== null && (
                          <span className={`text-[10px] tabular-nums w-10 shrink-0 hidden md:block ${
                            convRate >= 70 ? 'text-emerald-500' : convRate >= 40 ? 'text-amber-500' : 'text-red-400'
                          }`}>
                            ↓{convRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Recent Leads */}
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
                  Alle <ArrowRight className="h-3 w-3" />
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
                    transition={{ delay: 0.05 + i * 0.03 }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="flex items-center justify-between w-full px-4 md:px-5 py-3 hover:bg-primary/[0.03] transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/8 flex items-center justify-center text-[10px] md:text-xs font-semibold text-primary shrink-0">
                        {lead.vorname[0]}{lead.nachname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {lead.vorname} {lead.nachname}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                      <StatusBadge status={lead.status} />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:block">{formatRelativeTime(lead.created_at)}</span>
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
        <div className="lg:col-span-5 space-y-4 md:space-y-6">
          {/* Donut Chart */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold">Leads nach Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {statusData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={55} paddingAngle={3} strokeWidth={0}>
                            {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      {statusData.slice(0, 6).map((s, i) => (
                        <div key={s.name} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {s.name}
                          </span>
                          <span className="text-[11px] font-medium tabular-nums">{s.value}</span>
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

          {/* Sources */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Quellen</CardTitle>
              </CardHeader>
              <CardContent>
                {quellenData.length > 0 ? (
                  <div className="space-y-2.5">
                    {quellenData.slice(0, 5).map((q, i) => {
                      const max = quellenData[0].value;
                      const pct = max > 0 ? (q.value / max) * 100 : 0;
                      return (
                        <div key={q.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">{q.name}</span>
                            <span className="text-[11px] font-medium tabular-nums">{q.value}</span>
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

      {/* Area Chart */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold">Lead-Verlauf (12 Wochen)</CardTitle>
              <div className="flex items-center gap-3 md:gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-5 rounded-full bg-primary" /> Leads
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-5 rounded-full bg-emerald-500" /> Mandate
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pr-0 md:pr-6">
            <ResponsiveContainer width="100%" height={220}>
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
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" stroke="hsl(170, 80%, 45%)" strokeWidth={2} fill="url(#leadGradient)" name="Neue Leads" dot={false} activeDot={{ r: 3, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="mandate" stroke="#22C55E" strokeWidth={2} fill="url(#mandateGradient)" name="Mandate" dot={false} activeDot={{ r: 3, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
