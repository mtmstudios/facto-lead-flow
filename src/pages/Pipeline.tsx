import { useMemo, useState } from 'react';
import { useLeads, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { formatRelativeTime } from '@/lib/constants';
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
import { Building2, AlertTriangle } from 'lucide-react';

/* ── 5 vereinfachte Pipeline-Stufen ── */
const PIPELINE_COLUMNS = [
  { key: 'Neu', label: 'Neu', color: '#3B82F6', statuses: ['Neu', 'Mail gesendet'] },
  { key: 'Kontaktiert', label: 'Kontaktiert', color: '#F59E0B', statuses: ['Kontaktiert'] },
  { key: 'Gespräch', label: 'Gespräch', color: '#F97316', statuses: ['Erstgespräch geplant', 'Erstgespräch durchgeführt'] },
  { key: 'Qualifiziert', label: 'Qualifiziert', color: '#8B5CF6', statuses: ['Fragenkatalog gesendet', 'Fragenkatalog beantwortet', 'Qualifiziert'] },
  { key: 'Mandat', label: 'Mandat', color: '#22C55E', statuses: ['Mandat'] },
];

// Mapping: column key → welcher Status wird beim Drop gesetzt
const DROP_STATUS: Record<string, string> = {
  'Neu': 'Neu',
  'Kontaktiert': 'Kontaktiert',
  'Gespräch': 'Erstgespräch geplant',
  'Qualifiziert': 'Qualifiziert',
  'Mandat': 'Mandat',
};

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
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
        className={`lead-card p-3 ${isDragging ? 'dragging' : ''} ${isOverdue ? 'border-destructive/30' : ''}`}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-start justify-between gap-2" onClick={() => navigate(`/leads/${lead.id}`)}>
          <div className="min-w-0 cursor-pointer flex-1">
            <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
              {lead.vorname} {lead.nachname}
            </p>
            {lead.unternehmen && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                {lead.unternehmen}
              </p>
            )}
          </div>
          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
        </div>

      </div>
    </div>
  );
}

function LeadCardOverlay({ lead }: { lead: Lead }) {
  return (
    <div className="drag-overlay w-[260px]">
      <div className="lead-card p-3 bg-card border border-primary/20">
        <p className="text-sm font-semibold">{lead.vorname} {lead.nachname}</p>
        {lead.unternehmen && <p className="text-xs text-muted-foreground mt-0.5">{lead.unternehmen}</p>}
      </div>
    </div>
  );
}

function DroppableColumn({ columnKey, label, color, leads: columnLeads }: {
  columnKey: string; label: string; color: string; leads: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey });

  return (
    <div
      ref={setNodeRef}
      className={`pipeline-column flex flex-col flex-1 min-w-[240px] md:min-w-[180px] snap-center ${isOver ? 'drag-over' : ''}`}
    >
      {/* Column Header */}
      <div className="px-3 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm font-bold">{label}</span>
          </div>
          <span className="text-xs font-bold num bg-muted/60 rounded-full px-2 py-0.5 text-muted-foreground">
            {columnLeads.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
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
          <div className={`flex items-center justify-center py-12 rounded-lg border border-dashed transition-all ${
            isOver ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/30'
          }`}>
            <p className="text-xs text-muted-foreground/50">
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

  // Leads den 5 Spalten zuordnen
  const columns = useMemo(() => PIPELINE_COLUMNS.map(col => ({
    ...col,
    leads: leads.filter(l => col.statuses.includes(l.status)),
  })), [leads]);

  const activeLead = useMemo(() => leads.find(l => l.id === activeId), [leads, activeId]);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const targetColumn = over.id as string;
      const targetStatus = DROP_STATUS[targetColumn];
      if (targetStatus) {
        // Nicht updaten wenn Lead bereits in dieser Spalte ist
        const currentLead = leads.find(l => l.id === active.id);
        const targetCol = PIPELINE_COLUMNS.find(c => c.key === targetColumn);
        if (currentLead && targetCol && !targetCol.statuses.includes(currentLead.status)) {
          updateLead.mutate({ id: active.id as string, status: targetStatus });
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => <div key={i} className="flex-1 min-w-[180px] h-[400px] skeleton-shimmer shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Pipeline</h1>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="hidden md:inline">Drag & Drop zum Verschieben</span>
            <span className="md:hidden">Halten & Ziehen</span>
          </p>
        </div>
      </motion.div>

      {/* Kanban Board — 5 Spalten */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scrollbar-hide"
          style={{ minHeight: 'calc(100vh - 220px)' }}
        >
          {columns.map(col => (
            <DroppableColumn
              key={col.key}
              columnKey={col.key}
              label={col.label}
              color={col.color}
              leads={col.leads}
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
