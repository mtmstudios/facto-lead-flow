import { useMemo, useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function KalenderPage() {
  const { data: leads = [] } = useLeads();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const leadsWithTermin = useMemo(() => leads.filter(l => l.termin_am), [leads]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const calendarDays = useMemo(() => {
    const days: { date: number; leads: typeof leadsWithTermin }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayLeads = leadsWithTermin.filter(l => {
        const d = new Date(l.termin_am!);
        return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
      });
      days.push({ date: i, leads: dayLeads });
    }
    return days;
  }, [leadsWithTermin, month, year, daysInMonth]);

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const todayDate = new Date();

  const upcomingTermine = useMemo(() => {
    const now = new Date();
    return leadsWithTermin
      .filter(l => new Date(l.termin_am!) >= now)
      .sort((a, b) => new Date(a.termin_am!).getTime() - new Date(b.termin_am!).getTime())
      .slice(0, 5);
  }, [leadsWithTermin]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leadsWithTermin.length} geplante Termine
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={today} className="h-9">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />Heute
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base font-semibold capitalize">{monthName}</CardTitle>
                <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-border/50 rounded-xl overflow-hidden">
                {/* Day Headers */}
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                  <div key={d} className="bg-muted/30 p-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {d}
                  </div>
                ))}
                {/* Empty cells */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-card/50 p-2 min-h-[90px]" />
                ))}
                {/* Day cells */}
                {calendarDays.map(day => {
                  const isToday = todayDate.getDate() === day.date && todayDate.getMonth() === month && todayDate.getFullYear() === year;
                  const hasLeads = day.leads.length > 0;
                  return (
                    <div
                      key={day.date}
                      className={`bg-card p-2 min-h-[90px] transition-colors ${
                        isToday ? 'ring-2 ring-inset ring-primary/30 bg-primary/[0.03]' : ''
                      } ${hasLeads ? 'hover:bg-primary/[0.02]' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          isToday
                            ? 'bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center'
                            : 'text-muted-foreground'
                        }`}>
                          {day.date}
                        </span>
                        {day.leads.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="space-y-1">
                        {day.leads.slice(0, 2).map(lead => (
                          <button
                            key={lead.id}
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="w-full text-left rounded-md px-1.5 py-1 text-[11px] font-medium truncate bg-primary/8 text-primary hover:bg-primary/15 transition-colors border border-primary/10"
                          >
                            {lead.vorname} {lead.nachname}
                          </button>
                        ))}
                        {day.leads.length > 2 && (
                          <p className="text-[10px] text-muted-foreground pl-1">+{day.leads.length - 2} weitere</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sidebar */}
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Anstehende Termine</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {upcomingTermine.map(lead => {
                  const terminDate = new Date(lead.termin_am!);
                  return (
                    <button
                      key={lead.id}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/[0.03] transition-colors"
                    >
                      <p className="text-xs font-semibold text-primary tabular-nums">
                        {terminDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        {' '}
                        {terminDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm font-medium mt-0.5 truncate">{lead.vorname} {lead.nachname}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
                    </button>
                  );
                })}
                {upcomingTermine.length === 0 && (
                  <p className="px-4 py-8 text-center text-xs text-muted-foreground">Keine anstehenden Termine</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
