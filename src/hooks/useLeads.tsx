import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadUpdate = TablesUpdate<'leads'>;
export type Aktivitaet = Tables<'aktivitaeten'>;

export function useLeads() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        if (payload.eventType === 'INSERT') {
          const lead = payload.new as Lead;
          toast.info(`Neuer Lead: ${lead.vorname} ${lead.nachname}${lead.unternehmen ? `, ${lead.unternehmen}` : ''}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useLeadAktivitaeten(leadId: string | undefined) {
  return useQuery({
    queryKey: ['aktivitaeten', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase.from('aktivitaeten').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Aktivitaet[];
    },
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase.from('leads').insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead erstellt');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Lead nicht gefunden oder keine Berechtigung');
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', data.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead gelöscht');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateAktivitaet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (akt: { lead_id: string; typ: string; beschreibung: string; erstellt_von?: string }) => {
      const { data, error } = await supabase.from('aktivitaeten').insert(akt).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['aktivitaeten', data.lead_id] });
      toast.success('Aktivität gespeichert');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
