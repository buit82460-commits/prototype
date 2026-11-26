import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Square,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskPriority, TaskScenarioKind } from '../../domain/types';
import {
  canCancelTask,
  canPauseTask,
  canResumeTask,
  canRetryTask,
  computeProgressPercent,
} from '../../domain/taskMachine';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { formatClockOnly, formatTimeInZone } from '../../lib/format';
import {
  Button,
  Modal,
  SegmentedTabs,
  Select,
  StatusTag,
  TaskProgressBar,
  TaskStatusBadge,
  Textarea,
} from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

type SortKey = 'title' | 'status' | 'progress' | 'priority' | 'trigger' | 'resource' | 'createdAt';

export function TasksPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tasks = useMiroStore((s) => s.tasks);
  const profiles = useMiroStore((s) => s.browserProfiles);
  const projects = useMiroStore((s) => s.projects);
  const activities = useMiroStore((s) => s.activities);
  const evidences = useMiroStore((s) => s.evidences);
  const density = useMiroStore((s) => s.settings.density);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const pauseTask = useMiroStore((s) => s.pauseTask);
  const resumeTask = useMiroStore((s) => s.resumeTask);
  const cancelTask = useMiroStore((s) => s.cancelTask);
  const retryTask = useMiroStore((s) => s.retryTask);
  const setTaskPriority = useMiroStore((s) => s.setTaskPriority);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId ?? null);
  const [inspectorTab, setInspectorTab] = useState<'summary' | 'activity' | 'resources' | 'evidence' | 'result'>('summary');
  const [createOpen, setCreateOpen] = useState(false);

  const [newInstruction, setNewInstruction] = useState('');
  const [newScenario, setNewScenario] = useState<TaskScenarioKind>('tiktok_research');
  const [newProfile, setNewProfile] = useState('profile-20');
  const [newProject, setNewProject] = useState('proj-kans-377');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (taskId) setSelectedTaskId(taskId);
  }, [taskId]);

  const selectedTask = tasks.find((tk) => tk.id === selectedTaskId) ?? null;

  useEffect(() => {
    setActiveContext(
      selectedTask
        ? {
            resourceKind: selectedTask.resource.kind,
            resourceId: selectedTask.resource.id,
            resourceLabel: selectedTask.title,
            projectId: selectedTask.projectId,
            taskId: selectedTask.id,
          }
        : { resourceLabel: undefined }
    );
  }, [selectedTask, setActiveContext]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredTasks = useMemo(() => {
    const base = tasks.filter((tk) => {
      if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
      if (triggerFilter !== 'all' && tk.trigger !== triggerFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          tk.title.toLowerCase().includes(q) ||
          tk.resource.label.toLowerCase().includes(q) ||
          tk.id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const mult = sortDir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return a.title.localeCompare(b.title) * mult;
        case 'status':
          return a.status.localeCompare(b.status) * mult;
        case 'progress':
          return ((computeProgressPercent(a.progress) ?? -1) - (computeProgressPercent(b.progress) ?? -1)) * mult;
        case 'priority':
          return a.priority.localeCompare(b.priority) * mult;
        case 'trigger':
          return a.trigger.localeCompare(b.trigger) * mult;
        case 'resource':
          return a.resource.label.localeCompare(b.resource.label) * mult;
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mult;
      }
    });
  }, [tasks, statusFilter, triggerFilter, search, sortKey, sortDir]);

  const handleCreateTask = () => {
    if (!newInstruction.trim()) {
      setFormError('Vui lòng nhập mô tả tác vụ trước khi khởi chạy.');
      return;
    }
    const created = launchTaskFromInstruction({
      instruction: newInstruction.trim(),
      overrideScenario: newScenario,
      profileId: newProfile,
      projectId: newProject,
      trigger: 'manual',
      openLive: false,
    });
    setFormError('');
    setNewInstruction('');
    setCreateOpen(false);
    setSelectedTaskId(created.id);
    toast.success(`Đã tạo tác vụ: ${created.title}`);
  };

  const cyclePriority = (tk: Task, dir: 'up' | 'down') => {
    const order: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    const idx = order.indexOf(tk.priority);
    const nextIdx = dir === 'up' ? Math.min(order.length - 1, idx + 1) : Math.max(0, idx - 1);
    setTaskPriority(tk.id, order[nextIdx]);
  };

  const boardColumns = [
    { key: 'queued', label: 'Hàng đợi', items: filteredTasks.filter((tk) => tk.status === 'queued' || tk.status === 'planning') },
    { key: 'running', label: 'Đang chạy', items: filteredTasks.filter((tk) => tk.status === 'running' || tk.status === 'recovering') },
    { key: 'waiting', label: 'Chờ / Tạm dừng', items: filteredTasks.filter((tk) => tk.status === 'waiting_for_approval' || tk.status === 'waiting_for_resource' || tk.status === 'paused' || tk.status === 'pausing') },
    { key: 'done', label: 'Hoàn tất / Kết thúc', items: filteredTasks.filter((tk) => tk.status === 'completed' || tk.status === 'partial' || tk.status === 'failed' || tk.status === 'cancelled') },
  ];

  const rowHeightClass = density === 'compact' ? 'h-[36px]' : 'h-[48px]';

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] cursor-pointer whitespace-nowrap"
    >
      <span>{label}</span>
      <ArrowUpDown className={cn('w-3 h-3', sortKey === k ? 'text-[var(--color-accent-text)]' : 'opacity-45')} />
    </button>
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main Tasks Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-4 sm:p-6 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.tasks}</h1>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Quản lý tập trung mọi tác vụ từ Chat, Thủ công, Lịch trình và Workflow.
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>{t.actions.createTask}</span>
          </Button>
        </div>

        {/* Filter & View Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1 max-w-[300px]">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên tác vụ, ID hoặc tài nguyên..."
                className="h-9 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-3 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus-ring)] focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2.5 text-[13px] text-[var(--color-text-secondary)]"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="running">Đang thực thi</option>
              <option value="queued">Hàng đợi</option>
              <option value="waiting_for_approval">Chờ phê duyệt</option>
              <option value="waiting_for_resource">Chờ tài nguyên</option>
              <option value="paused">Tạm dừng</option>
              <option value="completed">Hoàn tất</option>
              <option value="partial">Hoàn tất một phần</option>
              <option value="failed">Thất bại</option>
            </select>

            <select
              aria-label="Filter by trigger"
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              className="h-9 rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2.5 text-[13px] text-[var(--color-text-secondary)]"
            >
              <option value="all">Mọi nguồn</option>
              <option value="chat">Chat</option>
              <option value="manual">Manual</option>
              <option value="schedule">Schedule</option>
              <option value="workflow">Workflow</option>
            </select>
          </div>

          <SegmentedTabs
            value={viewMode}
            onChange={setViewMode}
            items={[
              { value: 'list', label: t.common.list },
              { value: 'board', label: t.common.board },
            ]}
          />
        </div>

        {/* List View or Board View */}
        {viewMode === 'list' ? (
          <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
            <table className="w-full border-collapse text-left min-w-[820px]">
              <thead className="sticky top-0 z-10 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="h-[36px] text-[12px] font-medium text-[var(--color-text-secondary)]">
                  <th className="px-3"><SortHeader label="Tác vụ" k="title" /></th>
                  <th className="px-3"><SortHeader label="Trạng thái" k="status" /></th>
                  <th className="px-3"><SortHeader label="Tiến độ" k="progress" /></th>
                  <th className="px-3"><SortHeader label="Ưu tiên" k="priority" /></th>
                  <th className="px-3"><SortHeader label="Nguồn kích hoạt" k="trigger" /></th>
                  <th className="px-3"><SortHeader label="Tài nguyên" k="resource" /></th>
                  <th className="px-3"><SortHeader label="Thời gian tạo" k="createdAt" /></th>
                  <th className="px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[13px] text-[var(--color-text-muted)]">
                      Không tìm thấy tác vụ phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((tk) => {
                    const pct = computeProgressPercent(tk.progress);
                    const isSelected = tk.id === selectedTaskId;
                    return (
                      <tr
                        key={tk.id}
                        onClick={() => setSelectedTaskId(tk.id)}
                        className={cn(
                          'transition-colors cursor-pointer',
                          rowHeightClass,
                          isSelected
                            ? 'bg-[var(--color-accent-subtle)]/55'
                            : 'hover:bg-[var(--color-hover)]/60'
                        )}
                      >
                        <td className="px-3 py-2 align-middle">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate max-w-[290px]">
                              {tk.title}
                            </p>
                            <p className="text-[11px] font-mono-tech text-[var(--color-text-muted)]">
                              {tk.id}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <TaskStatusBadge status={tk.status} />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <div className="w-[150px] space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                                style={{ width: `${pct ?? (tk.status === 'waiting_for_approval' ? 65 : 30)}%` }}
                              />
                            </div>
                            <p className="font-mono-tech text-[11px] text-[var(--color-text-muted)] truncate">
                              {pct !== null ? `${tk.progress.current}/${tk.progress.total} (${pct}%)` : tk.progress.stageLabel}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle text-[12px] capitalize text-[var(--color-text-secondary)]">
                          {tk.priority}
                        </td>
                        <td className="px-3 py-2 align-middle text-[12px] capitalize text-[var(--color-text-secondary)]">
                          {tk.trigger}
                        </td>
                        <td className="px-3 py-2 align-middle text-[12px] text-[var(--color-text-secondary)]">
                          <span className="truncate block max-w-[160px]">{tk.resource.label}</span>
                        </td>
                        <td className="px-3 py-2 align-middle font-mono-tech text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
                          {formatTimeInZone(tk.createdAt, timezone)}
                        </td>
                        <td className="px-3 py-2 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canPauseTask(tk.status) && (
                              <Button variant="ghost" size="icon" aria-label={`Pause ${tk.title}`} onClick={() => pauseTask(tk.id)}>
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {canResumeTask(tk.status) && (
                              <Button variant="ghost" size="icon" aria-label={`Resume ${tk.title}`} onClick={() => resumeTask(tk.id)}>
                                <Play className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
                              </Button>
                            )}
                            {canRetryTask(tk.status) && (
                              <Button variant="ghost" size="icon" aria-label={`Retry ${tk.title}`} onClick={() => retryTask(tk.id)}>
                                <RotateCcw className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
                              </Button>
                            )}
                            {canCancelTask(tk.status) && (
                              <Button variant="ghost" size="icon" aria-label={`Cancel ${tk.title}`} onClick={() => cancelTask(tk.id)}>
                                <Square className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[780px] h-full">
              {boardColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex flex-col rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{col.label}</span>
                    <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                      {col.items.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                    {col.items.map((tk) => (
                      <div
                        key={tk.id}
                        onClick={() => setSelectedTaskId(tk.id)}
                        className={cn(
                          'rounded-[8px] bg-[var(--color-surface-2)] border p-3 space-y-2 cursor-pointer transition-colors',
                          tk.id === selectedTaskId
                            ? 'border-[var(--color-accent)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                        )}
                      >
                        <p className="text-[13px] font-medium text-[var(--color-text-primary)] leading-5">
                          {tk.title}
                        </p>
                        <div className="flex items-center justify-between gap-1 text-[11px] text-[var(--color-text-muted)]">
                          <span className="truncate">{tk.resource.label}</span>
                          <span className="capitalize font-medium">{tk.priority}</span>
                        </div>
                        <TaskProgressBar progress={tk.progress} status={tk.status} />
                        {col.key === 'queued' && (
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
                            <span>Điều chỉnh ưu tiên</span>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Increase priority" onClick={() => cyclePriority(tk, 'up')}>
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Decrease priority" onClick={() => cyclePriority(tk, 'down')}>
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {col.items.length === 0 && (
                      <p className="py-6 text-center text-[12px] text-[var(--color-text-muted)]">Trống</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right-side Task Inspector (420px) */}
      {selectedTask && (
        <aside
          aria-label="Task Inspector"
          className="fixed inset-y-0 right-0 z-30 w-full sm:w-[420px] xl:static xl:z-auto h-full bg-[var(--color-sidebar)] border-l border-[var(--color-border)] flex flex-col shrink-0"
        >
          <div className="flex items-start justify-between gap-2 px-4 py-3.5 border-b border-[var(--color-border)]">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <TaskStatusBadge status={selectedTask.status} />
                <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                  {selectedTask.id}
                </span>
              </div>
              <h2 className="text-h4 text-[var(--color-text-primary)]">{selectedTask.title}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close inspector"
              onClick={() => setSelectedTaskId(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-1)]/60">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`${selectedTask.resource.route}?taskId=${encodeURIComponent(selectedTask.id)}`)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.workspace.openInWorkspace}</span>
            </Button>
            {canPauseTask(selectedTask.status) && (
              <Button variant="secondary" size="sm" onClick={() => pauseTask(selectedTask.id)}>
                <Pause className="w-3.5 h-3.5" />
                <span>{t.actions.pause}</span>
              </Button>
            )}
            {canResumeTask(selectedTask.status) && (
              <Button variant="subtleAccent" size="sm" onClick={() => resumeTask(selectedTask.id)}>
                <Play className="w-3.5 h-3.5" />
                <span>{t.actions.resume}</span>
              </Button>
            )}
            {canRetryTask(selectedTask.status) && (
              <Button variant="subtleAccent" size="sm" onClick={() => retryTask(selectedTask.id)}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.actions.retry}</span>
              </Button>
            )}
            {canCancelTask(selectedTask.status) && (
              <Button variant="ghost" size="sm" onClick={() => cancelTask(selectedTask.id)}>
                <Square className="w-3 h-3" />
                <span>{t.actions.cancel}</span>
              </Button>
            )}
          </div>

          <div className="px-4 py-2.5 border-b border-[var(--color-border)] overflow-x-auto">
            <SegmentedTabs
              value={inspectorTab}
              onChange={setInspectorTab}
              items={[
                { value: 'summary', label: t.common.summary },
                { value: 'activity', label: t.common.activity },
                { value: 'resources', label: t.common.resources },
                { value: 'evidence', label: t.common.evidence },
                { value: 'result', label: t.common.result },
              ]}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inspectorTab === 'summary' && (
              <>
                <div className="space-y-1">
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Yêu cầu thực thi</p>
                  <p className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 text-[13px] text-[var(--color-text-primary)]">
                    {selectedTask.instruction}
                  </p>
                </div>
                <TaskProgressBar progress={selectedTask.progress} status={selectedTask.status} prominent />
                {selectedTask.errorMessage && (
                  <div className="rounded-[8px] bg-[var(--color-error-bg)] border border-[var(--color-error)]/40 p-3 text-[12px] text-[var(--color-error)]">
                    {selectedTask.errorMessage}
                  </div>
                )}
                {selectedTask.partialNote && (
                  <div className="rounded-[8px] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/40 p-3 text-[12px] text-[var(--color-warning)]">
                    {selectedTask.partialNote}
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Các bước thực thi</p>
                  <div className="space-y-1.5">
                    {selectedTask.steps.map((st, idx) => (
                      <div
                        key={st.id}
                        className="flex items-start justify-between gap-2 rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] px-3 py-2 text-[12px]"
                      >
                        <span className="text-[var(--color-text-primary)]">
                          {idx + 1}. {st.label}
                        </span>
                        <StatusTag
                          tone={
                            st.status === 'completed'
                              ? 'success'
                              : st.status === 'active'
                              ? 'accent'
                              : st.status === 'failed'
                              ? 'error'
                              : 'neutral'
                          }
                        >
                          {st.status}
                        </StatusTag>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {inspectorTab === 'activity' && (
              <div className="space-y-2">
                {activities
                  .filter((a) => a.taskId === selectedTask.id)
                  .map((a) => (
                    <div key={a.id} className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 space-y-1 text-[12px]">
                      <div className="flex justify-between font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                        <span>{a.type}</span>
                        <span>{formatClockOnly(a.timestamp)}</span>
                      </div>
                      <p className="text-[var(--color-text-primary)]">{a.summary}</p>
                    </div>
                  ))}
              </div>
            )}

            {inspectorTab === 'resources' && (
              <div className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3.5 space-y-2 text-[13px]">
                <p className="font-medium text-[var(--color-text-primary)]">{selectedTask.resource.label}</p>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  Loại: {selectedTask.resource.kind} · Route: <span className="font-mono-tech">{selectedTask.resource.route}</span>
                </p>
                {selectedTask.profileId && (
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    Profile: <span className="font-mono-tech">{selectedTask.profileId}</span>
                  </p>
                )}
              </div>
            )}

            {inspectorTab === 'evidence' && (
              <div className="space-y-2">
                {evidences.filter((e) => e.taskId === selectedTask.id).length === 0 ? (
                  <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có bản ghi bằng chứng cho tác vụ này.</p>
                ) : (
                  evidences
                    .filter((e) => e.taskId === selectedTask.id)
                    .map((ev) => (
                      <div key={ev.id} className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 space-y-1 text-[12px]">
                        <p className="font-medium text-[var(--color-text-primary)]">{ev.source}</p>
                        <p className="text-[var(--color-text-secondary)]">{ev.observation}</p>
                        <p className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                          {ev.recordIdentity} · {ev.validationStatus}
                        </p>
                      </div>
                    ))
                )}
              </div>
            )}

            {inspectorTab === 'result' && (
              <div className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4 space-y-3 text-[13px]">
                <p className="text-[var(--color-text-secondary)]">
                  {selectedTask.resultSummary ?? 'Chưa có kết quả cuối cùng.'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(selectedTask.resource.route)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Đi tới tài nguyên kết quả</span>
                </Button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Create Task Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo tác vụ mới (Mô phỏng)"
        description="Khởi chạy trực tiếp tác vụ mà không cần thông qua giao diện trò chuyện."
        widthClass="max-w-[540px]"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleCreateTask}>Khởi chạy tác vụ</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Loại tác vụ mô phỏng"
            value={newScenario}
            onChange={(e) => setNewScenario(e.target.value as TaskScenarioKind)}
          >
            <option value="tiktok_research">Nghiên cứu 10 video TikTok (Count-based)</option>
            <option value="schedule_create">Cấu hình lịch trình tự động (Stage-based)</option>
            <option value="publish_approval">Xuất bản nội dung cần phê duyệt (Approval)</option>
            <option value="partial_research">Thu thập 5 bản ghi (Kết quả một phần 3/5)</option>
            <option value="recovery_demo">Kiểm tra Profile 23 (Lỗi kết nối & Khôi phục)</option>
            <option value="media_analysis">Phân tích video trong Media Studio</option>
          </Select>

          <Textarea
            label="Hướng dẫn thực thi"
            placeholder="Ví dụ: Tìm và phân tích 10 video KANS 377 trên TikTok bằng Profile 20"
            value={newInstruction}
            error={formError}
            onChange={(e) => {
              setNewInstruction(e.target.value);
              if (formError) setFormError('');
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Browser Profile" value={newProfile} onChange={(e) => setNewProfile(e.target.value)}>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.connectionState})
                </option>
              ))}
            </Select>
            <Select label="Dự án" value={newProject} onChange={(e) => setNewProject(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
