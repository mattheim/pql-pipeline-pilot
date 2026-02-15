import { PQL_STATUSES, type PqlStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const config = PQL_STATUSES[status as PqlStatus] ?? { label: status, color: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', config.color)}>
      {config.label}
    </span>
  );
}
