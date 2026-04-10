import { useState, useMemo } from 'react';
import { useLeads, useCreateLead, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { StatusBadge, PrioBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LEAD_STATUSES, LEAD_QUELLEN, LEAD_PRIORITAETEN, MITARBEITER_OPTIONS, ENTWICKLUNG_OPTIONS, formatCurrency, formatRelativeTime, isOverdue, berechnePrioritaet } from '@/lib/constants';
import { Plus, Download, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuer Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Vorname *" value={form.vorname} onChange={e => set('vorname', e.target.value)} required />
            <Input placeholder="Nachname *" value={form.nachname} onChange={e => set('nachname', e.target.value)} required />
          </div>
          <Input placeholder="Unternehmen" value={form.unternehmen} onChange={e => set('unternehmen', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="E-Mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            <Input placeholder="Telefon" value={form.telefon} onChange={e => set('telefon', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.mitarbeiter} onValueChange={v => set('mitarbeiter', v)}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter" /></SelectTrigger>
              <SelectContent>{MITARBEITER_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.entwicklung} onValueChange={v => set('entwicklung', v)}>
              <SelectTrigger><SelectValue placeholder="Entwicklung" /></SelectTrigger>
              <SelectContent>{ENTWICKLUNG_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Branche" value={form.branche} onChange={e => set('branche', e.target.value)} />
          <Textarea placeholder="Notizen" value={form.notizen} onChange={e => set('notizen', e.target.value)} rows={3} />
          <Button type="submit" className="w-full" disabled={createLead.isPending}>
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
    // Sort overdue first
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
    <button onClick={() => handleSort(sKey)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
      {label}
      {sortKey === sKey && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Exportieren</Button>
          <Button size="sm" onClick={() => setNewLeadOpen(true)}><Plus className="h-4 w-4 mr-1" />Neuer Lead</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={quelleFilter} onValueChange={v => { setQuelleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Quelle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Quellen</SelectItem>
            {LEAD_QUELLEN.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prioFilter} onValueChange={v => { setPrioFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priorität" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            {LEAD_PRIORITAETEN.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Suche..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="w-52" />
        <Button variant="ghost" size="sm" onClick={resetFilters}><X className="h-4 w-4 mr-1" />Zurücksetzen</Button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} ausgewählt</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline">Status ändern</Button></DropdownMenuTrigger>
            <DropdownMenuContent>{LEAD_STATUSES.map(s => <DropdownMenuItem key={s} onClick={() => bulkStatusChange(s)}>{s}</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Abbrechen</Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 w-10"><Checkbox checked={selected.size === paged.length && paged.length > 0} onCheckedChange={(v) => setSelected(v ? new Set(paged.map(l => l.id)) : new Set())} /></th>
                <th className="p-3 text-left"><SortHeader label="Status" sKey="status" /></th>
                <th className="p-3 text-left"><SortHeader label="Priorität" sKey="prioritaet" /></th>
                <th className="p-3 text-left"><SortHeader label="Name" sKey="name" /></th>
                <th className="p-3 text-left"><SortHeader label="Unternehmen" sKey="unternehmen" /></th>
                <th className="p-3 text-left">E-Mail</th>
                <th className="p-3 text-left">Telefon</th>
                <th className="p-3 text-left"><SortHeader label="Mitarbeiter" sKey="mitarbeiter" /></th>
                <th className="p-3 text-left"><SortHeader label="Quelle" sKey="quelle" /></th>
                <th className="p-3 text-left"><SortHeader label="Rechner" sKey="rechner_ergebnis" /></th>
                <th className="p-3 text-left"><SortHeader label="Erstellt" sKey="created_at" /></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(lead => (
                <tr
                  key={lead.id}
                  className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${isOverdue(lead) ? 'bg-destructive/5' : ''}`}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <StatusBadge status={lead.status} className="cursor-pointer" />
                        {isOverdue(lead) && <span className="ml-1 text-xs text-destructive font-medium">Überfällig</span>}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {LEAD_STATUSES.map(s => (
                          <DropdownMenuItem key={s} onClick={() => handleQuickStatusChange(lead.id, s)}>{s}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-3"><PrioBadge prio={lead.prioritaet} /></td>
                  <td className="p-3 font-medium">{lead.vorname} {lead.nachname}</td>
                  <td className="p-3 text-muted-foreground">{lead.unternehmen || '–'}</td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    {lead.email ? <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a> : '–'}
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    {lead.telefon ? <a href={`tel:${lead.telefon}`} className="text-primary hover:underline">{lead.telefon}</a> : '–'}
                  </td>
                  <td className="p-3 text-muted-foreground">{lead.mitarbeiter || '–'}</td>
                  <td className="p-3 text-muted-foreground">{lead.quelle || '–'}</td>
                  <td className="p-3 text-primary font-medium">{formatCurrency(lead.rechner_ergebnis)}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{formatRelativeTime(lead.created_at)}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">{isLoading ? 'Lädt...' : 'Keine Leads gefunden'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} Leads gesamt</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Zurück</Button>
            <span className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Weiter</Button>
          </div>
        </div>
      )}

      <NewLeadModal open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}
