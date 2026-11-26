import { useState } from 'react';
import { SendHorizontal, Sparkles } from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { Button, Drawer } from '../ui/primitives';
import { LiveTaskCard } from '../shared/LiveTaskCard';

export function ContextualAiAssistantDrawer() {
  const { t } = useTranslation();
  const open = useMiroStore((s) => s.aiAssistantOpen);
  const setOpen = useMiroStore((s) => s.setAiAssistantOpen);
  const activeContext = useMiroStore((s) => s.activeContext);
  const tasks = useMiroStore((s) => s.tasks);
  const projects = useMiroStore((s) => s.projects);

  const [input, setInput] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const boundProject = projects.find((p) => p.id === activeContext.projectId);
  const relatedTasks = tasks.filter(
    (tk) =>
      recentIds.includes(tk.id) ||
      (activeContext.resourceId && tk.resource.id === activeContext.resourceId)
  );

  const handleSubmit = (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt) return;
    const contextPrefix = activeContext.resourceLabel
      ? `[Ngữ cảnh: ${activeContext.resourceLabel}] `
      : '';
    const task = launchTaskFromInstruction({
      instruction: `${contextPrefix}${prompt}`,
      projectId: activeContext.projectId,
      trigger: 'chat',
      openLive: false,
    });
    setRecentIds((prev) => [task.id, ...prev]);
    setInput('');
  };

  const quickSuggestions = activeContext.resourceKind === 'media'
    ? ['Phân tích video này và tách các phân cảnh chính', 'Tạo bản nháp xuất bản TikTok từ video này']
    : activeContext.resourceKind === 'schedule'
    ? ['Kiểm tra lại lịch trình này và đề xuất tối ưu khung giờ']
    : ['Tìm và phân tích 10 video KANS 377 trên TikTok bằng Profile 20', 'Soạn báo cáo tổng hợp cho tài nguyên hiện tại'];

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={t.header.aiAssistant}
      subtitle="Hoạt động gắn liền tài nguyên bạn đang mở"
      widthClass="w-full sm:w-[400px]"
    >
      <div className="flex flex-col h-full justify-between gap-4">
        <div className="space-y-4">
          {/* Active Context Box */}
          <div className="rounded-[8px] bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 space-y-1 text-[12px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
              Ngữ cảnh đang gắn kết
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {activeContext.resourceLabel ?? 'Toàn bộ Workspace hiện tại'}
            </p>
            {boundProject && (
              <p className="text-[var(--color-text-secondary)]">Dự án: {boundProject.name}</p>
            )}
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Chỉ tài nguyên bạn đang chọn được gửi làm ngữ cảnh rõ ràng.
            </p>
          </div>

          {/* Quick Contextual Suggestions */}
          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Gợi ý nhanh theo ngữ cảnh</p>
            <div className="flex flex-col gap-1.5">
              {quickSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubmit(s)}
                  className="flex items-center gap-2 rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] px-3 py-2 text-left text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-text)] shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Task Responses */}
          {relatedTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                Tác vụ liên quan ({relatedTasks.length})
              </p>
              {relatedTasks.slice(0, 4).map((tk) => (
                <LiveTaskCard key={tk.id} task={tk} compact showLiveButton={false} />
              ))}
            </div>
          )}
        </div>

        {/* Compact Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="rounded-[12px] bg-[var(--color-surface-2)] border border-[var(--color-border)] p-2.5 space-y-2"
        >
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              activeContext.resourceLabel
                ? `Ra lệnh cho Miro về "${activeContext.resourceLabel}"...`
                : 'Nhập yêu cầu cho Miro...'
            }
            className="w-full resize-none bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--color-text-muted)]">Đóng bảng không làm dừng tác vụ</span>
            <Button type="submit" variant="primary" size="sm" disabled={!input.trim()}>
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>{t.workspace.send}</span>
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  );
}
