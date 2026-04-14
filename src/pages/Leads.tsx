import { useState, useMemo } from 'react';
import { useLeads, useCreateLead, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { StatusBadge, PrioBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LEAD_STATUSES, LEAD_QUELLEN, LEAD_PRIORITAETEN, MITARBEITER_OPTIONS, ENTWICKLUNG_OPTIONS, formatCurrency, formatRelativeTime, isOverdue, berechnePrioritaet } from '@/lib/constants';
import { Plus, Download, X, ChevronUp, ChevronDown, Search, Filter, Users, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function NewLeadModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const createLead = useCreateLead();
  const [form, setForm] = useState({
    vorname: '', nachname: '', unternehmen: '', email: '', telefon: '',
    mitarbeiter: '', entwicklung: '', branche: '', notizen: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prioritaet = berechnePrioritaet(form.mitarbeiter || null, form.entwicklung || null);
    createLead.mutate({
      ...form,
      quelle: 'Manuell',
      prioritaet,
      mitarbeiter: form.mitarbeiter || null,
      entwicklung: form.entwicklung || null,
      branche: form.branche || null,
      notizen: form.notizen || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({ vorname: '', nachname: '', unternehmen: '', email: '', telefon: '', mitarbeiter: '', entwicklung: '', branche: '', notizen: '' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-card">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Neuer Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Vorname *" value={form.vorname} onChange={e => set('vorname', e.target.value)} required className="bg-background/50" />
            <Input placeholder="Nachname *" value={form.nachname} onChange={e => set('nachname', e.target.value)} required className="bg-background/50" />
          </div>
          <Input placeholder="Unternehmen" value={form.unternehmen} onChange={e => set('unternehmen', e.target.value)} className="bg-background/50" />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="E-Mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} className="bg-background/50" />
            <Input placeholder="Telefon" value={form.telefon} onChange={e => set('telefon', e.target.value)} className="bg-background/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.mitarbeiter} onValueChange={v => set('mitarbeiter', v)}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Mitarbeiter" /></SelectTrigger>
              <SelectContent>{MITARBEITER_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.entwicklung} onValueChange={v => set('entwicklung', v)}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Entwicklung" /></SelectTrigger>
              <SelectContent>{ENTWICKLUNG_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Branche" value={form.branche} onChange={e => set('branche', e.target.value)} className="bg-background/50" />
          <Textarea placeholder="Notizen" value={form.notizen} onChange={e => set('notizen', e.target.value)} rows={3} className="bg-background/50" />
          <Button type="submit" className="w-full h-10 font-medium" disabled={createLead.isPending}>
            {createLead.isPending ? 'Erstelle...' : 'Lead erstellen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SortKey = 'status' | 'prioritaet' | 'name' | 'unternehmen' | 'mitarbeiter' | 'quelle' | 'rechner_ergebnis' | 'created_at';

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const navigate = useNavigate();
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quelleFilter, setQuelleFilter] = useState<string>('all');
  const [prioFilter, setPrioFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const perPage = 25;

  const hasActiveFilter = statusFilter !== 'all' || quelleFilter !== 'all' || prioFilter !== 'all' || search !== '';

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (quelleFilter !== 'all') result = result.filter(l => l.quelle === quelleFilter);
    if (prioFilter !== 'all') result = result.filter(l => l.prioritaet === prioFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        `${l.vorname} ${l.nachname}`.toLowerCase().includes(s) ||
        l.unternehmen?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s)
      );
    }
    result = [...result].sort((a, b) => {
      const aOver = isOverdue(a) ? 0 : 1;
      const bOver = isOverdue(b) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortKey) {
        case 'name': aVal = `${a.vorname} ${a.nachname}`; bVal = `${b.vorname} ${b.nachname}`; break;
        case 'unternehmen': aVal = a.unternehmen || ''; bVal = b.unternehmen || ''; break;
        case 'rechner_ergebnis': aVal = a.rechner_ergebnis || 0; bVal = b.rechner_ergebnis || 0; break;
        case 'created_at': aVal = a.created_at; bVal = b.created_at; break;
        default: aVal = (a as Record<string, unknown>)[sortKey] as string || ''; bVal = (b as Record<string, unknown>)[sortKey] as string || '';
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, statusFilter, quelleFilter, prioFilter, search, sortKey, sortAsc]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, sKey }: { label: string; sKey: SortKey }) => (
    <button onClick={() => handleSort(sKey)} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
      {label}
      {sortKey === sKey && (
        <span className="text-primary">
          {sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      )}
    </button>
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const bulkStatusChange = (status: string) => {
    selected.forEach(id => updateLead.mutate({ id, status }));
    setSelected(new Set());
    toast.success(`${selected.size} Leads aktualisiert`);
  };

  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Status', 'Priorität', 'Vorname', 'Nachname', 'Unternehmen', 'E-Mail', 'Telefon', 'Mitarbeiter', 'Quelle', 'Rechner-Ergebnis', 'Erstellt'];
    const rows = filtered.map(l => [
      l.status, l.prioritaet, l.vorname, l.nachname, l.unternehmen || '', l.email || '', l.telefon || '',
      l.mitarbeiter || '', l.quelle || '', l.rechner_ergebnis?.toString().replace('.', ',') || '',
      new Date(l.created_at).toLocaleDateString('de-DE'),
    ]);
    const csv = BOM + [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleQuickStatusChange = (leadId: string, newStatus: string) => {
    updateLead.mutate({ id: leadId, status: newStatus });
  };

  const resetFilters = () => {
    setStatusFilter('all'); setQuelleFilter('all'); setPrioFilter('all'); setSearch(''); setPage(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 skeleton-shimmer" />
        <div className="h-12 w-full skeleton-shimmer" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 w-full skeleton-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            {filtered.length} von {leads.length} Leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-9">
            <Download className="h-3.5 w-3.5 mr-1.5" />Exportieren
          </Button>
          <Button size="sm" onClick={() => setNewLeadOpen(true)} className="h-9">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Neuer Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Name, Unternehmen oder E-Mail suchen..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9 bg-background/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px] h-9 bg-background/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={quelleFilter} onValueChange={v => { setQuelleFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px] h-9 bg-background/50"><SelectValue placeholder="Quelle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                {LEAD_QUELLEN.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={prioFilter} onValueChange={v => { setPrioFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[130px] h-9 bg-background/50"><SelectValue placeholder="Priorität" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prios</SelectItem>
                {LEAD_PRIORITAETEN.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <AnimatePresence>
            {hasActiveFilter && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5 mr-1" />Zurücksetzen
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 px-4 py-2.5">
              <span className="text-sm font-medium">{selected.size} ausgewählt</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">Status ändern</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {LEAD_STATUSES.map(s => <DropdownMenuItem key={s} onClick={() => bulkStatusChange(s)}>{s}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="h-8">Abbrechen</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="premium-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 w-10">
                  <Checkbox
                    checked={selected.size === paged.length && paged.length > 0}
                    onCheckedChange={(v) => setSelected(v ? new Set(paged.map(l => l.id)) : new Set())}
                  />
                </th>
                <th className="p-3 text-left"><SortHeader label="Status" sKey="status" /></th>
                <th className="p-3 text-left"><SortHeader label="Prio" sKey="prioritaet" /></th>
                <th className="p-3 text-left"><SortHeader label="Name" sKey="name" /></th>
                <th className="p-3 text-left"><SortHeader label="Unternehmen" sKey="unternehmen" /></th>
                <th className="p-3 text-left">E-Mail</th>
                <th className="p-3 text-left">Telefon</th>
                <th className="p-3 text-left"><SortHeader label="MA" sKey="mitarbeiter" /></th>
                <th className="p-3 text-left"><SortHeader label="Quelle" sKey="quelle" /></th>
                <th className="p-3 text-left"><SortHeader label="Potenzial" sKey="rechner_ergebnis" /></th>
                <th className="p-3 text-left"><SortHeader label="Erstellt" sKey="created_at" /></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`cursor-pointer ${isOverdue(lead) ? 'overdue' : ''}`}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <StatusBadge status={lead.status} className="cursor-pointer" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {LEAD_STATUSES.map(s => (
                          <DropdownMenuItem key={s} onClick={() => handleQuickStatusChange(lead.id, s)}>{s}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-3"><PrioBadge prio={lead.prioritaet} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/8 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                        {lead.vorname[0]}{lead.nachname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{lead.vorname} {lead.nachname}</p>
                        {isOverdue(lead) && (
                          <span className="text-[10px] text-destructive font-medium">Überfällig</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {lead.unternehmen ? (
                        <><Building2 className="h-3 w-3 shrink-0" /><span className="truncate max-w-[150px]">{lead.unternehmen}</span></>
                      ) : '–'}
                    </span>
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    {lead.email ? <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate max-w-[180px] block">{lead.email}</a> : <span className="text-muted-foreground">–</span>}
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    {lead.telefon ? <a href={`tel:${lead.telefon}`} className="text-primary hover:underline">{lead.telefon}</a> : <span className="text-muted-foreground">–</span>}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{lead.mitarbeiter || '–'}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {lead.quelle || '–'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-primary tabular-nums">{formatCurrency(lead.rechner_ergebnis)}</span>
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">{formatRelativeTime(lead.created_at)}</td>
                </motion.tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-muted-foreground">
                    {hasActiveFilter ? 'Keine Leads für diese Filter gefunden' : 'Noch keine Leads vorhanden'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">{filtered.length} Leads gesamt</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-8">
              Zurück
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums px-2">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-8">
              Weiter
            </Button>
          </div>
        </div>
      )}

      <NewLeadModal open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </motion.div>
  );
}
