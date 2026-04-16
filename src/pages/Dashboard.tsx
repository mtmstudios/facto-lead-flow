import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { formatCurrency, formatRelativeTime, isOverdue } from '@/lib/constants';
import { UserPlus, Phone, CalendarDays, Award, TrendingUp, TrendingDown, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const FUNNEL_STAGES = [
  'Neu', 'Mail gesendet', 'Kontaktiert', 'Erstgespräch geplant',
  'Erstgespräch durchgeführt', 'Fragenkatalog gesendet', 'Fragenkatalog beantwortet',
  'Qualifiziert', 'Mandat'
];
const FUNNEL_COLORS = ['#3B82F6', '#60A5FA', '#F59E0B', '#F97316', '#818CF8', '#6366F1', '#8B5CF6', '#A855F7', '#22C55E'];

/* ── Radial Ring ── */
function RadialRing({ value, max, color, size = 44 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={3} strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${pct * circ} ${circ - pct * circ}` }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color = 'hsl(var(--primary))', height = 32, width = 80 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M0,${height} L${points.split(' ').map((p, i) => (i === 0 ? p : ` L${p}`)).join('')} L${width},${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── KPI Card ── */
function KPICard({ title, value, subtitle, icon: Icon, trend, sparkData, ringValue, ringMax, ringColor }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ElementType; trend?: number;
  sparkData?: number[]; ringValue?: number; ringMax?: number; ringColor?: string;
}) {
  return (
    <motion.div variants={itemVariants} className="kpi-card">
      <Card className="glass-card h-full">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl md:text-3xl font-black tracking-tight num count-up">{value}</p>
                {sparkData && sparkData.length > 2 && (
                  <div className="mb-1 opacity-60">
                    <Sparkline data={sparkData} height={24} width={56} />
                  </div>
                )}
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                {trend !== undefined && trend !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
                <span className="truncate">{subtitle}</span>
              </p>
            </div>
            {ringValue !== undefined && ringMax !== undefined ? (
              <div className="relative shrink-0">
                <RadialRing value={ringValue} max={ringMax} color={ringColor || 'hsl(var(--primary))'} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold num" style={{ color: ringColor }}>{ringMax > 0 ? Math.round((ringValue / ringMax) * 100) : 0}%</span>
                </div>
              </div>
            ) : (
              <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-primary/8 flex items-center justify-center ring-1 ring-primary/10 shrink-0">
                <Icon className="h-4.5 w-4.5 md:h-5 md:w-5 text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
    const newThisMonth = thisMonth.length;
    const newLastMonth = lastMonth.length;
    const kontaktiertCount = leads.filter(l => l.status !== 'Neu').length;
    const termineCount = leads.filter(l => ['Erstgespräch geplant', 'Erstgespräch durchgeführt', 'Qualifiziert', 'Mandat'].includes(l.status)).length;
    const mandateCount = leads.filter(l => l.status === 'Mandat').length;
    const mandateUmsatz = leads.filter(l => l.status === 'Mandat').reduce((s, l) => s + (l.mandats_wert || 0), 0);
    const kontaktQuote = leads.length > 0 ? Math.round((kontaktiertCount / leads.length) * 100) : 0;
    const terminRate = leads.length > 0 ? Math.round((termineCount / leads.length) * 100) : 0;
    const trend = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 0;
    return { newThisMonth, kontaktiertCount, termineCount, mandateCount, mandateUmsatz, kontaktQuote, terminRate, trend };
  }, [leads]);

  // Weekly sparkline data (last 8 weeks)
  const weeklySparkData = useMemo(() => {
    const weeks: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      weeks.push(leads.filter(l => { const d = new Date(l.created_at); return d >= start && d < end; }).length);
    }
    return weeks;
  }, [leads]);

  const funnelData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return [];
    return FUNNEL_STAGES.map((stage, i) => {
      const stagesAtOrPast = FUNNEL_STAGES.slice(i);
      const count = leads.filter(l => stagesAtOrPast.includes(l.status)).length;
      const pct = Math.round((count / total) * 100);
      return { stage, count, pct, color: FUNNEL_COLORS[i] };
    });
  }, [leads]);

  const overdueLeads = useMemo(() => leads.filter(isOverdue), [leads]);

  const quellenData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { const q = l.quelle || 'Unbekannt'; counts[q] = (counts[q] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const recentLeads = useMemo(() => leads.slice(0, 6), [leads]);

  const totalPipelineValue = useMemo(() =>
    leads.filter(l => !['Kalt', 'Nicht förderfähig', 'Disqualifiziert'].includes(l.status))
      .reduce((s, l) => s + (l.rechner_ergebnis || 0), 0),
    [leads]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[120px] skeleton-shimmer rounded-[var(--radius)]" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 md:space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-end justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="text-[11px] md:text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="num">{leads.length} Leads</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="num">{formatCurrency(totalPipelineValue)} Pipeline</span>
            <span className="inline-flex items-center ml-1">
              <span className="pulse-dot mr-1" />
              <span className="text-[10px]">Live</span>
            </span>
          </p>
        </div>
      </motion.div>

      {/* Overdue Alert */}
      {overdueLeads.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="rounded-[var(--radius)] border border-destructive/20 bg-destructive/[0.03] p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-destructive">{overdueLeads.length} überfällige Leads</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {overdueLeads.slice(0, 4).map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="inline-flex items-center gap-1 rounded-full bg-destructive/8 px-2.5 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/15 transition-colors"
                    >
                      {lead.vorname} {lead.nachname}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                  {overdueLeads.length > 4 && (
                    <button onClick={() => navigate('/leads')} className="text-[11px] text-destructive font-medium hover:underline px-1">
                      +{overdueLeads.length - 4} mehr
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Neue Leads" value={stats.newThisMonth} subtitle="diesen Monat"
          icon={UserPlus} trend={stats.trend} sparkData={weeklySparkData}
        />
        <KPICard
          title="Kontaktiert" value={stats.kontaktiertCount} subtitle="bearbeitet"
          icon={Phone} ringValue={stats.kontaktiertCount} ringMax={leads.length} ringColor="#3B82F6"
        />
        <KPICard
          title="Termine" value={stats.termineCount} subtitle={`${stats.terminRate}% Rate`}
          icon={CalendarDays} ringValue={stats.termineCount} ringMax={leads.length} ringColor="#F59E0B"
        />
        <KPICard
          title="Mandate" value={stats.mandateCount} subtitle={formatCurrency(stats.mandateUmsatz)}
          icon={Award} ringValue={stats.mandateCount} ringMax={leads.length} ringColor="#22C55E"
        />
      </div>

      {/* Funnel + Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">
        {/* Funnel */}
        {funnelData.length > 0 && (
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="glass-card h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Conversion Funnel</CardTitle>
                  <button onClick={() => navigate('/pipeline')} className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    Pipeline <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {funnelData.map((stage, i) => {
                    const maxCount = funnelData[0].count;
                    const barWidth = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 3) : 3;
                    const convRate = i > 0 && funnelData[i - 1].count > 0
                      ? Math.round((stage.count / funnelData[i - 1].count) * 100) : null;
                    return (
                      <div key={stage.stage} className="group/bar flex items-center gap-2 md:gap-3">
                        <span className="text-[10px] md:text-[11px] text-muted-foreground w-[100px] md:w-[160px] shrink-0 truncate text-right">
                          {stage.stage}
                        </span>
                        <div className="flex-1 h-6 md:h-7 bg-muted/20 rounded-md overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-md flex items-center justify-between px-2"
                            style={{ backgroundColor: stage.color + '22', borderLeft: `2px solid ${stage.color}` }}
                          >
                            <span className="text-[10px] font-bold num" style={{ color: stage.color }}>{stage.count}</span>
                          </motion.div>
                        </div>
                        <div className="flex items-center gap-1.5 w-16 shrink-0">
                          <span className="text-[10px] text-muted-foreground num">{stage.pct}%</span>
                          {convRate !== null && (
                            <span className={`text-[9px] font-bold num hidden md:block ${
                              convRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : convRate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
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

        {/* Sources */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Lead-Quellen</CardTitle>
            </CardHeader>
            <CardContent>
              {quellenData.length > 0 ? (
                <div className="space-y-3">
                  {quellenData.slice(0, 5).map((q, i) => {
                    const max = quellenData[0].value;
                    const pct = max > 0 ? (q.value / max) * 100 : 0;
                    return (
                      <div key={q.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{q.name}</span>
                          <span className="text-[11px] font-bold num">{q.value}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
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

      {/* Recent Leads */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Neueste Leads</CardTitle>
              <button onClick={() => navigate('/leads')} className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Alle ansehen <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentLeads.map((lead, i) => (
                <motion.button
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="flex items-center justify-between w-full px-4 md:px-5 py-3 hover:bg-primary/[0.02] transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 ring-1 ring-primary/10">
                      {lead.vorname[0]}{lead.nachname[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {lead.vorname} {lead.nachname}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
                      <span className="text-[11px] font-bold text-primary num hidden sm:block">{formatCurrency(lead.rechner_ergebnis)}</span>
                    )}
                    <StatusBadge status={lead.status} />
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap hidden md:block num">{formatRelativeTime(lead.created_at)}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                </motion.button>
              ))}
              {recentLeads.length === 0 && (
                <p className="px-5 py-12 text-center text-sm text-muted-foreground">Noch keine Leads</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
