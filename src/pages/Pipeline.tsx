import { useMemo } from 'react';
import { useLeads, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { StatusBadge, PrioBadge } from '@/components/Badges';
import { LEAD_STATUSES, formatCurrency, formatRelativeTime, berechneFoerderfaehigkeit, FOERDERFAEHIGKEIT_LABELS } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';

const PIPELINE_STATUSES = [
  'Neu', 'Mail gesendet', 'Kontaktiert', 'Erstgespräch geplant',
  'Erstgespräch durchgeführt', 'Fragenkatalog gesendet', 'Fragenkatalog beantwortet',
  'Qualifiziert', 'Mandat'
];

function LeadCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const ff = berechneFoerderfaehigkeit(lead);
  const ffInfo = FOERDERFAEHIGKEIT_LABELS[ff];
  const daysSince = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);

  return (
    <button
      onClick={() => navigate(`/leads/${lead.id}`)}
      className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary/30 hover:shadow-sm transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{lead.vorname} {lead.nachname}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.unternehmen || '–'}</p>
        </div>
        <PrioBadge prio={lead.prioritaet} />
      </div>
      {lead.rechner_ergebnis && (
        <p className="text-sm font-semibold text-primary">{formatCurrency(lead.rechner_ergebnis)}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{formatRelativeTime(lead.created_at)}</span>
        {ff !== 'unbekannt' && (
          <span className={`text-xs ${ffInfo.color}`}>
            {ff === 'gruen' && '🟢'}{ff === 'gelb' && '🟡'}{ff === 'rot' && '🔴'}
          </span>
        )}
      </div>
      {daysSince > 3 && lead.status === 'Neu' && (
        <span className="text-xs text-destructive font-medium">Überfällig ({daysSince} Tage)</span>
      )}
    </button>
  );
}

export default function PipelinePage() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();

  const columns = useMemo(() => {
    return PIPELINE_STATUSES.map(status => ({
      status,
      leads: leads.filter(l => l.status === status),
    }));
  }, [leads]);

  const closedLeads = useMemo(() => ({
    kalt: leads.filter(l => l.status === 'Kalt' || l.status === 'Nicht förderfähig' || l.status === 'Disqualifiziert'),
  }), [leads]);

  const totalPipeline = useMemo(() =>
    leads
      .filter(l => !['Kalt', 'Nicht förderfähig', 'Disqualifiziert', 'Mandat'].includes(l.status))
      .reduce((sum, l) => sum + (l.rechner_ergebnis || 0), 0),
    [leads]
  );

  const totalMandate = useMemo(() =>
    leads.filter(l => l.status === 'Mandat').reduce((sum, l) => sum + (l.mandats_wert || 0), 0),
    [leads]
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Lädt...</div>;
  }

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      updateLead.mutate({ id: leadId, status: targetStatus });
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Pipeline: <strong className="text-foreground">{formatCurrency(totalPipeline)}</strong></span>
          <span className="text-muted-foreground">Mandate: <strong className="text-success">{formatCurrency(totalMandate)}</strong></span>
          <span className="text-muted-foreground">Verloren: <strong className="text-destructive">{closedLeads.kalt.length}</strong></span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {columns.map(col => (
          <div
            key={col.status}
            className="flex flex-col w-64 shrink-0 rounded-lg bg-muted/30 border border-border"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, col.status)}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <StatusBadge status={col.status} />
                <span className="text-xs text-muted-foreground font-medium">{col.leads.length}</span>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {col.leads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={e => handleDragStart(e, lead.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <LeadCard lead={lead} />
                </div>
              ))}
              {col.leads.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Keine Leads</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
