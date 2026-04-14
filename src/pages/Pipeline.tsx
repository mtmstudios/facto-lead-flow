import { useMemo, useState } from 'react';
import { useLeads, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { PrioBadge } from '@/components/Badges';
import { LEAD_STATUSES, formatCurrency, formatRelativeTime, berechneFoerderfaehigkeit, FOERDERFAEHIGKEIT_LABELS } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Building2, DollarSign, Clock, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';

const PIPELINE_STATUSES = [
  'Neu', 'Mail gesendet', 'Kontaktiert', 'Erstgespräch geplant',
  'Erstgespräch durchgeführt', 'Fragenkatalog gesendet', 'Fragenkatalog beantwortet',
  'Qualifiziert', 'Mandat'
];

const STATUS_COLORS: Record<string, string> = {
  'Neu': 'bg-teal-500',
  'Mail gesendet': 'bg-sky-500',
  'Kontaktiert': 'bg-amber-500',
  'Erstgespräch geplant': 'bg-orange-500',
  'Erstgespräch durchgeführt': 'bg-orange-400',
  'Fragenkatalog gesendet': 'bg-indigo-500',
  'Fragenkatalog beantwortet': 'bg-indigo-400',
  'Qualifiziert': 'bg-purple-500',
  'Mandat': 'bg-emerald-500',
};

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const ff = berechneFoerderfaehigkeit(lead);
  const ffInfo = FOERDERFAEHIGKEIT_LABELS[ff];
  const daysSince = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
  const isOverdue = daysSince > 3 && lead.status === 'Neu';

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    transition: isDragging ? undefined : 'opacity 0.2s ease',
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className={`lead-card p-3 space-y-2.5 ${isDragging ? 'dragging' : ''} ${isOverdue ? 'border-destructive/30' : ''}`}
        {...listeners}
        {...attributes}
      >
        {/* Drag Handle + Name */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 opacity-0 group-hover:opacity-100 md:transition-opacity shrink-0 text-muted-foreground hidden md:block">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0" onClick={() => navigate(`/leads/${lead.id}`)}>
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors">
                  {lead.vorname} {lead.nachname}
                </p>
                {lead.unternehmen && (
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {lead.unternehmen}
                  </p>
                )}
              </div>
              <PrioBadge prio={lead.prioritaet} />
            </div>
          </div>
        </div>

        {/* Funding Potential */}
        {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
          <div className="flex items-center gap-1.5 pl-5">
            <DollarSign className="h-3 w-3 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary">{formatCurrency(lead.rechner_ergebnis)}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pl-5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(lead.created_at)}
          </span>
          <div className="flex items-center gap-1.5">
            {ff !== 'unbekannt' && (
              <span className={`text-[11px] font-medium ${ffInfo.color}`}>
                {ff === 'gruen' && '●'}{ff === 'gelb' && '●'}{ff === 'rot' && '●'}
              </span>
            )}
          </div>
        </div>

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="flex items-center gap-1.5 pl-5 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[11px] font-medium">Überfällig ({daysSince}d)</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCardOverlay({ lead }: { lead: Lead }) {
  return (
    <div className="drag-overlay w-[240px]">
      <div className="lead-card p-3 bg-card border border-primary/20">
        <p className="text-sm font-medium">{lead.vorname} {lead.nachname}</p>
        {lead.unternehmen && <p className="text-xs text-muted-foreground">{lead.unternehmen}</p>}
        {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
          <p className="text-sm font-semibold text-primary mt-1">{formatCurrency(lead.rechner_ergebnis)}</p>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ status, leads: columnLeads, isOver, convRate }: { status: string; leads: Lead[]; isOver: boolean; convRate?: number }) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({ id: status });
  const active = isOver || dndIsOver;
  const columnValue = columnLeads.reduce((sum, l) => sum + (l.rechner_ergebnis || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`pipeline-column flex flex-col w-[240px] md:w-[272px] shrink-0 snap-start ${active ? 'drag-over' : ''}`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status] || 'bg-gray-500'}`} />
            <span className="text-xs font-semibold truncate">{status}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5 tabular-nums">
            {columnLeads.length}
          </span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          {columnValue > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {formatCurrency(columnValue)}
            </p>
          )}
          {convRate !== undefined && convRate > 0 && (
            <span className={`text-[10px] font-semibold tabular-nums ${
              convRate >= 70 ? 'text-emerald-500' : convRate >= 40 ? 'text-amber-500' : 'text-red-400'
            }`}>
              {convRate}% Conv.
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {columnLeads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DraggableLeadCard lead={lead} />
            </motion.div>
          ))}
        </AnimatePresence>
        {columnLeads.length === 0 && (
          <div className={`flex items-center justify-center py-8 rounded-lg border border-dashed transition-colors ${
            active ? 'border-primary/30 bg-primary/[0.03]' : 'border-border/50'
          }`}>
            <p className="text-xs text-muted-foreground">
              {active ? 'Hier ablegen' : 'Keine Leads'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const columns = useMemo(() => {
    return PIPELINE_STATUSES.map(status => ({
      status,
      leads: leads.filter(l => l.status === status),
    }));
  }, [leads]);

  const activeLead = useMemo(() => leads.find(l => l.id === activeId), [leads, activeId]);

  const closedLeads = useMemo(() =>
    leads.filter(l => l.status === 'Kalt' || l.status === 'Nicht förderfähig' || l.status === 'Disqualifiziert'),
    [leads]
  );

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

  // Conversion rates between columns — must be before early return (Rules of Hooks)
  const conversionRates = useMemo(() => {
    const rates: Record<string, number> = {};
    for (let i = 1; i < columns.length; i++) {
      const curr = columns[i];
      const atOrPast = PIPELINE_STATUSES.slice(i);
      const atOrPastPrev = PIPELINE_STATUSES.slice(i - 1);
      const countPrev = leads.filter(l => atOrPastPrev.includes(l.status)).length;
      const countCurr = leads.filter(l => atOrPast.includes(l.status)).length;
      rates[curr.status] = countPrev > 0 ? Math.round((countCurr / countPrev) * 100) : 0;
    }
    return rates;
  }, [columns, leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const targetStatus = over.id as string;
      if (PIPELINE_STATUSES.includes(targetStatus)) {
        updateLead.mutate({ id: active.id as string, status: targetStatus });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[272px] h-[400px] skeleton-shimmer shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            <span className="hidden md:inline">Leads per Drag & Drop durch die Pipeline bewegen</span>
            <span className="md:hidden">Tippen & Halten zum Verschieben</span>
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-5 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden md:block" />
            <div className="text-right">
              <p className="text-[10px] md:text-xs text-muted-foreground">Pipeline</p>
              <p className="text-xs md:text-sm font-bold tabular-nums">{formatCurrency(totalPipeline)}</p>
            </div>
          </div>
          <div className="h-6 md:h-8 w-px bg-border shrink-0" />
          <div className="text-right shrink-0">
            <p className="text-[10px] md:text-xs text-muted-foreground">Mandate</p>
            <p className="text-xs md:text-sm font-bold text-emerald-500 tabular-nums">{formatCurrency(totalMandate)}</p>
          </div>
          <div className="h-6 md:h-8 w-px bg-border shrink-0" />
          <div className="text-right shrink-0">
            <p className="text-[10px] md:text-xs text-muted-foreground">Verloren</p>
            <p className="text-xs md:text-sm font-bold text-destructive tabular-nums">{closedLeads.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Pipeline Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-2 md:px-2 snap-x snap-mandatory md:snap-none" style={{ minHeight: 'calc(100vh - 240px)' }}>
          {columns.map(col => (
            <DroppableColumn
              key={col.status}
              status={col.status}
              leads={col.leads}
              isOver={false}
              convRate={conversionRates[col.status]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
