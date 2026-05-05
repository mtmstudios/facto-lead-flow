DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

CREATE POLICY "leads_update_authenticated"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "leads_delete_authenticated"
  ON public.leads FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "aktivitaeten_update_policy" ON public.aktivitaeten;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.aktivitaeten;
DROP POLICY IF EXISTS "Auth users full access aktivitaeten" ON public.aktivitaeten;

CREATE POLICY "aktivitaeten_all_authenticated"
  ON public.aktivitaeten FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);