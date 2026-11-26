import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Chrome,
  Folder,
  Play,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { isTaskActive } from '../../domain/taskMachine';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { formatTimeInZone } from '../../lib/format';
import { Button, Card, StatusTag } from '../../components/ui/primitives';
import { LiveTaskCard } from '../../components/shared/LiveTaskCard';

export function OverviewPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tasks = useMiroStore((s) => s.tasks);
  const approvals = useMiroStore((s) => s.approvals);
  const interventions = useMiroStore((s) => s.interventions);
  const schedules = useMiroStore((s) => s.schedules);
  const profiles = useMiroStore((s) => s.browserProfiles);
  const activities = useMiroStore((s) => s.activities);
  const projects = useMiroStore((s) => s.projects);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const resolveApproval = useMiroStore((s) => s.resolveApproval);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  useEffect(() => {
    setActiveContext({ resourceLabel: undefined });
  }, [setActiveContext]);

  const runningTasks = tasks.filter((tk) => tk.status === 'running' || tk.status === 'planning' || tk.status === 'recovering');
  const queuedTasks = tasks.filter((tk) => tk.status === 'queued' || tk.status === 'waiting_for_resource');
  const completedTasks = tasks.filter((tk) => tk.status === 'completed' || tk.status === 'partial');
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const openInterventions = interventions.filter((i) => !i.resolved);
  const needsAttentionCount = pendingApprovals.length + openInterventions.length;

  const activeList = tasks.filter((tk) => isTaskActive(tk.status) || tk.status === 'waiting_for_approval' || tk.status === 'waiting_for_resource');

  const handleQuickLaunchMulti = () => {
    launchTaskFromInstruction({
      instruction: 'Tìm và phân tích 10 video KANS 377 trên TikTok bằng Profile 20.',
      profileId: 'profile-20',
      overrideScenario: 'tiktok_research',
      trigger: 'manual',
      openLive: false,
    });
    launchTaskFromInstruction({
      instruction: 'Tạo lịch nghiên cứu 10 video TikTok về KANS 377 vào 8 giờ sáng mỗi ngày.',
      profileId: 'profile-21',
      overrideScenario: 'schedule_create',
      trigger: 'manual',
      openLive: false,
    });
    toast.success('Đã khởi chạy song song 2 tác vụ trên 2 tài nguyên khác nhau (Kịch bản C)');
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1360px] space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.overview}</h1>
            <p className="text-[14px] text-[var(--color-text-secondary)]">
              Trạng thái vận hành thời gian thực của các tác vụ, tài nguyên và yêu cầu cần bạn quyết định.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleQuickLaunchMulti}>
              <Play className="w-4 h-4" />
              <span>Chạy thử đa tác vụ (Kịch bản C)</span>
            </Button>
            <Button variant="primary" onClick={() => navigate('/workspace')}>
              <Plus className="w-4 h-4" />
              <span>Giao việc mới</span>
            </Button>
          </div>
        </div>

        {/* Row 1: 4 Compact Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1.5">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Đang thực thi</p>
            <div className="flex items-baseline justify-between">
              <span className="text-h1 font-mono-tech text-[var(--color-accent-text)]">
                {runningTasks.length}
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">tác vụ</span>
            </div>
          </Card>

          <Card className="p-4 space-y-1.5">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Đang chờ hàng đợi</p>
            <div className="flex items-baseline justify-between">
              <span className="text-h1 font-mono-tech text-[var(--color-text-primary)]">
                {queuedTasks.length}
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">hàng đợi</span>
            </div>
          </Card>

          <Card className="p-4 space-y-1.5">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Hoàn tất hôm nay</p>
            <div className="flex items-baseline justify-between">
              <span className="text-h1 font-mono-tech text-[var(--color-success)]">
                {completedTasks.length}
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">kết quả</span>
            </div>
          </Card>

          <Card className="p-4 space-y-1.5">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Cần bạn xử lý</p>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-h1 font-mono-tech ${
                  needsAttentionCount > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {needsAttentionCount}
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">duyệt / sự cố</span>
            </div>
          </Card>
        </div>

        {/* Row 2: 8-col Active Tasks + 4-col Needs Your Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <section className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 text-[var(--color-text-primary)]">Tác vụ đang hoạt động</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                <span>Xem toàn bộ ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {activeList.length === 0 ? (
              <Card className="p-6 text-center space-y-3">
                <p className="text-[14px] text-[var(--color-text-secondary)]">
                  Hiện không có tác vụ nào đang chạy nền. Bạn có thể giao việc từ AI Workspace hoặc chạy thử kịch bản đa tác vụ.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleQuickLaunchMulti}>
                    Chạy thử 2 tác vụ song song
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => navigate('/workspace')}>
                    Mở AI Workspace
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeList.slice(0, 5).map((task) => (
                  <LiveTaskCard key={task.id} task={task} compact />
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-4 space-y-3">
            <h2 className="text-h3 text-[var(--color-text-primary)]">Cần bạn chú ý</h2>
            <div className="space-y-3">
              {pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className="rounded-[10px] border border-[var(--color-warning)]/40 bg-[var(--color-warning-bg)]/45 p-4 space-y-2.5"
                >
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-h5 text-[var(--color-text-primary)]">{appr.requestedAction}</p>
                      <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{appr.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        resolveApproval(appr.id, 'approved');
                        toast.success('Đã phê duyệt hành động mô phỏng');
                      }}
                    >
                      {t.actions.approve}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        resolveApproval(appr.id, 'rejected');
                        toast.info('Đã từ chối yêu cầu');
                      }}
                    >
                      {t.actions.reject}
                    </Button>
                  </div>
                </div>
              ))}

              {openInterventions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[10px] border border-[var(--color-error)]/35 bg-[var(--color-error-bg)]/45 p-4 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-h5 text-[var(--color-text-primary)]">{item.problem}</p>
                      <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
                        {item.recommendedAction}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(item.workspaceRoute)}
                  >
                    Mở {item.affectedResourceLabel}
                  </Button>
                </div>
              ))}

              {needsAttentionCount === 0 && (
                <Card className="p-5 text-center text-[13px] text-[var(--color-text-muted)]">
                  Không có phê duyệt tồn đọng hoặc cảnh báo tài nguyên.
                </Card>
              )}
            </div>
          </section>
        </div>

        {/* Row 3: Upcoming Schedules + Connected Resources + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-h4 text-[var(--color-text-primary)] flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span>Lịch trình sắp chạy</span>
              </h3>
              <button
                type="button"
                onClick={() => navigate('/schedules')}
                className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Tất cả
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {schedules.slice(0, 4).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => navigate(`/schedules/${sc.id}`)}
                  className="flex w-full items-center justify-between gap-2 py-2.5 text-left hover:bg-[var(--color-hover)]/50 px-1 rounded-[4px] cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                      {sc.name}
                    </p>
                    <p className="text-[11px] font-mono-tech text-[var(--color-text-muted)]">
                      {sc.time} · {sc.recurrence} · {sc.timezone}
                    </p>
                  </div>
                  <StatusTag tone={sc.enabled ? 'success' : 'neutral'}>
                    {sc.enabled ? 'Bật' : 'Tắt'}
                  </StatusTag>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-h4 text-[var(--color-text-primary)] flex items-center gap-2">
                <Chrome className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span>Tài nguyên trình duyệt</span>
              </h3>
              <button
                type="button"
                onClick={() => navigate('/browser')}
                className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Quản lý
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/browser/${p.id}`)}
                  className="flex w-full items-center justify-between gap-2 py-2.5 text-left hover:bg-[var(--color-hover)]/50 px-1 rounded-[4px] cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                      {p.name} · <span className="text-[var(--color-text-secondary)] font-normal">{p.alias}</span>
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Xác minh: {p.identityVerification}
                    </p>
                  </div>
                  <StatusTag
                    tone={
                      p.connectionState === 'connected'
                        ? 'success'
                        : p.connectionState === 'busy'
                        ? 'accent'
                        : p.connectionState === 'disconnected'
                        ? 'error'
                        : 'warning'
                    }
                  >
                    {p.connectionState}
                  </StatusTag>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-h4 text-[var(--color-text-primary)]">Hoạt động gần đây</h3>
              <button
                type="button"
                onClick={() => navigate('/activity')}
                className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Nhật ký
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="py-2 space-y-0.5">
                  <p className="text-[12px] text-[var(--color-text-primary)] line-clamp-2">
                    {act.summary}
                  </p>
                  <p className="text-[11px] font-mono-tech text-[var(--color-text-muted)]">
                    {formatTimeInZone(act.timestamp, timezone)}
                    {act.resourceLabel ? ` · ${act.resourceLabel}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom: Recent Projects */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 text-[var(--color-text-primary)]">Dự án gần đây</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              <span>Tất cả dự án</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((proj) => {
              const projTaskCount = tasks.filter((tk) => tk.projectId === proj.id).length;
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4 text-left hover:border-[var(--color-border-strong)] transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 text-[var(--color-accent-text)] shrink-0" />
                      <span className="text-h5 text-[var(--color-text-primary)] truncate">
                        {proj.name}
                      </span>
                    </div>
                    <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                      {projTaskCount} tác vụ
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-2">
                    {proj.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
