
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fragebogen_token UUID UNIQUE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fragebogen_versendet_am TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fragebogen_beantwortet_am TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_fragebogen_token ON public.leads(fragebogen_token);
