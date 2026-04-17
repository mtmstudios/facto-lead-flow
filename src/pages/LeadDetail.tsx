import { useParams, useNavigate } from 'react-router-dom';
import { useLead, useLeadAktivitaeten, useUpdateLead, useDeleteLead, useCreateAktivitaet } from '@/hooks/useLeads';
import { StatusBadge, PrioBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DROPDOWN_STATUSES, LEAD_PRIORITAETEN, AKTIVITAET_TYPEN, ENTWICKLUNGSAUFWAND_OPTIONS, MA_ENTWICKLUNG_OPTIONS, formatCurrency, formatDateTime, berechneFoerderfaehigkeit, FOERDERFAEHIGKEIT_LABELS, type Foerderfaehigkeit } from '@/lib/constants';
import { ArrowLeft, Phone, Mail, Trash2, PhoneCall, MailIcon, FileText, RotateCcw, Calendar, Building2, Globe, MapPin, User, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const ICON_MAP: Record<string, React.ElementType> = {
  'Anruf': PhoneCall, 'E-Mail': MailIcon, 'Notiz': FileText, 'Statusänderung': RotateCcw, 'Termin': Calendar, 'Fragenkatalog': FileText,
};

type Tab = 'uebersicht' | 'fragenkatalog' | 'aktivitaeten';

function BoolField({ label, field, value, onUpdate }: { label: string; field: string; value: boolean | null; onUpdate: (field: string, value: boolean | null) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/30 last:border-0">
      <p className="text-sm text-foreground/80 flex-1 leading-relaxed">{label}</p>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onUpdate(field, true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === true
              ? 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ja
        </button>
        <button
          onClick={() => onUpdate(field, false)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === false
              ? 'bg-red-500/15 text-red-600 ring-1 ring-red-500/20'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
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

  const [activeTab, setActiveTab] = useState<Tab>('uebersicht');
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 skeleton-shimmer" />
        <div className="h-48 skeleton-shimmer rounded-xl" />
        <div className="h-64 skeleton-shimmer rounded-xl" />
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

  const InlineField = ({ label, field, value, type = 'text' }: { label: string; field: string; value: string | number | null; type?: string }) => {
    if (editField === field) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">{label}</span>
          <Input
            type={type}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleInlineEdit(field, type === 'number' ? Number(editValue) || null : editValue || null);
              if (e.key === 'Escape') setEditField(null);
            }}
          />
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleInlineEdit(field, type === 'number' ? Number(editValue) || null : editValue || null)}>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </Button>
        </div>
      );
    }
    return (
      <div
        className="flex items-center gap-2 cursor-pointer group py-0.5"
        onClick={() => { setEditField(field); setEditValue(String(value || '')); }}
      >
        <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">{label}</span>
        <span className="text-sm group-hover:text-primary transition-colors truncate">
          {value || <span className="text-muted-foreground/40 italic">–</span>}
        </span>
      </div>
    );
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'uebersicht', label: 'Übersicht' },
    { key: 'fragenkatalog', label: 'Fragenkatalog' },
    { key: 'aktivitaeten', label: 'Aktivitäten', count: aktivitaeten.length },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full min-w-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {/* Mobile: stacked layout, Desktop: side by side */}
        <div className="space-y-3 md:space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} className="h-9 w-9 rounded-lg shrink-0 mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Score */}
                  <div className="relative h-10 w-10 md:h-11 md:w-11 shrink-0">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke={scoreColor} strokeWidth="2.5"
                        strokeDasharray={`${leadScore} ${100 - leadScore}`} strokeLinecap="round"
                        className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: scoreColor }}>{leadScore}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base md:text-xl font-black tracking-tight truncate">{lead.vorname} {lead.nachname}</h1>
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                      <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                      <span className="truncate">{lead.unternehmen || 'Kein Unternehmen'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 mt-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger><StatusBadge status={lead.status} className="cursor-pointer" /></DropdownMenuTrigger>
                    <DropdownMenuContent>{DROPDOWN_STATUSES.map(s => <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>{s}</DropdownMenuItem>)}</DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger><PrioBadge prio={lead.prioritaet} className="cursor-pointer" /></DropdownMenuTrigger>
                    <DropdownMenuContent>{LEAD_PRIORITAETEN.map(p => <DropdownMenuItem key={p} onClick={() => updateLead.mutate({ id: lead.id, prioritaet: p })}>{p}</DropdownMenuItem>)}</DropdownMenuContent>
                  </DropdownMenu>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${
                    ff === 'gruen' ? 'bg-emerald-500/10 text-emerald-600' :
                    ff === 'gelb' ? 'bg-amber-500/10 text-amber-600' :
                    ff === 'rot' ? 'bg-red-500/10 text-red-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {ffInfo.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {lead.telefon && (
                <Button variant="outline" size="sm" asChild className="h-8 md:h-9 px-2 md:px-3">
                  <a href={`tel:${lead.telefon}`}><Phone className="h-4 w-4 md:mr-1.5" /><span className="hidden md:inline">Anrufen</span></a>
                </Button>
              )}
              {lead.email && (
                <Button variant="outline" size="sm" asChild className="h-8 md:h-9 px-2 md:px-3">
                  <a href={`mailto:${lead.email}`}><Mail className="h-4 w-4 md:mr-1.5" /><span className="hidden md:inline">E-Mail</span></a>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-8 md:h-9 px-2 md:px-3"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lead löschen?</AlertDialogTitle>
                    <AlertDialogDescription>Dieser Lead und alle Aktivitäten werden unwiderruflich gelöscht.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 md:gap-1 border-b border-border/50 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 md:px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 md:ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="detail-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab: Übersicht */}
      {activeTab === 'uebersicht' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Kontakt + Qualifizierung in einer Card */}
          <Card className="glass-card">
            <CardContent className="p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kontaktdaten */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold mb-3">Kontaktdaten</h3>
                  <InlineField label="Vorname" field="vorname" value={lead.vorname} />
                  <InlineField label="Nachname" field="nachname" value={lead.nachname} />
                  <InlineField label="E-Mail" field="email" value={lead.email} type="email" />
                  <InlineField label="Telefon" field="telefon" value={lead.telefon} />
                  <InlineField label="Unternehmen" field="unternehmen" value={lead.unternehmen} />
                  <InlineField label="Position" field="position_titel" value={lead.position_titel} />
                  <InlineField label="Adresse" field="adresse" value={lead.adresse} />
                  <InlineField label="PLZ / Ort" field="plz" value={lead.plz && lead.ort ? `${lead.plz} ${lead.ort}` : lead.plz || lead.ort} />
                  <InlineField label="Homepage" field="homepage" value={lead.homepage} />
                </div>
                {/* Qualifizierung + Vertrieb */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold mb-3">Qualifizierung</h3>
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">Mitarbeiter</span>
                    <span className="text-sm">{lead.mitarbeiter || '–'}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">Entwicklung</span>
                    <span className="text-sm">{lead.entwicklung || '–'}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">Branche</span>
                    <span className="text-sm">{lead.branche || '–'}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">Quelle</span>
                    <span className="text-sm">{lead.quelle || '–'}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="text-xs md:text-sm text-muted-foreground w-20 md:w-28 shrink-0">Erstellt</span>
                    <span className="text-sm text-muted-foreground">{formatDateTime(lead.created_at)}</span>
                  </div>
                  {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
                    <div className="pt-3 mt-3 border-t border-border/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs md:text-sm text-muted-foreground">Rechner-Schätzung</span>
                          <p className="text-[10px] text-muted-foreground/40 mt-0.5">Indikativ, kein verbindlicher Wert</p>
                        </div>
                        <span className="text-base font-semibold text-muted-foreground num">{formatCurrency(lead.rechner_ergebnis)}</span>
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <h3 className="text-sm font-bold mb-2 mt-3">Vertrieb</h3>
                    <InlineField label="Zugewiesen" field="zugewiesen_an" value={lead.zugewiesen_an} />
                    <InlineField label="Kontaktiert" field="kontaktiert_am" value={lead.kontaktiert_am ? new Date(lead.kontaktiert_am).toLocaleDateString('de-DE') : null} type="datetime-local" />
                    <InlineField label="Termin" field="termin_am" value={lead.termin_am ? new Date(lead.termin_am).toLocaleDateString('de-DE') : null} type="datetime-local" />
                    <InlineField label="Mandatswert" field="mandats_wert" value={lead.mandats_wert} type="number" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notizen */}
          <Card className="glass-card">
            <CardContent className="p-5 md:p-6">
              <h3 className="text-sm font-bold mb-3">Notizen</h3>
              <Textarea
                placeholder="Freitext-Notizen..."
                rows={3}
                className="text-sm"
                onBlur={e => { if (e.target.value !== (lead.notizen || '')) handleInlineEdit('notizen', e.target.value || null); }}
                onChange={() => {}}
                defaultValue={lead.notizen || ''}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tab: Fragenkatalog */}
      {activeTab === 'fragenkatalog' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="glass-card">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold">Ersteinschätzung</h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  ff === 'gruen' ? 'bg-emerald-500/10 text-emerald-600' :
                  ff === 'gelb' ? 'bg-amber-500/10 text-amber-600' :
                  ff === 'rot' ? 'bg-red-500/10 text-red-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {ffInfo.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-0">
                  <BoolField label="Unternehmen in Deutschland steuerpflichtig?" field="steuerpflichtig_de" value={lead.steuerpflichtig_de} onUpdate={handleInlineEdit} />
                  <BoolField label="Unternehmen in Schwierigkeiten?" field="unternehmen_schwierigkeiten" value={lead.unternehmen_schwierigkeiten} onUpdate={handleInlineEdit} />
                  <BoolField label="Verbundene Unternehmen?" field="verbundene_unternehmen" value={lead.verbundene_unternehmen} onUpdate={handleInlineEdit} />
                  <BoolField label="Reine Produktentwicklung?" field="reine_produktentwicklung" value={lead.reine_produktentwicklung} onUpdate={handleInlineEdit} />
                  <BoolField label="Wissenschaftliche Risiken?" field="wissenschaftliche_risiken" value={lead.wissenschaftliche_risiken} onUpdate={handleInlineEdit} />
                  <BoolField label="Auftragnehmer beteiligt?" field="auftragnehmer_beteiligt" value={lead.auftragnehmer_beteiligt} onUpdate={handleInlineEdit} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">Herausforderungen</label>
                    <Textarea
                      placeholder="Welche Herausforderungen?"
                      rows={3}
                      className="text-sm"
                      onBlur={e => { if (e.target.value !== (lead.entwicklung_herausforderungen || '')) handleInlineEdit('entwicklung_herausforderungen', e.target.value || null); }}
                      onChange={() => {}}
                      defaultValue={lead.entwicklung_herausforderungen || ''}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">Entwicklungsplan</label>
                    <Textarea
                      placeholder="Meilensteine..."
                      rows={2}
                      className="text-sm"
                      onBlur={e => { if (e.target.value !== (lead.entwicklungsplan || '')) handleInlineEdit('entwicklungsplan', e.target.value || null); }}
                      onChange={() => {}}
                      defaultValue={lead.entwicklungsplan || ''}
                    />
                  </div>
                  {lead.auftragnehmer_beteiligt && (
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1.5">Aufgabe der Auftragnehmer</label>
                      <Textarea
                        placeholder="Aufgabenstellung?"
                        rows={2}
                        className="text-sm"
                        onBlur={e => { if (e.target.value !== (lead.auftragnehmer_aufgabe || '')) handleInlineEdit('auftragnehmer_aufgabe', e.target.value || null); }}
                        onChange={() => {}}
                        defaultValue={lead.auftragnehmer_aufgabe || ''}
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">Entwicklungsaufwand (4 Jahre)</label>
                    <Select value={lead.entwicklungsaufwand_4j || ''} onValueChange={v => handleInlineEdit('entwicklungsaufwand_4j', v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                      <SelectContent>
                        {ENTWICKLUNGSAUFWAND_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1.5">MA in Entwicklung</label>
                    <Select value={lead.ma_in_entwicklung || ''} onValueChange={v => handleInlineEdit('ma_in_entwicklung', v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
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
      )}

      {/* Tab: Aktivitäten */}
      {activeTab === 'aktivitaeten' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Neue Aktivität */}
          <Card className="glass-card">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold mb-3">Aktivität hinzufügen</h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {AKTIVITAET_TYPEN.filter(t => t !== 'Statusänderung').map(t => (
                  <Button
                    key={t}
                    variant={aktTyp === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAktTyp(t)}
                    className="h-8 text-xs"
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
                className="text-sm resize-none w-full min-w-0"
              />
              <Button size="sm" onClick={handleSaveAktivitaet} disabled={!aktBeschreibung.trim()} className="h-9 mt-3">
                Speichern
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {aktivitaeten.map((akt, i) => {
                  const Icon = ICON_MAP[akt.typ] || FileText;
                  return (
                    <div key={akt.id} className="flex gap-3 px-5 py-4">
                      <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{akt.typ}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(akt.created_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{akt.beschreibung}</p>
                        {akt.erstellt_von && <p className="text-xs text-muted-foreground/60 mt-1">von {akt.erstellt_von}</p>}
                      </div>
                    </div>
                  );
                })}
                {aktivitaeten.length === 0 && (
                  <p className="px-5 py-12 text-center text-sm text-muted-foreground">Noch keine Aktivitäten</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
