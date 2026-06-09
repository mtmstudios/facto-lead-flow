import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type LeadInfo = { vorname: string; nachname: string; unternehmen: string | null };
type State = 'loading' | 'invalid' | 'already' | 'open' | 'submitting' | 'done' | 'error';

type Answers = {
  steuerpflichtig_de: boolean | null;
  unternehmen_schwierigkeiten: boolean | null;
  verbundene_unternehmen: boolean | null;
  reine_produktentwicklung: boolean | null;
  wissenschaftliche_risiken: boolean | null;
  auftragnehmer_beteiligt: boolean | null;
  entwicklung_herausforderungen: string;
  entwicklungsplan: string;
  auftragnehmer_aufgabe: string;
  entwicklungsaufwand_4j: string;
  ma_in_entwicklung: string;
};

const BOOL_QUESTIONS: { key: keyof Answers; label: string }[] = [
  { key: 'steuerpflichtig_de', label: 'Sind Sie in Deutschland steuerpflichtig?' },
  { key: 'unternehmen_schwierigkeiten', label: 'Befindet sich Ihr Unternehmen aktuell in wirtschaftlichen Schwierigkeiten?' },
  { key: 'verbundene_unternehmen', label: 'Haben Sie verbundene Unternehmen oder gehören zu einem Konzern?' },
  { key: 'reine_produktentwicklung', label: 'Handelt es sich um reine Produktentwicklung (ohne wissenschaftliche Neuartigkeit)?' },
  { key: 'wissenschaftliche_risiken', label: 'Bestehen wissenschaftliche oder technische Risiken in Ihrer Entwicklung?' },
  { key: 'auftragnehmer_beteiligt', label: 'Sind externe Dienstleister oder Auftragnehmer an der Entwicklung beteiligt?' },
];

const PCA_BLUE = '#307abe';
const PCA_BLUE_LIGHT = '#57a7dd';

