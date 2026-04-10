import { cn } from '@/lib/utils';
import { STATUS_CLASSES, PRIO_CLASSES } from '@/lib/constants';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLASSES[status] || 'bg-muted text-muted-foreground', className)}>
      {status}
    </span>
  );
}

export function PrioBadge({ prio, className }: { prio: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', PRIO_CLASSES[prio] || 'bg-muted text-muted-foreground', className)}>
      {prio}
    </span>
  );
}
