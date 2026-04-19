export const LEAD_STATUSES = [
  'Neu', 'Mail gesendet', 'Kontaktiert', 'Erstgespräch geplant', 'Erstgespräch durchgeführt',
  'Fragenkatalog gesendet', 'Fragenkatalog beantwortet', 'Qualifiziert', 'Mandat',
  'Kalt', 'Nicht förderfähig', 'Disqualifiziert'
] as const;
export const LEAD_QUELLEN = ['Meta Ads', 'Google Ads', 'Organic', 'Funnel', 'Kaltakquise', 'Empfehlung', 'Event', 'Manuell'] as const;
export const LEAD_PRIORITAETEN = ['Hoch', 'Mittel', 'Niedrig'] as const;
export const MITARBEITER_OPTIONS = ['Bis 9', '10–49', '50–249', '250+'] as const;
export const ENTWICKLUNG_OPTIONS = ['Ja, regelmäßig', 'Ja, gelegentlich', 'Nein / Unsicher'] as const;
export const AKTIVITAET_TYPEN = ['Anruf', 'E-Mail', 'Notiz', 'Statusänderung', 'Termin', 'Fragenkatalog'] as const;
export const ENTWICKLUNGSAUFWAND_OPTIONS = ['unter 100.000 EUR', '100.000 – 400.000 EUR', '400.000 – 1.000.000 EUR', 'über 1.000.000 EUR'] as const;
export const MA_ENTWICKLUNG_OPTIONS = ['1', '2–5', '6–10', 'mehr als 10'] as const;

// Pipeline stages — 5 steps shown as progress bar in LeadDetail
export const PIPELINE_STAGES = [
  { key: 'Neu',         label: 'Neu',          status: 'Neu',                    color: '#3B82F6', statuses: ['Neu', 'Mail gesendet'] },
  { key: 'Kontaktiert', label: 'Kontaktiert',   status: 'Kontaktiert',            color: '#F59E0B', statuses: ['Kontaktiert'] },
  { key: 'Gespräch',    label: 'Gespräch',      status: 'Erstgespräch geplant',   color: '#F97316', statuses: ['Erstgespräch geplant', 'Erstgespräch durchgeführt'] },
  { key: 'Qualifiziert',label: 'Qualifiziert',  status: 'Qualifiziert',           color: '#8B5CF6', statuses: ['Fragenkatalog gesendet', 'Fragenkatalog beantwortet', 'Qualifiziert'] },
  { key: 'Mandat',      label: 'Mandat',        status: 'Mandat',                 color: '#22C55E', statuses: ['Mandat'] },
] as const;

// Simplified status list for dropdowns (matches 5 pipeline columns + negative outcomes)
export const DROPDOWN_STATUSES = [
  'Neu', 'Kontaktiert', 'Erstgespräch geplant', 'Qualifiziert', 'Mandat',
  'Kalt', 'Disqualifiziert'
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadPrioritaet = typeof LEAD_PRIORITAETEN[number];

export const STATUS_CLASSES: Record<string, string> = {
  'Neu': 'status-neu',
  'Mail gesendet': 'status-mail-gesendet',
  'Kontaktiert': 'status-kontaktiert',
  'Erstgespräch geplant': 'status-termin',
  'Erstgespräch durchgeführt': 'status-termin',
  'Fragenkatalog gesendet': 'status-fragenkatalog',
  'Fragenkatalog beantwortet': 'status-fragenkatalog',
  'Qualifiziert': 'status-qualifiziert',
  'Mandat': 'status-mandat',
  'Kalt': 'status-kalt',
  'Nicht förderfähig': 'status-disqualifiziert',
  'Disqualifiziert': 'status-disqualifiziert',
};

export const PRIO_CLASSES: Record<string, string> = {
  'Hoch': 'prio-hoch',
  'Mittel': 'prio-mittel',
  'Niedrig': 'prio-niedrig',
};

export function berechnePrioritaet(mitarbeiter: string | null, entwicklung: string | null): LeadPrioritaet {
  const isLargeCompany = mitarbeiter === '50–249' || mitarbeiter === '250+';
  const isMediumCompany = mitarbeiter === '10–49';
  const hasRegularDev = entwicklung === 'Ja, regelmäßig';
  const hasOccasionalDev = entwicklung === 'Ja, gelegentlich';

  if (isLargeCompany && hasRegularDev) return 'Hoch';
  if (isMediumCompany || hasOccasionalDev) return 'Mittel';
  return 'Niedrig';
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString('de-DE');
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function isOverdue(lead: { status: string; created_at: string }): boolean {
  if (lead.status !== 'Neu') return false;
  const created = new Date(lead.created_at);
  const now = new Date();
  return (now.getTime() - created.getTime()) > 4 * 3600000;
}

export type Foerderfaehigkeit = 'gruen' | 'gelb' | 'rot' | 'unbekannt';

export function berechneFoerderfaehigkeit(lead: {
  steuerpflichtig_de?: boolean | null;
  unternehmen_schwierigkeiten?: boolean | null;
  reine_produktentwicklung?: boolean | null;
  wissenschaftliche_risiken?: boolean | null;
}): Foerderfaehigkeit {
  const { steuerpflichtig_de, unternehmen_schwierigkeiten, reine_produktentwicklung, wissenschaftliche_risiken } = lead;

  if (steuerpflichtig_de == null && unternehmen_schwierigkeiten == null &&
      reine_produktentwicklung == null && wissenschaftliche_risiken == null) {
    return 'unbekannt';
  }

  if (unternehmen_schwierigkeiten === true || steuerpflichtig_de === false) return 'rot';

  if (steuerpflichtig_de === true && unternehmen_schwierigkeiten === false &&
      reine_produktentwicklung === false && wissenschaftliche_risiken === true) {
    return 'gruen';
  }

  return 'gelb';
}

export const FOERDERFAEHIGKEIT_LABELS: Record<Foerderfaehigkeit, { label: string; color: string }> = {
  gruen: { label: 'Wahrscheinlich förderfähig', color: 'text-green-500' },
  gelb: { label: 'Prüfung erforderlich', color: 'text-yellow-500' },
  rot: { label: 'Nicht förderfähig', color: 'text-red-500' },
  unbekannt: { label: 'Noch nicht bewertet', color: 'text-muted-foreground' },
};
