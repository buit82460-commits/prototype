import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatTimeInZone } from '../../lib/format';
import { Button, Drawer, StatusTag } from '../ui/primitives';
import { cn } from '../../lib/utils';

export function ApprovalCenterDrawer() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const open = useMiroStore((s) => s.approvalCenterOpen);
  const setOpen = useMiroStore((s) => s.setApprovalCenterOpen);
  const approvals = useMiroStore((s) => s.approvals);
  const interventions = useMiroStore((s) => s.interventions);
  const notifications = useMiroStore((s) => s.notifications);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const resolveApproval = useMiroStore((s) => s.resolveApproval);
  const markAllNotificationsRead = useMiroStore((s) => s.markAllNotificationsRead);
  const markNotificationRead = useMiroStore((s) => s.markNotificationRead);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const openInterventions = interventions.filter((i) => !i.resolved);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={t.header.approvals}
      subtitle="Phê duyệt, can thiệp vận hành và thông báo hệ thống"
      widthClass="w-full sm:w-[440px]"
    >
      <div className="space-y-6">
        {/* 1. Approval Required */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-h5 text-[var(--color-text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--color-warning)]" />
              <span>Cần phê duyệt</span>
            </h3>
            <span className="font-mono-tech text-[12px] text-[var(--color-text-muted)]">
              {pendingApprovals.length}
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <p className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-3 text-[12px] text-[var(--color-text-muted)]">
              Không có yêu cầu phê duyệt nào đang chờ.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className="rounded-[10px] border border-[var(--color-warning)]/40 bg-[var(--color-warning-bg)]/50 p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-h5 text-[var(--color-text-primary)]">{appr.requestedAction}</p>
                    <StatusTag tone="warning">Pending</StatusTag>
                  </div>
                  <div className="text-[12px] space-y-1 text-[var(--color-text-secondary)]">
                    <p><span className="text-[var(--color-text-muted)]">Tài nguyên:</span> {appr.targetResourceLabel}</p>
                    <p><span className="text-[var(--color-text-muted)]">Lý do:</span> {appr.reason}</p>
                    <p><span className="text-[var(--color-text-muted)]">Hệ quả:</span> {appr.consequences}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
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
                        toast.info('Đã từ chối yêu cầu phê duyệt');
                      }}
                    >
                      {t.actions.reject}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/tasks/${appr.taskId}`);
                      }}
                    >
                      {t.actions.viewTask}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. Intervention Required */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-h5 text-[var(--color-text-primary)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--color-error)]" />
              <span>Cần can thiệp sự cố</span>
            </h3>
            <span className="font-mono-tech text-[12px] text-[var(--color-text-muted)]">
              {openInterventions.length}
            </span>
          </div>

          {openInterventions.length === 0 ? (
            <p className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-3 text-[12px] text-[var(--color-text-muted)]">
              Mọi tài nguyên đang vận hành bình thường.
            </p>
          ) : (
            <div className="space-y-2.5">
              {openInterventions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[10px] border border-[var(--color-error)]/35 bg-[var(--color-error-bg)]/45 p-3.5 space-y-2"
                >
                  <p className="text-h5 text-[var(--color-text-primary)]">{item.problem}</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-muted)]">Tài nguyên:</span> {item.affectedResourceLabel}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-muted)]">Khuyến nghị:</span> {item.recommendedAction}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      navigate(item.workspaceRoute);
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Workspace xử lý</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Informational Notifications */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-h5 text-[var(--color-text-primary)] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span>{t.header.notifications}</span>
            </h3>
            {notifications.some((n) => !n.read) && (
              <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đánh dấu đã đọc</span>
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'rounded-[8px] border px-3 py-2.5 text-[12px] transition-colors',
                  n.read
                    ? 'bg-[var(--color-surface-1)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="leading-5">{n.message}</p>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="text-[11px] text-[var(--color-accent-text)] shrink-0 hover:underline cursor-pointer"
                    >
                      Đã đọc
                    </button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                  <span className="font-mono-tech">{formatTimeInZone(n.timestamp, timezone)}</span>
                  {n.relatedRoute && (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        setOpen(false);
                        navigate(n.relatedRoute!);
                      }}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline cursor-pointer"
                    >
                      {n.relatedLabel ?? 'Mở'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Drawer>
  );
}
