import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { isTaskActive, isTaskTerminal, isTaskWaiting } from '../../domain/taskMachine';
import { Button, Drawer, Modal, SegmentedTabs } from '../ui/primitives';
import { LiveTaskCard } from '../shared/LiveTaskCard';

export function TaskMonitorDrawer() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const open = useMiroStore((s) => s.taskMonitorOpen);
  const setOpen = useMiroStore((s) => s.setTaskMonitorOpen);
  const tasks = useMiroStore((s) => s.tasks);
  const stopAllAutomatedTasks = useMiroStore((s) => s.stopAllAutomatedTasks);

  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'completed'>('all');
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);

  const activeTasks = tasks.filter((tk) => isTaskActive(tk.status));
  const waitingTasks = tasks.filter((tk) => isTaskWaiting(tk.status));
  const pausedTasks = tasks.filter((tk) => tk.status === 'paused');
  const completedTasks = tasks.filter((tk) => isTaskTerminal(tk.status));

  const visibleGroups = [
    { key: 'active', title: 'Đang chạy & Hàng đợi', items: activeTasks, show: filter === 'all' || filter === 'active' },
    { key: 'waiting', title: 'Chờ phê duyệt / Tài nguyên', items: waitingTasks, show: filter === 'all' || filter === 'waiting' },
    { key: 'paused', title: 'Đã tạm dừng', items: pausedTasks, show: filter === 'all' || filter === 'waiting' },
    { key: 'completed', title: 'Hoàn tất gần đây', items: completedTasks.slice(0, 6), show: filter === 'all' || filter === 'completed' },
  ];

  const handleConfirmStopAll = () => {
    const count = stopAllAutomatedTasks();
    setConfirmStopOpen(false);
    toast.warning(`Đã dừng ${count} tác vụ tự động trong trạng thái hệ thống.`);
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t.header.taskMonitor}
        subtitle={`${activeTasks.length} đang chạy · ${waitingTasks.length} chờ xử lý`}
        widthClass="w-full sm:w-[420px]"
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setOpen(false);
                navigate('/tasks');
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem tất cả tác vụ</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={activeTasks.length === 0 && waitingTasks.length === 0}
              onClick={() => setConfirmStopOpen(true)}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Dừng tất cả</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <SegmentedTabs
            value={filter}
            onChange={setFilter}
            className="w-full justify-between"
            items={[
              { value: 'all', label: t.common.all, count: tasks.length },
              { value: 'active', label: 'Đang chạy', count: activeTasks.length },
              { value: 'waiting', label: 'Chờ', count: waitingTasks.length + pausedTasks.length },
              { value: 'completed', label: 'Xong', count: completedTasks.length },
            ]}
          />

          <div className="space-y-5">
            {visibleGroups
              .filter((g) => g.show && g.items.length > 0)
              .map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
                    <span>{group.title}</span>
                    <span className="font-mono-tech">{group.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((task) => (
                      <LiveTaskCard key={task.id} task={task} compact showLiveButton />
                    ))}
                  </div>
                </div>
              ))}

            {visibleGroups.every((g) => !g.show || g.items.length === 0) && (
              <div className="rounded-[8px] border border-dashed border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
                Không có tác vụ nào trong bộ lọc này.
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <Modal
        open={confirmStopOpen}
        onClose={() => setConfirmStopOpen(false)}
        title={t.actions.stopAll}
        description="Hành động này sẽ tạm dừng ngay toàn bộ tác vụ tự động đang chạy và giải phóng các profile trình duyệt mô phỏng đang bận."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmStopOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmStopAll}>
              Xác nhận dừng tất cả
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Các tác vụ đã tạm dừng vẫn được lưu nguyên tiến độ hiện tại trong trang Tác vụ để bạn kiểm tra hoặc tiếp tục sau.
        </p>
      </Modal>
    </>
  );
}
