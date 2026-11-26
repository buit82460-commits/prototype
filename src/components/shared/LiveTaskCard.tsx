import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Chrome,
  ExternalLink,
  FileText,
  Film,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  Search,
  Send,
  Square,
  Workflow,
  XCircle,
} from 'lucide-react';
import type { ResourceKind, Task } from '../../domain/types';
import {
  canCancelTask,
  canPauseTask,
  canResumeTask,
  canRetryTask,
} from '../../domain/taskMachine';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatDuration } from '../../lib/format';
import { Button, TaskProgressBar, TaskStatusBadge } from '../ui/primitives';
import { cn } from '../../lib/utils';

export function ResourceKindIcon({ kind, className = 'w-4 h-4' }: { kind: ResourceKind; className?: string }) {
  switch (kind) {
    case 'browser':
      return <Chrome className={className} />;
    case 'schedule':
      return <CalendarClock className={className} />;
    case 'research':
      return <Search className={className} />;
    case 'media':
      return <Film className={className} />;
    case 'workflow':
      return <Workflow className={className} />;
    case 'publishing':
      return <Send className={className} />;
    case 'document':
    default:
      return <FileText className={className} />;
  }
}

export function LiveTaskCard({
  task,
  compact = false,
  showLiveButton = true,
  className,
}: {
  task: Task;
  compact?: boolean;
  showLiveButton?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const pauseTask = useMiroStore((s) => s.pauseTask);
  const resumeTask = useMiroStore((s) => s.resumeTask);
  const cancelTask = useMiroStore((s) => s.cancelTask);
  const retryTask = useMiroStore((s) => s.retryTask);
  const setLiveWorkspace = useMiroStore((s) => s.setLiveWorkspace);
  const setLastConversationRouteId = useMiroStore((s) => s.setLastConversationRouteId);
  const ownership = useMiroStore((s) => s.ownerships[task.resource.id] ?? (task.profileId ? s.ownerships[task.profileId] : undefined));

  const elapsedMs = task.startedAt
    ? (task.completedAt ? new Date(task.completedAt).getTime() : Date.now()) -
      new Date(task.startedAt).getTime()
    : 0;

  const handleOpenResource = () => {
    if (task.conversationId) {
      setLastConversationRouteId(task.conversationId);
    }
    navigate(`${task.resource.route}?taskId=${encodeURIComponent(task.id)}`);
  };

  return (
    <div
      className={cn(
        'rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] transition-colors duration-150',
        compact ? 'p-3 space-y-2.5' : 'p-4 space-y-3',
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            <ResourceKindIcon kind={task.resource.kind} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-h5 text-[var(--color-text-primary)] truncate">{task.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[var(--color-text-muted)]">
              <span className="truncate max-w-[180px]">{task.resource.label}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{task.trigger}</span>
              {elapsedMs > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tech">{formatDuration(elapsedMs)}</span>
                </>
              )}
              {ownership && ownership.state !== 'ai_controlled' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--color-warning)] font-medium">
                    {t.ownership[ownership.state]}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Operation & Progress */}
      <div className="space-y-2">
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-5">
          {task.currentOperation}
        </p>
        <TaskProgressBar progress={task.progress} status={task.status} />
      </div>

      {/* Partial or Error callout */}
      {task.errorMessage && (
        <div className="rounded-[6px] bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 px-3 py-2 text-[12px] text-[var(--color-error)]">
          {task.errorMessage}
        </div>
      )}
      {task.partialNote && (
        <div className="rounded-[6px] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/30 px-3 py-2 text-[12px] text-[var(--color-warning)]">
          {task.partialNote}
        </div>
      )}

      {/* Expandable steps */}
      {!compact && task.steps.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {expanded ? 'Ẩn chi tiết bước thực thi' : `Xem ${task.steps.length} bước thực thi`}
            </span>
          </button>

          {expanded && (
            <ul className="mt-2 space-y-1.5 border-t border-[var(--color-border-subtle)] pt-2.5">
              {task.steps.map((st) => (
                <li key={st.id} className="flex items-start gap-2 text-[12px]">
                  <span className="mt-0.5 shrink-0">
                    {st.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    ) : st.status === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />
                    ) : st.status === 'active' ? (
                      <span className="block w-3.5 h-3.5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                    ) : (
                      <span className="block w-3.5 h-3.5 rounded-full border border-[var(--color-border-strong)]" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        st.status === 'completed'
                          ? 'text-[var(--color-text-secondary)]'
                          : st.status === 'active'
                          ? 'text-[var(--color-text-primary)] font-medium'
                          : 'text-[var(--color-text-muted)]'
                      )}
                    >
                      {st.label}
                    </p>
                    {st.detail && (
                      <p className="text-[11px] text-[var(--color-text-muted)]">{st.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={handleOpenResource}>
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{task.status === 'completed' ? t.actions.viewResult : t.workspace.openInWorkspace}</span>
          </Button>
          {showLiveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLiveWorkspace('split', task.id);
              }}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>{t.workspace.liveWorkspace}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canPauseTask(task.status) && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${t.actions.pause} ${task.title}`}
              onClick={() => pauseTask(task.id)}
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.actions.pause}</span>
            </Button>
          )}
          {canResumeTask(task.status) && (
            <Button
              variant="subtleAccent"
              size="sm"
              aria-label={`${t.actions.resume} ${task.title}`}
              onClick={() => resumeTask(task.id)}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t.actions.resume}</span>
            </Button>
          )}
          {canRetryTask(task.status) && (
            <Button
              variant="subtleAccent"
              size="sm"
              aria-label={`${t.actions.retry} ${task.title}`}
              onClick={() => retryTask(task.id)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.actions.retry}</span>
            </Button>
          )}
          {canCancelTask(task.status) && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${t.actions.cancel} ${task.title}`}
              onClick={() => cancelTask(task.id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
            >
              <Square className="w-3 h-3" />
              <span className="hidden sm:inline">{t.actions.cancel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
