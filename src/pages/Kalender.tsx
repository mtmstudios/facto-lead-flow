import { useMemo, useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/Badges';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KalenderPage() {
  const { data: leads = [] } = useLeads();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const leadsWithTermin = useMemo(() => leads.filter(l => l.termin_am), [leads]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start

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

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
        <div className="flex items-center gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setView('month')}>Monat</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setView('week')}>Woche</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-base capitalize">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
              <div key={d} className="bg-muted/30 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card p-2 min-h-[80px]" />
            ))}
            {calendarDays.map(day => {
              const isToday = new Date().getDate() === day.date && new Date().getMonth() === month && new Date().getFullYear() === year;
              return (
                <div key={day.date} className={`bg-card p-2 min-h-[80px] ${isToday ? 'ring-1 ring-primary ring-inset' : ''}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day.date}</p>
                  <div className="space-y-1">
                    {day.leads.slice(0, 3).map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="w-full text-left rounded px-1.5 py-0.5 text-xs truncate bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {lead.vorname} {lead.nachname}
                      </button>
                    ))}
                    {day.leads.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{day.leads.length - 3} weitere</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