export default function Fragebogen() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    steuerpflichtig_de: null,
    unternehmen_schwierigkeiten: null,
    verbundene_unternehmen: null,
    reine_produktentwicklung: null,
    wissenschaftliche_risiken: null,
    auftragnehmer_beteiligt: null,
    entwicklung_herausforderungen: '',
    entwicklungsplan: '',
    auftragnehmer_aufgabe: '',
    entwicklungsaufwand_4j: '',
    ma_in_entwicklung: '',
  });

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(`${FN_BASE}/get-lead-by-token/${token}`, {
          headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        });
        if (res.status === 410) { setState('already'); return; }
        if (!res.ok) { setState('invalid'); return; }
        const data = await res.json();
        setLead(data);
        setState('open');
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  const totalAnswered = (() => {
    let n = 0;
    BOOL_QUESTIONS.forEach(q => { if (answers[q.key] !== null) n++; });
    if (answers.entwicklung_herausforderungen.trim()) n++;
    if (answers.entwicklungsplan.trim()) n++;
    if (!answers.auftragnehmer_beteiligt || answers.auftragnehmer_aufgabe.trim()) n++;
    if (answers.entwicklungsaufwand_4j.trim()) n++;
    if (answers.ma_in_entwicklung.trim()) n++;
    return n;
  })();
  const totalQuestions = answers.auftragnehmer_beteiligt ? 11 : 10;
  const progress = Math.min(100, Math.round((totalAnswered / totalQuestions) * 100));

  const canSubmit = BOOL_QUESTIONS.every(q => answers[q.key] !== null) &&
    answers.entwicklung_herausforderungen.trim() &&
    answers.entwicklungsplan.trim() &&
    answers.entwicklungsaufwand_4j.trim() &&
    answers.ma_in_entwicklung.trim() &&
    (!answers.auftragnehmer_beteiligt || answers.auftragnehmer_aufgabe.trim());

  const handleSubmit = async () => {
    setState('submitting');
    try {
      const payload = {
        ...answers,
        entwicklung_herausforderungen: answers.entwicklung_herausforderungen.trim() || null,
        entwicklungsplan: answers.entwicklungsplan.trim() || null,
        auftragnehmer_aufgabe: answers.auftragnehmer_beteiligt ? (answers.auftragnehmer_aufgabe.trim() || null) : null,
        entwicklungsaufwand_4j: answers.entwicklungsaufwand_4j.trim() || null,
        ma_in_entwicklung: answers.ma_in_entwicklung.trim() || null,
      };
      const res = await fetch(`${FN_BASE}/submit-questionnaire/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 410) { setState('already'); return; }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error || 'Unbekannter Fehler');
        setState('error');
        return;
      }
      setState('done');
    } catch (e) {
      setErrorMsg((e as Error).message);
      setState('error');
    }
  };

  const setBool = (key: keyof Answers, val: boolean) => {
    setAnswers(a => ({ ...a, [key]: a[key] === val ? null : val }));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 py-6 px-4 md:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: PCA_BLUE }}>
              PCA <span style={{ color: PCA_BLUE_LIGHT }}>Partners</span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Forschungszulage — Ersteinschätzung</h1>
        </header>

        <Card className="shadow-lg border-slate-200">
          <CardContent className="p-5 md:p-8">
            {state === 'loading' && (
              <div className="space-y-3">
                <div className="h-5 w-2/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-32 bg-slate-200 rounded animate-pulse" />
              </div>
            )}

            {state === 'invalid' && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <p className="text-slate-700">Dieser Link ist ungültig. Bitte wenden Sie sich an Ihre Ansprechperson bei PCA Partners.</p>
              </div>
            )}

            {state === 'already' && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3" style={{ color: PCA_BLUE }} />
                <p className="text-slate-700">Sie haben diesen Fragebogen bereits beantwortet. Wir melden uns in Kürze bei Ihnen.</p>
              </div>
            )}

            {state === 'done' && lead && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-14 w-14 mx-auto mb-4" style={{ color: PCA_BLUE }} />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Vielen Dank, {lead.vorname}!</h2>
                <p className="text-slate-600">Ihre Angaben sind bei uns eingegangen. Wir melden uns innerhalb von 48 Stunden bei Ihnen mit der Auswertung.</p>
              </div>
            )}

            {(state === 'open' || state === 'submitting' || state === 'error') && lead && (
              <div className="space-y-6">
                <div>
                  <p className="text-base md:text-lg text-slate-800">Guten Tag {lead.vorname} {lead.nachname},</p>
                  <p className="text-sm md:text-base text-slate-600 mt-2 leading-relaxed">
                    für eine schnelle und präzise Ersteinschätzung Ihres Förderpotenzials bei der Forschungszulage beantworten Sie bitte die folgenden Fragen. Dauert ca. 5 Minuten.
                  </p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Fortschritt</span>
                    <span>{totalAnswered} von {totalQuestions}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${PCA_BLUE}, ${PCA_BLUE_LIGHT})` }} />
                  </div>
                </div>

                {/* Ja/Nein Block */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Ja / Nein Fragen</h3>
                  {BOOL_QUESTIONS.map((q, i) => (
                    <div key={q.key} className="p-4 rounded-lg border border-slate-200 bg-white">
                      <p className="text-sm md:text-base text-slate-800 mb-3">
                        <span className="font-semibold mr-2" style={{ color: PCA_BLUE }}>{i + 1}.</span>{q.label}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBool(q.key, true)}
                          className={`flex-1 min-h-[44px] rounded-lg font-medium text-sm transition-all ${
                            answers[q.key] === true
                              ? 'text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          style={answers[q.key] === true ? { backgroundColor: PCA_BLUE } : {}}
                        >Ja</button>
                        <button
                          type="button"
                          onClick={() => setBool(q.key, false)}
                          className={`flex-1 min-h-[44px] rounded-lg font-medium text-sm transition-all ${
                            answers[q.key] === false
                              ? 'bg-slate-700 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >Nein</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Text Block */}
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 pt-4">Beschreibung</h3>

                  <div>
                    <label className="text-sm font-medium text-slate-800 block mb-2">
                      <span className="font-semibold mr-2" style={{ color: PCA_BLUE }}>7.</span>
                      Welche technischen Herausforderungen begegnen Ihnen in Ihrer Entwicklung?
                    </label>
                    <Textarea
                      rows={4}
                      value={answers.entwicklung_herausforderungen}
                      onChange={e => setAnswers(a => ({ ...a, entwicklung_herausforderungen: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-800 block mb-2">
                      <span className="font-semibold mr-2" style={{ color: PCA_BLUE }}>8.</span>
                      Beschreiben Sie kurz Ihren aktuellen Entwicklungsplan.
                    </label>
                    <Textarea
                      rows={4}
                      value={answers.entwicklungsplan}
                      onChange={e => setAnswers(a => ({ ...a, entwicklungsplan: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  {answers.auftragnehmer_beteiligt && (
                    <div>
                      <label className="text-sm font-medium text-slate-800 block mb-2">
                        <span className="font-semibold mr-2" style={{ color: PCA_BLUE }}>9.</span>
                        Welche Aufgaben übernehmen die Auftragnehmer?
                      </label>
                      <Input
                        value={answers.auftragnehmer_aufgabe}
                        onChange={e => setAnswers(a => ({ ...a, auftragnehmer_aufgabe: e.target.value }))}
                        className="min-h-[44px]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-800 block mb-2">
                      <span className="font-semibold mr-2" style={{ color: PCA_BLUE }}>{answers.auftragnehmer_beteiligt ? 10 : 9}.</span>
                      Wie hoch war Ihr Entwicklungsaufwand in den letzten 4 Jahren (geschätzt in €)?
                    </label>
                    <Input
                      value={answers.entwicklungsaufwand_4j}
                      onChange={e => setAnswers(a => ({ ...a, entwicklungsaufwand_4j: e.target.value }))}
                      placeholder="z.B. 500.000 €"
                      className="min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-800 block mb-2">
                      <span className="font-semibold mr-2" style={{ color: PCA_BLUE }}>{answers.auftragnehmer_beteiligt ? 11 : 10}.</span>
                      Wie viele Mitarbeiter sind in der Entwicklung tätig?
                    </label>
                    <Input
                      value={answers.ma_in_entwicklung}
                      onChange={e => setAnswers(a => ({ ...a, ma_in_entwicklung: e.target.value }))}
                      placeholder="z.B. 5"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                {state === 'error' && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    Fehler beim Absenden: {errorMsg}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || state === 'submitting'}
                  className="w-full min-h-[52px] text-base font-semibold text-white"
                  style={{ backgroundColor: PCA_BLUE }}
                >
                  {state === 'submitting' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird gesendet...</>
                  ) : 'Antworten absenden'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="text-center mt-6 text-xs text-slate-500">
          Ihre Antworten werden ausschließlich von PCA Partners zur Prüfung Ihrer Förderfähigkeit verwendet.
        </footer>
      </div>
    </div>
  );
}
