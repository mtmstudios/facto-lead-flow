import { useState, useMemo, useEffect } from 'react';
import { useLeads, useCreateLead, useUpdateLead, type Lead } from '@/hooks/useLeads';
import { StatusBadge, PrioBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LEAD_STATUSES, LEAD_QUELLEN, MITARBEITER_OPTIONS, ENTWICKLUNG_OPTIONS, formatCurrency, formatRelativeTime, isOverdue, berechnePrioritaet } from '@/lib/constants';
import { Plus, Download, X, ChevronUp, ChevronDown, Search, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
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
          <Button type="submit" className="w-full h-10 font-medium" disabled={createLead.isPending}>
            {createLead.isPending ? 'Erstelle...' : 'Lead erstellen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SortKey = 'status' | 'name' | 'unternehmen' | 'rechner_ergebnis' | 'quelle' | 'created_at';

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const navigate = useNavigate();
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 25;

  const hasActiveFilter = statusFilter !== 'all' || search !== '';

  useEffect(() => {
    const handler = () => setNewLeadOpen(true);
    window.addEventListener('shortcut:new-lead', handler);
    return () => window.removeEventListener('shortcut:new-lead', handler);
  }, []);

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
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
  }, [leads, statusFilter, search, sortKey, sortAsc]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, sKey }: { label: string; sKey: SortKey }) => (
    <button onClick={() => handleSort(sKey)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
      {label}
      {sortKey === sKey && (
        <span className="text-primary">
          {sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      )}
    </button>
  );

  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Status', 'Vorname', 'Nachname', 'Unternehmen', 'E-Mail', 'Telefon', 'Quelle', 'Potenzial', 'Erstellt'];
    const rows = filtered.map(l => [
      l.status, l.vorname, l.nachname, l.unternehmen || '', l.email || '', l.telefon || '',
      l.quelle || '', l.rechner_ergebnis?.toString().replace('.', ',') || '',
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Leads</h1>
          <p className="text-xs text-muted-foreground mt-1 num">{filtered.length} von {leads.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" /><span className="hidden md:inline">Export</span>
          </Button>
          <Button size="sm" onClick={() => setNewLeadOpen(true)} className="h-9 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /><span className="hidden sm:inline">Neuer Lead</span>
          </Button>
        </div>
      </div>

      {/* Search + Filter — eine Zeile */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Alle Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <AnimatePresence>
          {hasActiveFilter && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setSearch(''); setPage(0); }} className="h-10 text-muted-foreground">
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Card View — vereinfacht */}
      <div className="md:hidden space-y-2">
        {paged.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => navigate(`/leads/${lead.id}`)}
            className={`glass-card p-4 cursor-pointer active:scale-[0.99] transition-transform ${isOverdue(lead) ? 'border-destructive/30' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{lead.vorname} {lead.nachname}</p>
                {lead.unternehmen && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.unternehmen}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lead.rechner_ergebnis != null && lead.rechner_ergebnis > 0 && (
                  <span className="text-xs font-bold text-primary num">{formatCurrency(lead.rechner_ergebnis)}</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={lead.status} />
              <span className="text-xs text-muted-foreground num ml-auto">{formatRelativeTime(lead.created_at)}</span>
              {isOverdue(lead) && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
            </div>
          </motion.div>
        ))}
        {paged.length === 0 && (
          <div className="glass-card p-12 text-center text-muted-foreground text-sm">
            {hasActiveFilter ? 'Keine Leads gefunden' : 'Noch keine Leads'}
          </div>
        )}
      </div>

      {/* Desktop Table — 6 Spalten */}
      <div className="premium-table hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left"><SortHeader label="Status" sKey="status" /></th>
                <th className="p-3 text-left"><SortHeader label="Name" sKey="name" /></th>
                <th className="p-3 text-left"><SortHeader label="Unternehmen" sKey="unternehmen" /></th>
                <th className="p-3 text-left"><SortHeader label="Potenzial" sKey="rechner_ergebnis" /></th>
                <th className="p-3 text-left"><SortHeader label="Quelle" sKey="quelle" /></th>
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
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{lead.vorname} {lead.nachname}</p>
                      {isOverdue(lead) && (
                        <span className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> Überfällig
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {lead.unternehmen || '–'}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-primary num">{formatCurrency(lead.rechner_ergebnis)}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {lead.quelle || '–'}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatRelativeTime(lead.created_at)}
                  </td>
                </motion.tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    {hasActiveFilter ? 'Keine Leads gefunden' : 'Noch keine Leads'}
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
          <p className="text-xs text-muted-foreground num">{filtered.length} Leads</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-8">
              Zurück
            </Button>
            <span className="text-xs text-muted-foreground num px-2">{page + 1} / {totalPages}</span>
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
