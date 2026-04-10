import { useMemo } from 'react';
import { useLeads, type Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { formatCurrency, formatRelativeTime, isOverdue } from '@/lib/constants';
import { UserPlus, Phone, CalendarDays, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#0D9488', '#F59E0B', '#F97316', '#8B5CF6', '#22C55E', '#6B7280', '#EF4444'];

function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ElementType; trend?: number;
}) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {trend !== undefined && trend !== 0 && (
                trend > 0
                  ? <TrendingUp className="h-3 w-3 text-success" />
                  : <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              {subtitle}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
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
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
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

  const recentLeads = useMemo(() => leads.slice(0, 10), [leads]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Neue Leads" value={stats.newThisMonth} subtitle={`${stats.trend > 0 ? '+' : ''}${stats.trend}% zum Vormonat`} icon={UserPlus} trend={stats.trend} />
        <KPICard title="Kontaktiert" value={stats.kontaktiertCount} subtitle={`${stats.kontaktQuote}% der neuen Leads`} icon={Phone} />
        <KPICard title="Termine" value={stats.termineCount} subtitle={`${stats.terminRate}% Conversion Rate`} icon={CalendarDays} />
        <KPICard title="Mandate" value={stats.mandateCount} subtitle={formatCurrency(stats.mandateUmsatz)} icon={Award} />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent leads */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Neueste Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentLeads.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="flex items-center justify-between w-full px-5 py-3 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {lead.vorname} {lead.nachname}
                      {isOverdue(lead) && <span className="ml-2 text-xs text-destructive font-medium">Überfällig</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <StatusBadge status={lead.status} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(lead.created_at)}</span>
                  </div>
                </button>
              ))}
              {recentLeads.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Noch keine Leads vorhanden</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Leads nach Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Daten</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {statusData.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Leads nach Quelle</CardTitle>
            </CardHeader>
            <CardContent>
              {quellenData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={quellenData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Bar dataKey="value" fill="hsl(174, 84%, 32%)" radius={[0, 4, 4, 0]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Daten</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Line chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leads über Zeit</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="leads" stroke="#0D9488" strokeWidth={2} name="Neue Leads" dot={false} />
              <Line type="monotone" dataKey="mandate" stroke="#22C55E" strokeWidth={2} name="Mandate" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
