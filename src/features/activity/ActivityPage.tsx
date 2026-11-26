import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ActivityEventType } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatTimeInZone } from '../../lib/format';
import { Button, SegmentedTabs, StatusTag } from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

export function ActivityPage() {
  const { t } = useTranslation();
  const activities = useMiroStore((s) => s.activities);
  const timezone = useMiroStore((s) => s.settings.timezone);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityEventType>('all');
  const [detailMode, setDetailMode] = useState<'summary' | 'technical'>('summary');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.summary.toLowerCase().includes(q) ||
          (a.taskId?.toLowerCase().includes(q) ?? false) ||
          (a.resourceLabel?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [activities, typeFilter, search]);

  const selected = activities.find((a) => a.id === selectedId) ?? null;

  const toneForType = (type: ActivityEventType) => {
    if (type === 'error') return 'error';
    if (type === 'approval') return 'warning';
    if (type === 'recovery' || type === 'connection') return 'info';
    if (type === 'schedule_execution') return 'accent';
    return 'neutral';
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 gap-4 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.activity}</h1>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Nhật ký thực thi toàn hệ thống theo trình tự thời gian. Không hiển thị chuỗi suy luận nội bộ hay bí mật phiên.
            </p>
          </div>
          <SegmentedTabs
            value={detailMode}
            onChange={setDetailMode}
            items={[
              { value: 'summary', label: t.common.summary },
              { value: 'technical', label: t.common.technical },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative flex-1 max-w-[320px]">
            <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sự kiện, mã tác vụ, tài nguyên..."
              className="h-9 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-3 text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-focus-ring)]"
            />
          </div>

          <select
            aria-label="Filter event type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ActivityEventType)}
            className="h-9 rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2.5 text-[13px] text-[var(--color-text-secondary)]"
          >
            <option value="all">Mọi loại sự kiện</option>
            <option value="task_lifecycle">Task lifecycle</option>
            <option value="tool_execution">Tool execution</option>
            <option value="schedule_execution">Schedule execution</option>
            <option value="resource_update">Resource update</option>
            <option value="connection">Connection</option>
            <option value="approval">Approval</option>
            <option value="recovery">Recovery</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
          <table className="w-full border-collapse text-left min-w-[720px]">
            <thead className="sticky top-0 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="h-[36px] text-[12px] font-medium text-[var(--color-text-secondary)]">
                <th className="px-3">Thời gian</th>
                <th className="px-3">Loại</th>
                <th className="px-3">Mô tả sự kiện</th>
                <th className="px-3">Tài nguyên / Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filtered.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => setSelectedId(ev.id)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    ev.id === selectedId ? 'bg-[var(--color-accent-subtle)]/50' : 'hover:bg-[var(--color-hover)]/60'
                  )}
                >
                  <td className="px-3 py-2.5 font-mono-tech text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
                    {formatTimeInZone(ev.timestamp, timezone)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusTag tone={toneForType(ev.type)}>{ev.type}</StatusTag>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-[13px] text-[var(--color-text-primary)]">{ev.summary}</p>
                    {detailMode === 'technical' && (
                      <p className="mt-1 font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                        {JSON.stringify(ev.technicalMeta)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono-tech text-[11px] text-[var(--color-text-secondary)] whitespace-nowrap">
                    {ev.resourceLabel ?? ev.taskId ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <aside className="fixed inset-y-0 right-0 z-30 w-full sm:w-[380px] xl:static xl:z-auto h-full bg-[var(--color-sidebar)] border-l border-[var(--color-border)] flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)]">
            <h2 className="text-h5 text-[var(--color-text-primary)]">Chi tiết sự kiện</h2>
            <Button variant="ghost" size="icon" aria-label="Close event details" onClick={() => setSelectedId(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[13px]">
            <StatusTag tone={toneForType(selected.type)}>{selected.type}</StatusTag>
            <p className="text-[var(--color-text-primary)] leading-5">{selected.summary}</p>
            <div className="space-y-1 text-[12px] font-mono-tech text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-subtle)]">
              <div>Timestamp: {selected.timestamp}</div>
              <div>Task ID: {selected.taskId ?? '—'}</div>
              <div>Resource: {selected.resourceLabel ?? selected.resourceId ?? '—'}</div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Metadata kỹ thuật an toàn</p>
              <pre className="rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 font-mono-tech text-[11px] text-[var(--color-text-secondary)] overflow-x-auto">
                {JSON.stringify(selected.technicalMeta, null, 2)}
              </pre>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
