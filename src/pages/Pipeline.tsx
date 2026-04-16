import { useMemo, useState } from 'react';
import { useLeads, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { PrioBadge } from '@/components/Badges';
import { formatCurrency, formatRelativeTime, berechneFoerderfaehigkeit, FOERDERFAEHIGKEIT_LABELS } from '@/lib/constants';
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
import { Building2, Clock, AlertTriangle } from 'lucide-react';

const PIPELINE_STATUSES = [
  'Neu', 'Mail gesendet', 'Kontaktiert', 'Erstgespräch geplant',
  'Erstgespräch durchgeführt', 'Fragenkatalog gesendet', 'Fragenkatalog beantwortet',
  'Qualifiziert', 'Mandat'
];

const STATUS_HEX: Record<string, string> = {
  'Neu': '#14B8A6',
  'Mail gesendet': '#38BDF8',
  'Kontaktiert': '#F59E0B',
  'Erstgespräch geplant': '#F97316',
  'Erstgespräch durchgeführt': '#FB923C',
  'Fragenkatalog gesendet': '#818CF8',
  'Fragenkatalog beantwortet': '#A78BFA',
  'Qualifiziert': '#A855F7',
  'Mandat': '#22C55E',
};

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const ff = berechneFoerderfaehigkeit(lead);
  const ffInfo = FOERDERFAEHIGKEIT_LABELS[ff];
  const daysSince = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
  const isOverdue = daysSince > 3 && lead.status === 'Neu';

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    transition: isDragging ? undefined : 'opacity 0.15s ease',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`lead-card p-3 space-y-2 ${isDragging ? 'dragging' : ''} ${isOverdue ? 'border-destructive/30' : ''}`}
        {...listeners}
        {...attributes}
      >
        {/* Name + Prio */}
        <div className="flex items-start justify-between gap-1" onClick={() => navigate(`/leads/${lead.id}`)}>
          <div className="min-w-0 cursor-pointer">
            <p className="text-[13px] font-semibold truncate hover:text-primary transition-colors">
              {lead.vorname} {lead.nachname}
            </p>
            {lead.unternehmen && (
              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <Building2 className="h-2.5 w-2.5 shrink-0" />
                {lead.unternehmen}
              </p>
            )}
          </div>
          <PrioBadge prio={lead.prioritaet} />
        </div>

        {/* Value + Time */}
        <div className="flex items-center justify-between">
          {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 ? (
            <span className="text-[12px] font-bold text-primary num">{formatCurrency(lead.rechner_ergebnis)}</span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            {ff !== 'unbekannt' && (
              <span className={`text-[9px] ${ffInfo.color}`}>●</span>
            )}
            <span className="text-[10px] text-muted-foreground/60 num">
              {formatRelativeTime(lead.created_at)}
            </span>
          </div>
        </div>

        {isOverdue && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span className="text-[10px] font-semibold">Überfällig</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCardOverlay({ lead }: { lead: Lead }) {
  return (
    <div className="drag-overlay w-[240px]">
      <div className="lead-card p-3 bg-card border border-primary/20 space-y-1">
        <p className="text-[13px] font-semibold">{lead.vorname} {lead.nachname}</p>
        {lead.unternehmen && <p className="text-[10px] text-muted-foreground">{lead.unternehmen}</p>}
        {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
          <p className="text-[12px] font-bold text-primary num">{formatCurrency(lead.rechner_ergebnis)}</p>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ status, leads: columnLeads, convRate }: { status: string; leads: Lead[]; convRate?: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const columnValue = columnLeads.reduce((sum, l) => sum + (l.rechner_ergebnis || 0), 0);
  const color = STATUS_HEX[status] || '#6B7280';

  return (
    <div
      ref={setNodeRef}
      className={`pipeline-column flex flex-col w-[220px] md:w-[260px] shrink-0 snap-start ${isOver ? 'drag-over' : ''}`}
    >
      {/* Column Header */}
      <div className="px-3 py-2.5 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-bold truncate">{status}</span>
          </div>
          <span className="text-[10px] font-bold num rounded-full px-1.5 py-0.5 bg-muted/50 text-muted-foreground">
            {columnLeads.length}
          </span>
        </div>
        {(columnValue > 0 || (convRate !== undefined && convRate > 0)) && (
          <div className="flex items-center gap-2 mt-1 pl-4">
            {columnValue > 0 && (
              <span className="text-[10px] text-muted-foreground/70 num">{formatCurrency(columnValue)}</span>
            )}
            {convRate !== undefined && convRate > 0 && (
              <span className={`text-[9px] font-bold num ${
                convRate >= 70 ? 'text-emerald-400' : convRate >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {convRate}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {columnLeads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <DraggableLeadCard lead={lead} />
            </motion.div>
          ))}
        </AnimatePresence>
        {columnLeads.length === 0 && (
          <div className={`flex items-center justify-center py-10 rounded-lg border border-dashed transition-all ${
            isOver ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/30'
          }`}>
            <p className="text-[10px] text-muted-foreground/50">
              {isOver ? 'Ablegen' : 'Leer'}
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const columns = useMemo(() => PIPELINE_STATUSES.map(status => ({
    status,
    leads: leads.filter(l => l.status === status),
  })), [leads]);

  const activeLead = useMemo(() => leads.find(l => l.id === activeId), [leads, activeId]);

  const totalPipeline = useMemo(() =>
    leads.filter(l => !['Kalt', 'Nicht förderfähig', 'Disqualifiziert', 'Mandat'].includes(l.status))
      .reduce((sum, l) => sum + (l.rechner_ergebnis || 0), 0),
    [leads]);

  const totalMandate = useMemo(() =>
    leads.filter(l => l.status === 'Mandat').reduce((sum, l) => sum + (l.mandats_wert || 0), 0),
    [leads]);

  const closedCount = useMemo(() =>
    leads.filter(l => ['Kalt', 'Nicht förderfähig', 'Disqualifiziert'].includes(l.status)).length,
    [leads]);

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

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

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
        <div className="flex gap-2 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => <div key={i} className="w-[260px] h-[400px] skeleton-shimmer shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Pipeline</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span className="hidden md:inline">Drag & Drop zum Verschieben</span>
            <span className="md:hidden">Halten & Ziehen</span>
          </p>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Pipeline</p>
            <p className="text-sm md:text-base font-black num">{formatCurrency(totalPipeline)}</p>
          </div>
          <div className="h-6 w-px bg-border/50" />
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Mandate</p>
            <p className="text-sm md:text-base font-black text-emerald-400 num">{formatCurrency(totalMandate)}</p>
          </div>
          <div className="h-6 w-px bg-border/50" />
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Verloren</p>
            <p className="text-sm md:text-base font-black text-destructive num">{closedCount}</p>
          </div>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-2 md:px-2 snap-x snap-mandatory md:snap-none"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          {columns.map(col => (
            <DroppableColumn
              key={col.status}
              status={col.status}
              leads={col.leads}
              convRate={conversionRates[col.status]}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
