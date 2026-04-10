export const LEAD_STATUSES = ['Neu', 'Kontaktiert', 'Termin', 'Qualifiziert', 'Mandat', 'Kalt', 'Disqualifiziert'] as const;
export const LEAD_QUELLEN = ['Meta Ads', 'Google Ads', 'Organic', 'Manuell'] as const;
export const LEAD_PRIORITAETEN = ['Hoch', 'Mittel', 'Niedrig'] as const;
export const MITARBEITER_OPTIONS = ['Bis 9', '10–49', '50–249', '250+'] as const;
export const ENTWICKLUNG_OPTIONS = ['Ja, regelmäßig', 'Ja, gelegentlich', 'Nein / Unsicher'] as const;
export const AKTIVITAET_TYPEN = ['Anruf', 'E-Mail', 'Notiz', 'Statusänderung', 'Termin'] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadPrioritaet = typeof LEAD_PRIORITAETEN[number];

export const STATUS_CLASSES: Record<string, string> = {
  'Neu': 'status-neu',
  'Kontaktiert': 'status-kontaktiert',
  'Termin': 'status-termin',
  'Qualifiziert': 'status-qualifiziert',
  'Mandat': 'status-mandat',
  'Kalt': 'status-kalt',
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
