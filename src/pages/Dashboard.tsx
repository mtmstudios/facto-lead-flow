import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { formatCurrency, formatRelativeTime, isOverdue } from '@/lib/constants';
import { UserPlus, Phone, CalendarDays, Award, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const FUNNEL_STAGES = [
  { label: 'Neu', statuses: ['Neu', 'Mail gesendet'], color: '#3B82F6' },
  { label: 'Kontaktiert', statuses: ['Kontaktiert'], color: '#F59E0B' },
  { label: 'Gespräch', statuses: ['Erstgespräch geplant', 'Erstgespräch durchgeführt'], color: '#F97316' },
  { label: 'Qualifiziert', statuses: ['Fragenkatalog gesendet', 'Fragenkatalog beantwortet', 'Qualifiziert'], color: '#8B5CF6' },
  { label: 'Mandat', statuses: ['Mandat'], color: '#22C55E' },
];

/* ── KPI Card ── */
function KPICard({ title, value, subtitle, icon: Icon }: {
  title: string; value: string | number; subtitle: string; icon: React.ElementType;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="glass-card h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight num">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
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
    const thisMonth = leads.filter(l => {
      const d = new Date(l.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const kontaktiertCount = leads.filter(l => l.status !== 'Neu').length;
    const termineCount = leads.filter(l => ['Erstgespräch geplant', 'Erstgespräch durchgeführt', 'Qualifiziert', 'Mandat'].includes(l.status)).length;
    const mandateCount = leads.filter(l => l.status === 'Mandat').length;
    const mandateUmsatz = leads.filter(l => l.status === 'Mandat').reduce((s, l) => s + (l.mandats_wert || 0), 0);
    return { newThisMonth: thisMonth.length, kontaktiertCount, termineCount, mandateCount, mandateUmsatz };
  }, [leads]);

  const funnelData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return [];
    return FUNNEL_STAGES.map((stage) => {
      // Zähle alle Leads die in dieser Stufe ODER weiter sind
      const stageIndex = FUNNEL_STAGES.indexOf(stage);
      const allStatusesAtOrPast = FUNNEL_STAGES.slice(stageIndex).flatMap(s => s.statuses);
      const count = leads.filter(l => allStatusesAtOrPast.includes(l.status)).length;
      const pct = Math.round((count / total) * 100);
      return { ...stage, count, pct };
    });
  }, [leads]);

  const overdueLeads = useMemo(() => leads.filter(isOverdue), [leads]);
  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

  const totalPipelineValue = useMemo(() =>
    leads.filter(l => !['Kalt', 'Nicht förderfähig', 'Disqualifiziert'].includes(l.status))
      .reduce((s, l) => s + (l.rechner_ergebnis || 0), 0),
    [leads]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[120px] skeleton-shimmer rounded-[var(--radius)]" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-end justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="num">{leads.length} Leads</span>
            <span className="mx-2 text-border">|</span>
            <span className="num">{formatCurrency(totalPipelineValue)} Pipeline</span>
          </p>
        </div>
      </motion.div>

      {/* Overdue Alert */}
      {overdueLeads.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive flex-1">
                {overdueLeads.length} überfällige {overdueLeads.length === 1 ? 'Lead' : 'Leads'}
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="text-destructive hover:text-destructive h-8 text-xs">
                Ansehen <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Neue Leads" value={stats.newThisMonth} subtitle="diesen Monat" icon={UserPlus} />
        <KPICard title="Kontaktiert" value={stats.kontaktiertCount} subtitle="bearbeitet" icon={Phone} />
        <KPICard title="Termine" value={stats.termineCount} subtitle="geplant / durchgeführt" icon={CalendarDays} />
        <KPICard title="Mandate" value={stats.mandateCount} subtitle={formatCurrency(stats.mandateUmsatz)} icon={Award} />
      </div>

      {/* Funnel — 5 Stufen */}
      {funnelData.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold">Conversion Funnel</h3>
                <button onClick={() => navigate('/pipeline')} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  Pipeline <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {funnelData.map((stage, i) => {
                  const maxCount = funnelData[0].count;
                  const barWidth = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 4) : 4;
                  return (
                    <div key={stage.label} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24 shrink-0 text-right">{stage.label}</span>
                      <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-lg flex items-center px-3"
                          style={{ backgroundColor: stage.color + '20', borderLeft: `3px solid ${stage.color}` }}
                        >
                          <span className="text-xs font-bold num" style={{ color: stage.color }}>{stage.count}</span>
                        </motion.div>
                      </div>
                      <span className="text-xs text-muted-foreground num w-10 text-right">{stage.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Leads */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-sm font-bold">Neueste Leads</h3>
              <button onClick={() => navigate('/leads')} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Alle <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-border/30">
              {recentLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-primary/[0.02] transition-all text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {lead.vorname} {lead.nachname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
                      <span className="text-xs font-bold text-primary num hidden sm:block">{formatCurrency(lead.rechner_ergebnis)}</span>
                    )}
                    <StatusBadge status={lead.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                </button>
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
