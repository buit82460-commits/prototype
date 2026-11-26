import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Chrome,
  ExternalLink,
  Maximize2,
  Minimize2,
  Play,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatClockOnly, formatNumberCompact } from '../../lib/format';
import {
  Button,
  Input,
  SegmentedTabs,
  Select,
  StatusTag,
  TaskProgressBar,
  TaskStatusBadge,
  Textarea,
} from '../ui/primitives';
import { OwnershipBanner } from './OwnershipBanner';
import { ResourceKindIcon } from './LiveTaskCard';
import { cn } from '../../lib/utils';

export function LiveWorkspacePanel({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const liveMode = useMiroStore((s) => s.liveWorkspaceMode);
  const liveTaskId = useMiroStore((s) => s.liveWorkspaceTaskId);
  const activeTab = useMiroStore((s) => s.liveWorkspaceTab);
  const setLiveWorkspace = useMiroStore((s) => s.setLiveWorkspace);
  const setLiveWorkspaceTab = useMiroStore((s) => s.setLiveWorkspaceTab);
  const setLastConversationRouteId = useMiroStore((s) => s.setLastConversationRouteId);
  const activeConversationId = useMiroStore((s) => s.activeConversationId);

  const tasks = useMiroStore((s) => s.tasks);
  const schedules = useMiroStore((s) => s.schedules);
  const updateSchedule = useMiroStore((s) => s.updateSchedule);
  const profiles = useMiroStore((s) => s.browserProfiles);
  const researchRecords = useMiroStore((s) => s.researchRecords);
  const mediaAssets = useMiroStore((s) => s.mediaAssets);
  const workflows = useMiroStore((s) => s.workflows);
  const publications = useMiroStore((s) => s.publications);
  const knowledgeDocs = useMiroStore((s) => s.knowledgeDocs);
  const upsertKnowledgeDoc = useMiroStore((s) => s.upsertKnowledgeDoc);
  const activities = useMiroStore((s) => s.activities);
  const evidences = useMiroStore((s) => s.evidences);
  const approvals = useMiroStore((s) => s.approvals);
  const resolveApproval = useMiroStore((s) => s.resolveApproval);
  const ownerships = useMiroStore((s) => s.ownerships);

  const [lastHumanNote, setLastHumanNote] = useState<string>('');
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);

  if (liveMode === 'hidden') return null;

  const task = tasks.find((tk) => tk.id === liveTaskId) ?? tasks[0];
  if (!task) return null;

  const resourceId = task.resource.id;
  const ownershipKey = task.resource.kind === 'browser' && task.profileId ? task.profileId : resourceId;
  const ownership = ownerships[ownershipKey];
  const isHumanControlled = ownership?.state === 'human_controlled';

  const taskActivities = activities.filter(
    (a) => a.taskId === task.id || a.resourceId === task.resource.id
  );
  const taskEvidences = evidences.filter((e) => e.taskId === task.id);

  const handleOpenFull = () => {
    setLastConversationRouteId(activeConversationId);
    navigate(`${task.resource.route}?taskId=${encodeURIComponent(task.id)}`);
  };

  const renderWorkspaceSurface = () => {
    // 1. Schedule Live Form
    if (task.resource.kind === 'schedule') {
      const sched = schedules.find((sc) => sc.id === task.resource.id);
      if (!sched) {
        return <p className="text-[13px] text-[var(--color-text-muted)]">Không tìm thấy bản nháp lịch trình.</p>;
      }
      return (
        <div className="space-y-4">
          <OwnershipBanner
            resourceId={sched.id}
            resourceKind="schedule"
            taskId={task.id}
            editSummary={lastHumanNote || 'Đã cập nhật cấu hình lịch trình thủ công'}
          />
          <div className="rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                Biểu mẫu cấu hình trực tiếp (Schedules)
              </span>
              {sched.configuringField && !isHumanControlled && (
                <StatusTag tone="accent">Đang cấu hình: {sched.configuringField}</StatusTag>
              )}
            </div>

            <Input
              label="Tên lịch trình"
              value={sched.name}
              highlighted={sched.configuringField === 'name'}
              disabled={!isHumanControlled && task.status === 'running'}
              onChange={(e) => {
                updateSchedule(sched.id, { name: e.target.value });
                setLastHumanNote(`Đổi tên lịch thành "${e.target.value}"`);
              }}
            />
            <Textarea
              label="Hướng dẫn thực thi cho Miro"
              value={sched.instruction}
              highlighted={sched.configuringField === 'instruction'}
              disabled={!isHumanControlled && task.status === 'running'}
              onChange={(e) => {
                updateSchedule(sched.id, { instruction: e.target.value });
                setLastHumanNote('Chỉnh sửa hướng dẫn thực thi');
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Giờ chạy"
                type="time"
                value={sched.time}
                highlighted={sched.configuringField === 'time'}
                disabled={!isHumanControlled && task.status === 'running'}
                onChange={(e) => {
                  updateSchedule(sched.id, { time: e.target.value });
                  setLastHumanNote(`Đổi giờ chạy sang ${e.target.value}`);
                }}
              />
              <Select
                label="Tần suất"
                value={sched.recurrence}
                highlighted={sched.configuringField === 'time'}
                disabled={!isHumanControlled && task.status === 'running'}
                onChange={(e) => {
                  updateSchedule(sched.id, { recurrence: e.target.value as typeof sched.recurrence });
                  setLastHumanNote(`Đổi tần suất thành ${e.target.value}`);
                }}
              >
                <option value="daily">Mỗi ngày</option>
                <option value="weekdays">Ngày làm việc</option>
                <option value="weekly">Hàng tuần</option>
                <option value="hourly">Mỗi giờ</option>
                <option value="once">Một lần</option>
              </Select>
              <Input
                label="Múi giờ (IANA)"
                value={sched.timezone}
                disabled={!isHumanControlled && task.status === 'running'}
                onChange={(e) => updateSchedule(sched.id, { timezone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Tài nguyên mục tiêu"
                value={sched.targetResourceId}
                highlighted={sched.configuringField === 'targetResourceId'}
                disabled={!isHumanControlled && task.status === 'running'}
                onChange={(e) => {
                  const prof = profiles.find((p) => p.id === e.target.value);
                  updateSchedule(sched.id, {
                    targetResourceId: e.target.value,
                    targetResourceLabel: prof ? `${prof.name} · ${prof.alias}` : e.target.value,
                  });
                  setLastHumanNote(`Chọn tài nguyên ${prof?.name ?? e.target.value}`);
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.alias}
                  </option>
                ))}
              </Select>
              <Select
                label="Chính sách phê duyệt"
                value={sched.approvalPolicy}
                highlighted={sched.configuringField === 'approvalPolicy'}
                disabled={!isHumanControlled && task.status === 'running'}
                onChange={(e) =>
                  updateSchedule(sched.id, {
                    approvalPolicy: e.target.value as 'auto' | 'require_approval',
                  })
                }
              >
                <option value="auto">Tự động chạy theo lịch</option>
                <option value="require_approval">Yêu cầu phê duyệt trước khi chạy</option>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    // 2. Browser / Research Simulated Viewport
    if (task.resource.kind === 'browser' || task.resource.kind === 'research') {
      const profile = profiles.find((p) => p.id === (task.profileId ?? 'profile-20')) ?? profiles[0];
      const activeBrowserTab = profile?.tabs.find((tb) => tb.active) ?? profile?.tabs[0];
      const records = researchRecords.filter((r) => r.researchId === task.resource.id);

      return (
        <div className="space-y-3.5">
          {profile && (
            <OwnershipBanner
              resourceId={profile.id}
              resourceKind="browser"
              taskId={task.id}
              editSummary="Người dùng kiểm tra trực tiếp phiên trình duyệt mô phỏng"
            />
          )}

          {/* Demo Browser Shell */}
          <div className="rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2 min-w-0">
                <Chrome className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
                <span className="text-[12px] font-medium text-[var(--color-text-primary)] shrink-0">
                  {profile?.name ?? 'Profile 20'}
                </span>
                <div className="truncate rounded-[4px] bg-[var(--color-canvas)] border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-mono-tech text-[var(--color-text-secondary)]">
                  {activeBrowserTab?.url ?? 'https://demo.tiktok.local/search?q=KANS+377'}
                </div>
              </div>
              <StatusTag tone="neutral">Demo Browser Preview</StatusTag>
            </div>

            {/* Simulated Viewport */}
            <div className="p-4 space-y-3 bg-[var(--color-canvas)]">
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {activeBrowserTab?.title ?? 'TikTok Demo Search'}
                </span>
                <span className="text-[var(--color-accent-text)] font-mono-tech text-[11px]">
                  {isHumanControlled ? 'Manual Control' : 'Observing DOM (Demo)'}
                </span>
              </div>

              {activeBrowserTab?.highlightElement && (
                <div className="rounded-[8px] border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]/55 px-3 py-2 text-[12px] text-[var(--color-text-primary)]">
                  <span className="text-[var(--color-accent-text)] font-medium">Vùng đang tương tác: </span>
                  {activeBrowserTab.highlightElement}
                </div>
              )}

              <p className="text-[12px] text-[var(--color-text-secondary)]">
                {activeBrowserTab?.pageSummary}
              </p>

              {/* Live collected fictional records */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                  <span>Bản ghi mẫu đã quan sát ({records.length})</span>
                  <span>Dữ liệu mẫu mô phỏng</span>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {records.length === 0 ? (
                    <div className="rounded-[6px] border border-dashed border-[var(--color-border)] p-4 text-center text-[12px] text-[var(--color-text-muted)]">
                      Đang khởi tạo phiên trình duyệt mô phỏng và chờ bản ghi đầu tiên...
                    </div>
                  ) : (
                    records.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] px-3 py-2 text-[12px]"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--color-text-primary)] truncate">
                            {r.creator}
                          </p>
                          <p className="text-[var(--color-text-muted)] truncate">{r.caption}</p>
                        </div>
                        <div className="shrink-0 text-right font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                          <div>{formatNumberCompact(r.views)} views</div>
                          <div className="text-[var(--color-text-muted)]">
                            {r.missingFields.length ? `Thiếu: ${r.missingFields.join(', ')}` : 'Đủ chỉ số'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. Publishing Live Workspace
    if (task.resource.kind === 'publishing') {
      const pub = publications.find((p) => p.id === task.resource.id);
      const appr = approvals.find((a) => a.taskId === task.id && a.status === 'pending');
      if (!pub) return null;

      return (
        <div className="space-y-4">
          {appr && (
            <div className="rounded-[10px] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/40 p-3.5 space-y-2.5">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[var(--color-warning)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-h5 text-[var(--color-text-primary)]">{appr.requestedAction}</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">{appr.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => resolveApproval(appr.id, 'approved')}>
                  {t.actions.approve}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => resolveApproval(appr.id, 'rejected')}>
                  {t.actions.reject}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-h5 text-[var(--color-text-primary)]">{pub.platform} · {pub.account}</span>
              <StatusTag tone={pub.status === 'published' ? 'success' : pub.status === 'waiting_approval' ? 'warning' : 'neutral'}>
                {pub.status}
              </StatusTag>
            </div>
            <div className="rounded-[8px] bg-[var(--color-canvas)] border border-[var(--color-border)] p-4 aspect-[16/9] flex flex-col justify-between">
              <span className="text-[11px] font-mono-tech text-[var(--color-text-muted)]">
                Simulated Media Preview · {pub.mediaLabel}
              </span>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{pub.title}</p>
                <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] line-clamp-3">{pub.caption}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4. Media Studio Live Workspace
    if (task.resource.kind === 'media') {
      const asset = mediaAssets.find((m) => m.id === task.resource.id) ?? mediaAssets[0];
      if (!asset) return null;
      const activeScene = asset.scenes[selectedSceneIdx] ?? asset.scenes[0];
      return (
        <div className="space-y-3.5">
          <div
            className="rounded-[10px] border border-[var(--color-border)] p-4 aspect-video flex flex-col justify-between"
            style={{ backgroundColor: asset.accentTone }}
          >
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-white/80">
              <span>{asset.name}</span>
              <span>{asset.resolution} · {asset.durationSec}s</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 border border-white/20 text-white">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
            </div>
            <div className="rounded-[6px] bg-black/55 px-3 py-2 text-[12px] text-white">
              {activeScene?.transcript}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Phân cảnh đã tách (Mô phỏng)</p>
            <div className="grid grid-cols-1 gap-1.5">
              {asset.scenes.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setSelectedSceneIdx(idx)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-[6px] border px-3 py-2 text-left text-[12px] cursor-pointer transition-colors',
                    idx === selectedSceneIdx
                      ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent-border)] text-[var(--color-text-primary)]'
                      : 'bg-[var(--color-surface-1)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
                  )}
                >
                  <span className="truncate font-medium">{sc.label}</span>
                  <span className="font-mono-tech text-[11px] shrink-0">
                    0:{sc.startSec.toString().padStart(2, '0')}–0:{sc.endSec.toString().padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 5. Workflow Live Workspace
    if (task.resource.kind === 'workflow') {
      const wf = workflows.find((w) => w.id === task.resource.id);
      if (!wf) return null;
      return (
        <div className="space-y-3">
          <p className="text-[12px] text-[var(--color-text-secondary)]">{wf.description}</p>
          <div className="space-y-2">
            {wf.nodes.map((node, idx) => (
              <div
                key={node.id}
                className={cn(
                  'flex items-center justify-between rounded-[8px] border px-3 py-2.5 text-[13px]',
                  node.data.status === 'running'
                    ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent-border)]'
                    : 'bg-[var(--color-surface-1)] border-[var(--color-border)]'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">0{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{node.data.label}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">{node.data.description}</p>
                  </div>
                </div>
                <StatusTag
                  tone={
                    node.data.status === 'completed'
                      ? 'success'
                      : node.data.status === 'running'
                      ? 'accent'
                      : node.data.status === 'waiting'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {node.data.status}
                </StatusTag>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. Document Live Workspace
    const doc = knowledgeDocs.find((d) => d.id === task.resource.id);
    return (
      <div className="space-y-3">
        <OwnershipBanner
          resourceId={task.resource.id}
          resourceKind="document"
          taskId={task.id}
          editSummary="Chỉnh sửa trực tiếp tài liệu báo cáo"
        />
        {doc && (
          <Textarea
            label={doc.title}
            rows={12}
            value={doc.content}
            onChange={(e) =>
              upsertKnowledgeDoc({ ...doc, content: e.target.value, updatedAt: new Date().toISOString() })
            }
          />
        )}
      </div>
    );
  };

  return (
    <section
      aria-label="Universal Live Workspace"
      className={cn(
        'flex flex-col h-full bg-[var(--color-sidebar)] border-l border-[var(--color-border)] min-w-0',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-accent-text)]">
            <ResourceKindIcon kind={task.resource.kind} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-h5 text-[var(--color-text-primary)] truncate">
                {t.workspace.liveWorkspace}
              </h2>
              <TaskStatusBadge status={task.status} />
            </div>
            <p className="text-[12px] text-[var(--color-text-muted)] truncate">
              {task.title} · {task.resource.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            title={t.workspace.openFullPage}
            aria-label={t.workspace.openFullPage}
            onClick={handleOpenFull}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={liveMode === 'expanded' ? t.workspace.collapse : t.workspace.expand}
            aria-label={liveMode === 'expanded' ? t.workspace.collapse : t.workspace.expand}
            onClick={() => setLiveWorkspace(liveMode === 'expanded' ? 'split' : 'expanded')}
          >
            {liveMode === 'expanded' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t.workspace.hideLiveWorkspace}
            aria-label={t.workspace.hideLiveWorkspace}
            onClick={() => setLiveWorkspace('hidden')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress & Tabs Bar */}
      <div className="px-4 py-2.5 border-b border-[var(--color-border)] space-y-2.5 shrink-0 bg-[var(--color-surface-1)]/50">
        <TaskProgressBar progress={task.progress} status={task.status} />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <SegmentedTabs
            value={activeTab}
            onChange={setLiveWorkspaceTab}
            items={[
              { value: 'workspace', label: 'Workspace' },
              { value: 'activity', label: t.common.activity, count: taskActivities.length },
              { value: 'evidence', label: t.common.evidence, count: taskEvidences.length },
              { value: 'result', label: t.common.result },
            ]}
          />
          <select
            aria-label="Switch observed task"
            value={task.id}
            onChange={(e) => setLiveWorkspace(liveMode, e.target.value)}
            className="h-7 max-w-[190px] rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 text-[12px] text-[var(--color-text-secondary)]"
          >
            {tasks.slice(0, 10).map((tk) => (
              <option key={tk.id} value={tk.id}>
                {tk.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'workspace' && renderWorkspaceSurface()}

        {activeTab === 'activity' && (
          <div className="space-y-2">
            {taskActivities.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có sự kiện thực thi.</p>
            ) : (
              taskActivities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-tech text-[var(--color-text-muted)]">
                    <span>{act.type}</span>
                    <span>{formatClockOnly(act.timestamp)}</span>
                  </div>
                  <p className="text-[13px] text-[var(--color-text-primary)]">{act.summary}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-2.5">
            {taskEvidences.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Bằng chứng quan sát sẽ xuất hiện khi tác vụ thu thập bản ghi.
              </p>
            ) : (
              taskEvidences.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 space-y-1.5 text-[12px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--color-text-primary)]">{ev.source}</span>
                    <StatusTag tone={ev.validationStatus === 'verified' ? 'success' : 'warning'}>
                      {ev.validationStatus}
                    </StatusTag>
                  </div>
                  <p className="text-[var(--color-text-secondary)]">{ev.observation}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                    <span>Record: {ev.recordIdentity}</span>
                    <span>Missing: {ev.missingFields.length ? ev.missingFields.join(', ') : 'None'}</span>
                    <span>{formatClockOnly(ev.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'result' && (
          <div className="rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
              <h3 className="text-h5 text-[var(--color-text-primary)]">Kết quả tác vụ</h3>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              {task.resultSummary ??
                (task.status === 'failed'
                  ? task.errorMessage
                  : 'Tác vụ đang tiến hành — kết quả tóm tắt sẽ tự động cập nhật ngay khi hoàn tất.')}
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenFull}>
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.workspace.openInWorkspace}</span>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
