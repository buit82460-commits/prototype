import { Hand, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import type { OwnershipState, ResourceKind } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/primitives';
import { cn } from '../../lib/utils';

export function OwnershipBanner({
  resourceId,
  resourceKind,
  taskId,
  editSummary,
  compact = false,
}: {
  resourceId: string;
  resourceKind: ResourceKind;
  taskId?: string;
  editSummary?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const ownership = useMiroStore((s) => s.ownerships[resourceId]);
  const requestTakeover = useMiroStore((s) => s.requestTakeover);
  const returnControlToAi = useMiroStore((s) => s.returnControlToAi);

  const state: OwnershipState = ownership?.state ?? 'ai_controlled';
  const isTransitioning =
    state === 'takeover_requested' ||
    state === 'transferring_control' ||
    state === 'returning_control' ||
    state === 'ai_resuming';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2.5 rounded-[8px] border px-3 py-2 text-[12px]',
        state === 'human_controlled'
          ? 'bg-[var(--color-warning-bg)] border-[var(--color-warning)]/40 text-[var(--color-warning)]'
          : isTransitioning
          ? 'bg-[var(--color-info-bg)] border-[var(--color-info)]/40 text-[var(--color-info)]'
          : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-secondary)]',
        compact && 'px-2.5 py-1.5'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isTransitioning ? (
          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
        ) : state === 'human_controlled' ? (
          <Hand className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[var(--color-accent-text)]" />
        )}
        <div className="min-w-0">
          <span className="font-medium text-[var(--color-text-primary)]">
            {t.ownership[state]}
          </span>
          {!compact && (
            <span className="ml-2 text-[var(--color-text-muted)]">
              {state === 'human_controlled'
                ? 'Cập nhật tự động của AI đang khóa — bạn có thể chỉnh sửa trực tiếp.'
                : 'Cơ chế chuyển giao quyền mô phỏng đồng bộ theo tác vụ.'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {state === 'ai_controlled' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => requestTakeover(resourceId, resourceKind, taskId)}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{t.actions.takeOver}</span>
          </Button>
        )}
        {state === 'human_controlled' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => returnControlToAi(resourceId, editSummary)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.actions.returnControl}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
