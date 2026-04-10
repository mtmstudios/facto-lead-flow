
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  unternehmen TEXT,
  email TEXT,
  telefon TEXT,
  mitarbeiter TEXT,
  entwicklung TEXT,
  rechner_ergebnis NUMERIC,
  branche TEXT,
  quelle TEXT DEFAULT 'Manuell',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  status TEXT NOT NULL DEFAULT 'Neu',
  prioritaet TEXT NOT NULL DEFAULT 'Niedrig',
  notizen TEXT,
  zugewiesen_an TEXT,
  kontaktiert_am TIMESTAMPTZ,
  termin_am TIMESTAMPTZ,
  mandats_wert NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create aktivitaeten table
CREATE TABLE public.aktivitaeten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  typ TEXT NOT NULL,
  beschreibung TEXT,
  erstellt_von TEXT
);

-- Create einstellungen table
CREATE TABLE public.einstellungen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schluessel TEXT NOT NULL UNIQUE,
  wert TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitaeten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einstellungen ENABLE ROW LEVEL SECURITY;

-- Leads: authenticated users full access
CREATE POLICY "Authenticated users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

-- Leads: anon can insert (for webhook/n8n)
CREATE POLICY "Anon can insert leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);

-- Aktivitaeten: authenticated users full access
CREATE POLICY "Auth users full access aktivitaeten" ON public.aktivitaeten FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Einstellungen: authenticated users full access
CREATE POLICY "Auth users full access einstellungen" ON public.einstellungen FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_prioritaet ON public.leads(prioritaet);
CREATE INDEX idx_aktivitaeten_lead_id ON public.aktivitaeten(lead_id);
