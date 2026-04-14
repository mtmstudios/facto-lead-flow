import { useParams, useNavigate } from 'react-router-dom';
import { useLead, useLeadAktivitaeten, useUpdateLead, useDeleteLead, useCreateAktivitaet } from '@/hooks/useLeads';
import { StatusBadge, PrioBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LEAD_STATUSES, LEAD_PRIORITAETEN, AKTIVITAET_TYPEN, ENTWICKLUNGSAUFWAND_OPTIONS, MA_ENTWICKLUNG_OPTIONS, formatCurrency, formatDateTime, berechneFoerderfaehigkeit, FOERDERFAEHIGKEIT_LABELS, type Foerderfaehigkeit } from '@/lib/constants';
import { ArrowLeft, Phone, Mail, Trash2, PhoneCall, MailIcon, FileText, RotateCcw, Calendar, Building2, Globe, MapPin, User, DollarSign, Tag, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const ICON_MAP: Record<string, React.ElementType> = {
  'Anruf': PhoneCall, 'E-Mail': MailIcon, 'Notiz': FileText, 'Statusänderung': RotateCcw, 'Termin': Calendar, 'Fragenkatalog': FileText,
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function BoolField({ label, field, value, onUpdate }: { label: string; field: string; value: boolean | null; onUpdate: (field: string, value: boolean | null) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-0">
      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{label}</p>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onUpdate(field, true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            value === true
              ? 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/20'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <CheckCircle2 className="h-3 w-3" />
          Ja
        </button>
        <button
          onClick={() => onUpdate(field, false)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            value === false
              ? 'bg-red-500/15 text-red-500 ring-1 ring-red-500/20'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <XCircle className="h-3 w-3" />
          Nein
        </button>
      </div>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: lead, isLoading } = useLead(id);
  const { data: aktivitaeten = [] } = useLeadAktivitaeten(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createAktivitaet = useCreateAktivitaet();

  const [aktTyp, setAktTyp] = useState('Notiz');
  const [aktBeschreibung, setAktBeschreibung] = useState('');
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const ff = lead ? berechneFoerderfaehigkeit(lead) : 'unbekannt' as Foerderfaehigkeit;
  const ffInfo = FOERDERFAEHIGKEIT_LABELS[ff];

  const leadScore = useMemo(() => {
    if (!lead) return 0;
    let score = 0;
    if (lead.email) score += 10;
    if (lead.telefon) score += 10;
    if (lead.unternehmen) score += 8;
    if (lead.mitarbeiter) score += 8;
    if (lead.entwicklung) score += 8;
    if (lead.rechner_ergebnis && lead.rechner_ergebnis > 0) score += 12;
    if (lead.steuerpflichtig_de !== null) score += 6;
    if (lead.unternehmen_schwierigkeiten !== null) score += 6;
    if (lead.wissenschaftliche_risiken !== null) score += 6;
    if (lead.reine_produktentwicklung !== null) score += 6;
    if (ff === 'gruen') score += 20;
    else if (ff === 'gelb') score += 10;
    if (lead.status === 'Mandat') score = 100;
    else if (lead.status === 'Qualifiziert') score = Math.max(score, 85);
    return Math.min(score, 100);
  }, [lead, ff]);

  const scoreColor = leadScore >= 70 ? '#22C55E' : leadScore >= 40 ? '#F59E0B' : '#EF4444';

  if (isLoading || !lead) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-48 skeleton-shimmer rounded-xl" />
            <div className="h-64 skeleton-shimmer rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 skeleton-shimmer rounded-xl" />
            <div className="h-48 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  const handleStatusChange = (status: string) => {
    const oldStatus = lead.status;
    updateLead.mutate({ id: lead.id, status });
    createAktivitaet.mutate({ lead_id: lead.id, typ: 'Statusänderung', beschreibung: `Status geändert: ${oldStatus} → ${status}`, erstellt_von: user?.email || 'System' });
  };

  const handleSaveAktivitaet = () => {
    if (!aktBeschreibung.trim()) return;
    createAktivitaet.mutate({ lead_id: lead.id, typ: aktTyp, beschreibung: aktBeschreibung, erstellt_von: user?.email || 'System' });
    setAktBeschreibung('');
  };

  const handleInlineEdit = (field: string, value: string | number | boolean | null) => {
    updateLead.mutate({ id: lead.id, [field]: value });
    setEditField(null);
  };

  const handleDelete = () => {
    deleteLead.mutate(lead.id, { onSuccess: () => navigate('/leads') });
  };

  const InlineField = ({ label, field, value, type = 'text', icon: Icon }: { label: string; field: string; value: string | number | null; type?: string; icon?: React.ElementType }) => {
    if (editField === field) {
      return (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex gap-2">
            <Input
              type={type}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="h-8 text-sm bg-background/50"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleInlineEdit(field, type === 'number' ? Number(editValue) || null : editValue || null);
                if (e.key === 'Escape') setEditField(null);
              }}
            />
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleInlineEdit(field, type === 'number' ? Number(editValue) || null : editValue || null)}>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div
        className="space-y-1 cursor-pointer group py-1"
        onClick={() => { setEditField(field); setEditValue(String(value || '')); }}
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          {value || <span className="text-muted-foreground/50 italic">Klicken zum Bearbeiten</span>}
        </p>
      </div>
    );
  };

  const ff = berechneFoerderfaehigkeit(lead);
  const ffInfo = FOERDERFAEHIGKEIT_LABELS[ff];

  // Lead Score: 0-100 based on filled fields + qualification
  const leadScore = useMemo(() => {
    let score = 0;
    if (lead.email) score += 10;
    if (lead.telefon) score += 10;
    if (lead.unternehmen) score += 8;
    if (lead.mitarbeiter) score += 8;
    if (lead.entwicklung) score += 8;
    if (lead.rechner_ergebnis && lead.rechner_ergebnis > 0) score += 12;
    if (lead.steuerpflichtig_de !== null) score += 6;
    if (lead.unternehmen_schwierigkeiten !== null) score += 6;
    if (lead.wissenschaftliche_risiken !== null) score += 6;
    if (lead.reine_produktentwicklung !== null) score += 6;
    if (ff === 'gruen') score += 20;
    else if (ff === 'gelb') score += 10;
    if (lead.status === 'Mandat') score = 100;
    else if (lead.status === 'Qualifiziert') score = Math.max(score, 85);
    return Math.min(score, 100);
  }, [lead, ff]);

  const scoreColor = leadScore >= 70 ? '#22C55E' : leadScore >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5 md:space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} className="h-8 w-8 md:h-9 md:w-9 rounded-lg shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {/* Lead Score Ring */}
              <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={scoreColor}
                    strokeWidth="2.5"
                    strokeDasharray={`${leadScore} ${100 - leadScore}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] md:text-xs font-bold" style={{ color: scoreColor }}>{leadScore}</span>
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">{lead.vorname} {lead.nachname}</h1>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {lead.unternehmen || 'Kein Unternehmen'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger><StatusBadge status={lead.status} className="cursor-pointer" /></DropdownMenuTrigger>
                <DropdownMenuContent>{LEAD_STATUSES.map(s => <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>{s}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger><PrioBadge prio={lead.prioritaet} className="cursor-pointer" /></DropdownMenuTrigger>
                <DropdownMenuContent>{LEAD_PRIORITAETEN.map(p => <DropdownMenuItem key={p} onClick={() => updateLead.mutate({ id: lead.id, prioritaet: p })}>{p}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
              {/* Förderfähigkeit Indicator */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                ff === 'gruen' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                ff === 'gelb' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                ff === 'rot' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-muted text-muted-foreground border border-border'
              }`}>
                {ff === 'gruen' && '●'}{ff === 'gelb' && '●'}{ff === 'rot' && '●'}{ff === 'unbekannt' && '○'} {ffInfo.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11 md:ml-0">
          {lead.telefon && (
            <Button variant="outline" size="sm" asChild className="h-8 md:h-9 text-xs md:text-sm">
              <a href={`tel:${lead.telefon}`}><Phone className="h-3.5 w-3.5 md:mr-1.5" /><span className="hidden md:inline">Anrufen</span></a>
            </Button>
          )}
          {lead.email && (
            <Button variant="outline" size="sm" asChild className="h-8 md:h-9 text-xs md:text-sm">
              <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5 md:mr-1.5" /><span className="hidden md:inline">E-Mail</span></a>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-8 md:h-9 text-xs md:text-sm"><Trash2 className="h-3.5 w-3.5 md:mr-1.5" /><span className="hidden md:inline">Löschen</span></Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Lead löschen?</AlertDialogTitle>
                <AlertDialogDescription>Dieser Lead und alle zugehörigen Aktivitäten werden unwiderruflich gelöscht.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>

      {/* Two Columns — stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* On mobile: Info cards first, then timeline */}
        {/* Timeline Column */}
        <div className="lg:col-span-3 space-y-4 md:space-y-5 order-2 lg:order-1">
          {/* Add Activity */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Aktivität hinzufügen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {AKTIVITAET_TYPEN.filter(t => t !== 'Statusänderung').map(t => (
                    <Button
                      key={t}
                      variant={aktTyp === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAktTyp(t)}
                      className="h-7 text-xs"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
                <Textarea
                  placeholder="Was wurde besprochen / erledigt?"
                  value={aktBeschreibung}
                  onChange={e => setAktBeschreibung(e.target.value)}
                  rows={3}
                  className="bg-background/50"
                />
                <Button size="sm" onClick={handleSaveAktivitaet} disabled={!aktBeschreibung.trim()} className="h-8">
                  Speichern
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Aktivitäten ({aktivitaeten.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {aktivitaeten.map((akt, i) => {
                    const Icon = ICON_MAP[akt.typ] || FileText;
                    return (
                      <motion.div
                        key={akt.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex gap-3 px-5 py-3.5 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          {i < aktivitaeten.length - 1 && (
                            <div className="w-px flex-1 bg-border/50 min-h-[8px]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{akt.typ}</span>
                            <span className="text-[11px] text-muted-foreground">{formatDateTime(akt.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{akt.beschreibung}</p>
                          {akt.erstellt_von && <p className="text-[11px] text-muted-foreground/70 mt-1">von {akt.erstellt_von}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                  {aktivitaeten.length === 0 && (
                    <p className="px-5 py-12 text-center text-sm text-muted-foreground">Noch keine Aktivitäten</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Info Cards Column — shows first on mobile */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5 order-1 lg:order-2">
          {/* Contact Data */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Kontaktdaten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InlineField label="E-Mail" field="email" value={lead.email} type="email" icon={Mail} />
                <InlineField label="Telefon" field="telefon" value={lead.telefon} icon={Phone} />
                <InlineField label="Unternehmen" field="unternehmen" value={lead.unternehmen} icon={Building2} />
                <InlineField label="Position" field="position_titel" value={lead.position_titel} icon={User} />
                <InlineField label="Adresse" field="adresse" value={lead.adresse} icon={MapPin} />
                <div className="grid grid-cols-2 gap-3">
                  <InlineField label="PLZ" field="plz" value={lead.plz} />
                  <InlineField label="Ort" field="ort" value={lead.ort} />
                </div>
                <InlineField label="Homepage" field="homepage" value={lead.homepage} icon={Globe} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Qualification */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Qualifizierung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="py-1"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mitarbeiterzahl</p><p className="text-sm">{lead.mitarbeiter || '–'}</p></div>
                <div className="py-1"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Entwicklungsaktivität</p><p className="text-sm">{lead.entwicklung || '–'}</p></div>
                <div className="py-1"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Branche</p><p className="text-sm">{lead.branche || '–'}</p></div>
                <div className="py-1 pt-2 border-t border-border/30">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Förderpotenzial</p>
                  <p className="text-2xl font-extrabold gradient-text mt-1">{formatCurrency(lead.rechner_ergebnis)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Source & Tracking */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Quelle & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="py-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quelle</p>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground mt-1">
                    {lead.quelle || '–'}
                  </span>
                </div>
                {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content) && (
                  <div className="space-y-1.5 py-1 text-xs">
                    {lead.utm_source && <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="font-medium">{lead.utm_source}</span></div>}
                    {lead.utm_medium && <div className="flex justify-between"><span className="text-muted-foreground">Medium</span><span className="font-medium">{lead.utm_medium}</span></div>}
                    {lead.utm_campaign && <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="font-medium">{lead.utm_campaign}</span></div>}
                    {lead.utm_content && <div className="flex justify-between"><span className="text-muted-foreground">Content</span><span className="font-medium">{lead.utm_content}</span></div>}
                  </div>
                )}
                <div className="py-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Erstellt am</p>
                  <p className="flex items-center gap-1.5 mt-0.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" />{formatDateTime(lead.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" /> Vertrieb
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InlineField label="Zugewiesen an" field="zugewiesen_an" value={lead.zugewiesen_an} icon={User} />
                <InlineField label="Kontaktiert am" field="kontaktiert_am" value={lead.kontaktiert_am ? new Date(lead.kontaktiert_am).toLocaleDateString('de-DE') : null} type="datetime-local" icon={Calendar} />
                <InlineField label="Termin am" field="termin_am" value={lead.termin_am ? new Date(lead.termin_am).toLocaleDateString('de-DE') : null} type="datetime-local" icon={Calendar} />
                <InlineField label="Mandatswert (€)" field="mandats_wert" value={lead.mandats_wert} type="number" icon={DollarSign} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Fragenkatalog */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ersteinschätzung — Fragenkatalog</CardTitle>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                ff === 'gruen' ? 'bg-emerald-500/10 text-emerald-500' :
                ff === 'gelb' ? 'bg-amber-500/10 text-amber-400' :
                ff === 'rot' ? 'bg-red-500/10 text-red-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {ff === 'gruen' && '●'}{ff === 'gelb' && '●'}{ff === 'rot' && '●'}{ff === 'unbekannt' && '○'} {ffInfo.label}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <BoolField label="Ist das Unternehmen in Deutschland steuerpflichtig?" field="steuerpflichtig_de" value={lead.steuerpflichtig_de} onUpdate={handleInlineEdit} />
                <BoolField label="Ist das Unternehmen in Schwierigkeiten? (mind. halbes EK aufgebraucht)" field="unternehmen_schwierigkeiten" value={lead.unternehmen_schwierigkeiten} onUpdate={handleInlineEdit} />
                <BoolField label="Gibt es verbundene Unternehmen (Konzernstruktur)?" field="verbundene_unternehmen" value={lead.verbundene_unternehmen} onUpdate={handleInlineEdit} />
                <BoolField label="Handelt es sich um eine reine Produktentwicklung?" field="reine_produktentwicklung" value={lead.reine_produktentwicklung} onUpdate={handleInlineEdit} />
                <BoolField label="Bestehen wissenschaftliche/methodische Risiken?" field="wissenschaftliche_risiken" value={lead.wissenschaftliche_risiken} onUpdate={handleInlineEdit} />
                <BoolField label="Arbeiten Auftragnehmer mit (nicht routinemäßig)?" field="auftragnehmer_beteiligt" value={lead.auftragnehmer_beteiligt} onUpdate={handleInlineEdit} />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Herausforderungen der Entwicklung</p>
                  <Textarea
                    value={lead.entwicklung_herausforderungen || ''}
                    placeholder="Welche Herausforderungen sollen bewältigt werden?"
                    rows={3}
                    className="text-sm bg-background/50"
                    onBlur={e => { if (e.target.value !== (lead.entwicklung_herausforderungen || '')) handleInlineEdit('entwicklung_herausforderungen', e.target.value || null); }}
                    onChange={() => {}}
                    defaultValue={lead.entwicklung_herausforderungen || ''}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Entwicklungsplan / Meilensteine</p>
                  <Textarea
                    value={lead.entwicklungsplan || ''}
                    placeholder="Arbeitsplan, Meilensteine..."
                    rows={2}
                    className="text-sm bg-background/50"
                    onBlur={e => { if (e.target.value !== (lead.entwicklungsplan || '')) handleInlineEdit('entwicklungsplan', e.target.value || null); }}
                    onChange={() => {}}
                    defaultValue={lead.entwicklungsplan || ''}
                  />
                </div>
                {lead.auftragnehmer_beteiligt && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Aufgabe der Auftragnehmer</p>
                    <Textarea
                      placeholder="Was ist die Aufgabenstellung?"
                      rows={2}
                      className="text-sm bg-background/50"
                      onBlur={e => { if (e.target.value !== (lead.auftragnehmer_aufgabe || '')) handleInlineEdit('auftragnehmer_aufgabe', e.target.value || null); }}
                      onChange={() => {}}
                      defaultValue={lead.auftragnehmer_aufgabe || ''}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Entwicklungsaufwand (letzte 4 Jahre)</p>
                  <Select value={lead.entwicklungsaufwand_4j || ''} onValueChange={v => handleInlineEdit('entwicklungsaufwand_4j', v)}>
                    <SelectTrigger className="text-sm bg-background/50"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                    <SelectContent>
                      {ENTWICKLUNGSAUFWAND_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mitarbeiter in Entwicklung eingesetzt</p>
                  <Select value={lead.ma_in_entwicklung || ''} onValueChange={v => handleInlineEdit('ma_in_entwicklung', v)}>
                    <SelectTrigger className="text-sm bg-background/50"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                    <SelectContent>
                      {MA_ENTWICKLUNG_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notizen */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" /> Notizen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Freitext-Notizen..."
              rows={4}
              className="text-sm bg-background/50"
              onBlur={e => { if (e.target.value !== (lead.notizen || '')) handleInlineEdit('notizen', e.target.value || null); }}
              onChange={() => {}}
              defaultValue={lead.notizen || ''}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
