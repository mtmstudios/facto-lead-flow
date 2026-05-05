-- Fix RLS policies: add WITH CHECK to UPDATE policies

-- Leads: fix UPDATE policy (add WITH CHECK)
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
CREATE POLICY "Authenticated users can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Leads: allow anon to update (for n8n webhooks)
DROP POLICY IF EXISTS "Anon can update leads" ON public.leads;
CREATE POLICY "Anon can update leads" ON public.leads
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Aktivitaeten: recreate with explicit WITH CHECK
DROP POLICY IF EXISTS "Auth users full access aktivitaeten" ON public.aktivitaeten;
CREATE POLICY "Auth users full access aktivitaeten" ON public.aktivitaeten
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon can insert aktivitaeten (for webhooks)
DROP POLICY IF EXISTS "Anon can insert aktivitaeten" ON public.aktivitaeten;
CREATE POLICY "Anon can insert aktivitaeten" ON public.aktivitaeten
  FOR INSERT TO anon
  WITH CHECK (true);

-- Einstellungen: ensure full access
DROP POLICY IF EXISTS "Auth users full access einstellungen" ON public.einstellungen;
CREATE POLICY "Auth users full access einstellungen" ON public.einstellungen
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
