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
import { ArrowLeft, Phone, Mail, Trash2, PhoneCall, MailIcon, FileText, RotateCcw, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ICON_MAP: Record<string, React.ElementType> = {
  'Anruf': PhoneCall, 'E-Mail': MailIcon, 'Notiz': FileText, 'Statusänderung': RotateCcw, 'Termin': Calendar, 'Fragenkatalog': FileText,
};

function BoolField({ label, field, value, onUpdate }: { label: string; field: string; value: boolean | null; onUpdate: (field: string, value: boolean | null) => void }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs text-muted-foreground flex-1">{label}</p>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onUpdate(field, true)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${value === true ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
        >
          Ja
        </button>
        <button
          onClick={() => onUpdate(field, false)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${value === false ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
        >
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

  if (isLoading || !lead) return <div className="flex items-center justify-center h-64 text-muted-foreground">Lädt...</div>;

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

  const handleInlineEdit = (field: string, value: string | number | null) => {
    updateLead.mutate({ id: lead.id, [field]: value });
    setEditField(null);
  };

  const handleDelete = () => {
    deleteLead.mutate(lead.id, { onSuccess: () => navigate('/leads') });
  };

  const InlineField = ({ label, field, value, type = 'text' }: { label: string; field: string; value: string | number | null; type?: string }) => {
    if (editField === field) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex gap-2">
            <Input
              type={type}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleInlineEdit(field, type === 'number' ? Number(editValue) || null : editValue || null);
                if (e.key === 'Escape') setEditField(null);
              }}
            />
            <Button size="sm" variant="ghost" onClick={() => handleInlineEdit(field, type === 'number' ? Number(editValue) || null : editValue || null)}>✓</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-1 cursor-pointer group" onClick={() => { setEditField(field); setEditValue(String(value || '')); }}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm group-hover:text-primary transition-colors">{value || '–'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.vorname} {lead.nachname}</h1>
            <p className="text-muted-foreground">{lead.unternehmen || 'Kein Unternehmen'}</p>
            <div className="flex items-center gap-2 mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger><StatusBadge status={lead.status} className="cursor-pointer" /></DropdownMenuTrigger>
                <DropdownMenuContent>{LEAD_STATUSES.map(s => <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>{s}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger><PrioBadge prio={lead.prioritaet} className="cursor-pointer" /></DropdownMenuTrigger>
                <DropdownMenuContent>{LEAD_PRIORITAETEN.map(p => <DropdownMenuItem key={p} onClick={() => updateLead.mutate({ id: lead.id, prioritaet: p })}>{p}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.telefon && <Button variant="outline" size="sm" asChild><a href={`tel:${lead.telefon}`}><Phone className="h-4 w-4 mr-1" />Anrufen</a></Button>}
          {lead.email && <Button variant="outline" size="sm" asChild><a href={`mailto:${lead.email}`}><Mail className="h-4 w-4 mr-1" />E-Mail</a></Button>}
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Löschen</Button></AlertDialogTrigger>
            <AlertDialogContent>
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
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aktivität hinzufügen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {AKTIVITAET_TYPEN.filter(t => t !== 'Statusänderung').map(t => (
                  <Button key={t} variant={aktTyp === t ? 'default' : 'outline'} size="sm" onClick={() => setAktTyp(t)}>{t}</Button>
                ))}
              </div>
              <Textarea placeholder="Beschreibung..." value={aktBeschreibung} onChange={e => setAktBeschreibung(e.target.value)} rows={3} />
              <Button size="sm" onClick={handleSaveAktivitaet} disabled={!aktBeschreibung.trim()}>Speichern</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {aktivitaeten.map(akt => {
                  const Icon = ICON_MAP[akt.typ] || FileText;
                  return (
                    <div key={akt.id} className="flex gap-3 px-5 py-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{akt.typ}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(akt.created_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{akt.beschreibung}</p>
                        {akt.erstellt_von && <p className="text-xs text-muted-foreground mt-1">von {akt.erstellt_von}</p>}
                      </div>
                    </div>
                  );
                })}
                {aktivitaeten.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">Noch keine Aktivitäten</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info cards */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Kontaktdaten</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InlineField label="E-Mail" field="email" value={lead.email} type="email" />
              <InlineField label="Telefon" field="telefon" value={lead.telefon} />
              <InlineField label="Unternehmen" field="unternehmen" value={lead.unternehmen} />
              <InlineField label="Position" field="position_titel" value={lead.position_titel} />
              <InlineField label="Adresse" field="adresse" value={lead.adresse} />
              <div className="grid grid-cols-2 gap-2">
                <InlineField label="PLZ" field="plz" value={lead.plz} />
                <InlineField label="Ort" field="ort" value={lead.ort} />
              </div>
              {lead.homepage && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Homepage</p>
                  <a href={lead.homepage.startsWith('http') ? lead.homepage : `https://${lead.homepage}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{lead.homepage}</a>
                </div>
              )}
              {!lead.homepage && <InlineField label="Homepage" field="homepage" value={lead.homepage} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Qualifizierung</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-xs text-muted-foreground">Mitarbeiterzahl</p><p className="text-sm">{lead.mitarbeiter || '–'}</p></div>
              <div><p className="text-xs text-muted-foreground">Entwicklungsaktivität</p><p className="text-sm">{lead.entwicklung || '–'}</p></div>
              <div><p className="text-xs text-muted-foreground">Branche</p><p className="text-sm">{lead.branche || '–'}</p></div>
              <div>
                <p className="text-xs text-muted-foreground">Förderpotenzial</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(lead.rechner_ergebnis)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quelle & Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Quelle</p><p>{lead.quelle || '–'}</p></div>
              {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content) && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {lead.utm_source && <p>Source: {lead.utm_source}</p>}
                  {lead.utm_medium && <p>Medium: {lead.utm_medium}</p>}
                  {lead.utm_campaign && <p>Campaign: {lead.utm_campaign}</p>}
                  {lead.utm_content && <p>Content: {lead.utm_content}</p>}
                </div>
              )}
              <div><p className="text-xs text-muted-foreground">Erstellt am</p><p>{formatDateTime(lead.created_at)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Vertrieb</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InlineField label="Zugewiesen an" field="zugewiesen_an" value={lead.zugewiesen_an} />
              <InlineField label="Kontaktiert am" field="kontaktiert_am" value={lead.kontaktiert_am ? new Date(lead.kontaktiert_am).toLocaleDateString('de-DE') : null} type="datetime-local" />
              <InlineField label="Termin am" field="termin_am" value={lead.termin_am ? new Date(lead.termin_am).toLocaleDateString('de-DE') : null} type="datetime-local" />
              <InlineField label="Mandatswert (€)" field="mandats_wert" value={lead.mandats_wert} type="number" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ersteinschätzungs-Fragenkatalog */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ersteinschätzung — Fragenkatalog</CardTitle>
            {(() => {
              const ff = berechneFoerderfaehigkeit(lead);
              const info = FOERDERFAEHIGKEIT_LABELS[ff];
              return (
                <span className={`text-sm font-medium ${info.color}`}>
                  {ff === 'gruen' && '🟢'}{ff === 'gelb' && '🟡'}{ff === 'rot' && '🔴'}{ff === 'unbekannt' && '⚪'} {info.label}
                </span>
              );
            })()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <BoolField label="Ist das Unternehmen in Deutschland steuerpflichtig?" field="steuerpflichtig_de" value={lead.steuerpflichtig_de} onUpdate={handleInlineEdit} />
              <BoolField label="Ist das Unternehmen in Schwierigkeiten? (mind. halbes EK aufgebraucht)" field="unternehmen_schwierigkeiten" value={lead.unternehmen_schwierigkeiten} onUpdate={handleInlineEdit} />
              <BoolField label="Gibt es verbundene Unternehmen (Konzernstruktur)?" field="verbundene_unternehmen" value={lead.verbundene_unternehmen} onUpdate={handleInlineEdit} />
              <BoolField label="Handelt es sich um eine reine Produktentwicklung?" field="reine_produktentwicklung" value={lead.reine_produktentwicklung} onUpdate={handleInlineEdit} />
              <BoolField label="Bestehen wissenschaftliche/methodische Risiken?" field="wissenschaftliche_risiken" value={lead.wissenschaftliche_risiken} onUpdate={handleInlineEdit} />
              <BoolField label="Arbeiten Auftragnehmer mit (nicht routinemäßig)?" field="auftragnehmer_beteiligt" value={lead.auftragnehmer_beteiligt} onUpdate={handleInlineEdit} />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Herausforderungen der Entwicklung</p>
                <Textarea
                  value={lead.entwicklung_herausforderungen || ''}
                  placeholder="Welche Herausforderungen sollen bewältigt werden?"
                  rows={3}
                  className="text-sm"
                  onBlur={e => { if (e.target.value !== (lead.entwicklung_herausforderungen || '')) handleInlineEdit('entwicklung_herausforderungen', e.target.value || null); }}
                  onChange={() => {}}
                  defaultValue={lead.entwicklung_herausforderungen || ''}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Entwicklungsplan / Meilensteine</p>
                <Textarea
                  value={lead.entwicklungsplan || ''}
                  placeholder="Arbeitsplan, Meilensteine..."
                  rows={2}
                  className="text-sm"
                  onBlur={e => { if (e.target.value !== (lead.entwicklungsplan || '')) handleInlineEdit('entwicklungsplan', e.target.value || null); }}
                  onChange={() => {}}
                  defaultValue={lead.entwicklungsplan || ''}
                />
              </div>
              {lead.auftragnehmer_beteiligt && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Aufgabe der Auftragnehmer</p>
                  <Textarea
                    placeholder="Was ist die Aufgabenstellung?"
                    rows={2}
                    className="text-sm"
                    onBlur={e => { if (e.target.value !== (lead.auftragnehmer_aufgabe || '')) handleInlineEdit('auftragnehmer_aufgabe', e.target.value || null); }}
                    onChange={() => {}}
                    defaultValue={lead.auftragnehmer_aufgabe || ''}
                  />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Entwicklungsaufwand (letzte 4 Jahre)</p>
                <Select value={lead.entwicklungsaufwand_4j || ''} onValueChange={v => handleInlineEdit('entwicklungsaufwand_4j', v)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                  <SelectContent>
                    {ENTWICKLUNGSAUFWAND_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Mitarbeiter in Entwicklung eingesetzt</p>
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

      {/* Notizen */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Notizen</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Freitext-Notizen..."
            rows={4}
            className="text-sm"
            onBlur={e => { if (e.target.value !== (lead.notizen || '')) handleInlineEdit('notizen', e.target.value || null); }}
            onChange={() => {}}
            defaultValue={lead.notizen || ''}
          />
        </CardContent>
      </Card>
    </div>
  );
}
