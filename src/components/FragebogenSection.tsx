import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Copy, RotateCw, CheckCircle2, XCircle, Loader2, FileCheck2 } from 'lucide-react';
import { formatDateTime } from '@/lib/constants';
import type { Lead } from '@/hooks/useLeads';
import { useQueryClient } from '@tanstack/react-query';

const PUBLIC_BASE_URL = 'https://leaddashboard-factonet.lovable.app';

const BOOL_LABELS: { key: keyof Lead; label: string }[] = [
  { key: 'steuerpflichtig_de', label: 'In Deutschland steuerpflichtig' },
  { key: 'unternehmen_schwierigkeiten', label: 'Unternehmen in Schwierigkeiten' },
  { key: 'verbundene_unternehmen', label: 'Verbundene Unternehmen / Konzern' },
  { key: 'reine_produktentwicklung', label: 'Reine Produktentwicklung' },
  { key: 'wissenschaftliche_risiken', label: 'Wissenschaftliche Risiken' },
  { key: 'auftragnehmer_beteiligt', label: 'Auftragnehmer beteiligt' },
];

const TEXT_FIELDS: { key: keyof Lead; label: string }[] = [
  { key: 'entwicklung_herausforderungen', label: 'Technische Herausforderungen' },
  { key: 'entwicklungsplan', label: 'Entwicklungsplan' },
  { key: 'auftragnehmer_aufgabe', label: 'Aufgabe der Auftragnehmer' },
  { key: 'entwicklungsaufwand_4j', label: 'Entwicklungsaufwand (4 Jahre)' },
  { key: 'ma_in_entwicklung', label: 'MA in Entwicklung' },
];

export function FragebogenSection({ lead }: { lead: Lead }) {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const link = lead.fragebogen_token ? `${PUBLIC_BASE_URL}/fragebogen/${lead.fragebogen_token}` : null;

  const sendQuestionnaire = async () => {
    if (!lead.email) {
      toast.error('Lead hat keine E-Mail-Adresse');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-questionnaire', {
        body: { lead_id: lead.id },
      });
      if (error) throw error;
      if (data?.mail_sent === false && data?.mail_error) {
        toast.warning(`Token gespeichert, Mail nicht versendet: ${data.mail_error}`);
      } else {
        toast.success('Fragebogen wurde versendet');
      }
      qc.invalidateQueries({ queryKey: ['leads', lead.id] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    } catch (e) {
      toast.error((e as Error).message || 'Fehler beim Senden');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link kopiert');
    } catch {
      toast.error('Konnte Link nicht kopieren');
    }
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Fragebogen</h3>
        </div>

        {!lead.fragebogen_versendet_am && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Senden Sie dem Kunden einen Magic-Link, mit dem er den Fragebogen ausfüllen kann.
            </p>
            <Button onClick={sendQuestionnaire} disabled={loading || !lead.email} className="w-full md:w-auto">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Fragebogen an Kunden senden
            </Button>
            {!lead.email && <p className="text-xs text-amber-600">Lead hat keine E-Mail-Adresse hinterlegt.</p>}
          </div>
        )}

        {lead.fragebogen_versendet_am && !lead.fragebogen_beantwortet_am && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600">
                Wartet auf Antwort
              </span>
              <span className="text-muted-foreground">Versendet: {formatDateTime(lead.fragebogen_versendet_am)}</span>
            </div>
            {link && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/40 text-xs">
                <span className="truncate flex-1 font-mono">{link}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Link kopieren
              </Button>
              <Button variant="outline" size="sm" onClick={sendQuestionnaire} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5 mr-1.5" />}
                Erneut senden
              </Button>
            </div>
          </div>
        )}

        {lead.fragebogen_beantwortet_am && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Beantwortet
              </span>
              <span className="text-muted-foreground">am {formatDateTime(lead.fragebogen_beantwortet_am)}</span>
            </div>

            <div className="space-y-1.5">
              {BOOL_LABELS.map(({ key, label }) => {
                const v = lead[key] as boolean | null;
                return (
                  <div key={String(key)} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-sm text-foreground/80">{label}</span>
                    {v === true && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Ja
                      </span>
                    )}
                    {v === false && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <XCircle className="h-3 w-3" /> Nein
                      </span>
                    )}
                    {v === null && <span className="text-xs text-muted-foreground italic">–</span>}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pt-2">
              {TEXT_FIELDS.map(({ key, label }) => {
                const v = lead[key] as string | null;
                if (!v) return null;
                return (
                  <div key={String(key)}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3 border border-border/30">{v}</p>
                  </div>
                );
              })}
            </div>

            <div>
              <Button variant="outline" size="sm" onClick={sendQuestionnaire} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5 mr-1.5" />}
                Neuen Fragebogen senden
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
