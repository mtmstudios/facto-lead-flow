-- Add deleted_at column for soft delete
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON public.leads(deleted_at);

-- Tighten RLS: remove anon access
DROP POLICY IF EXISTS "Anon can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anon can read leads" ON public.leads;
