import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { DensityMode, Language, ThemeMode } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button, Modal, Select, Switch } from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

const SECTIONS = [
  { id: 'general', label: 'Chung (General)' },
  { id: 'appearance', label: 'Giao diện (Appearance)' },
  { id: 'language', label: 'Ngôn ngữ (Language)' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'ai_models', label: 'AI Models' },
  { id: 'agent_behavior', label: 'Hành vi Agent' },
  { id: 'browser', label: 'Trình duyệt' },
  { id: 'automation', label: 'Tự động hóa' },
  { id: 'permissions', label: 'Quyền hạn' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'notifications', label: 'Thông báo' },
  { id: 'local_storage', label: 'Lưu trữ cục bộ' },
  { id: 'cloud_sync', label: 'Đồng bộ đám mây' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'about', label: 'Về Miro' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-[var(--color-border-subtle)]">
      <div className="space-y-0.5 max-w-[520px]">
        <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="text-[12px] text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useMiroStore((s) => s.settings);
  const profiles = useMiroStore((s) => s.browserProfiles);
  const updateSettings = useMiroStore((s) => s.updateSettings);
  const resetDemoData = useMiroStore((s) => s.resetDemoData);

  const [section, setSection] = useState<SectionId>('appearance');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setConfirmReset(false);
    toast.success('Đã khôi phục toàn bộ dữ liệu mẫu Miro về trạng thái ban đầu.');
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Settings Navigation (~216px) */}
      <aside className="hidden md:flex w-[216px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] overflow-y-auto p-3 space-y-0.5">
        <p className="px-2.5 pb-2 text-h5 text-[var(--color-text-primary)]">{t.nav.settings}</p>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setSection(sec.id)}
            className={cn(
              'w-full rounded-[6px] px-2.5 py-1.5 text-left text-[13px] transition-colors cursor-pointer',
              section === sec.id
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {sec.label}
          </button>
        ))}
      </aside>

      {/* Right Content (max 800px) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[800px] space-y-6">
          {/* Mobile Section Select */}
          <div className="md:hidden">
            <Select
              label="Mục cài đặt"
              value={section}
              onChange={(e) => setSection(e.target.value as SectionId)}
            >
              {SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <h1 className="text-h1 text-[var(--color-text-primary)]">
              {SECTIONS.find((s) => s.id === section)?.label}
            </h1>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
              Mọi tùy chỉnh được lưu cục bộ trên trình duyệt của bạn.
            </p>
          </div>

          {section === 'appearance' && (
            <div>
              <SettingRow
                title="Chủ đề màu sắc (Theme)"
                description="Chọn giữa Midnight Lime (mặc định), Navy Cream, Light Mode hoặc theo hệ điều hành."
                control={
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'midnight-lime', label: 'Midnight Lime' },
                        { id: 'navy-cream', label: 'Navy Cream' },
                        { id: 'light', label: 'Light Mode' },
                        { id: 'system', label: 'System' },
                      ] as { id: ThemeMode; label: string }[]
                    ).map((th) => (
                      <Button
                        key={th.id}
                        variant={settings.theme === th.id ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => updateSettings({ theme: th.id })}
                      >
                        {th.label}
                      </Button>
                    ))}
                  </div>
                }
              />
              <SettingRow
                title="Mật độ bảng dữ liệu (Density)"
                description="Thoải mái (44–48px) hoặc Gọn (36px) cho bảng tác vụ và nghiên cứu."
                control={
                  <Select
                    aria-label="Density mode"
                    value={settings.density}
                    onChange={(e) => updateSettings({ density: e.target.value as DensityMode })}
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </Select>
                }
              />
              <SettingRow
                title="Thu gọn thanh điều hướng mặc định"
                description="Chuyển thanh điều hướng trái sang dạng icon 56px để mở rộng không gian làm việc."
                control={
                  <Switch
                    checked={settings.sidebarCollapsed}
                    ariaLabel="Toggle compact sidebar"
                    onCheckedChange={(v) => updateSettings({ sidebarCollapsed: v })}
                  />
                }
              />
            </div>
          )}

          {section === 'language' && (
            <div>
              <SettingRow
                title="Ngôn ngữ giao diện"
                description="Mặc định Tiếng Việt; hỗ trợ chuyển đổi tức thì sang Tiếng Anh."
                control={
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'vi', label: 'Tiếng Việt' },
                        { id: 'en', label: 'English' },
                      ] as { id: Language; label: string }[]
                    ).map((l) => (
                      <Button
                        key={l.id}
                        variant={settings.language === l.id ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => updateSettings({ language: l.id })}
                      >
                        {l.label}
                      </Button>
                    ))}
                  </div>
                }
              />
            </div>
          )}

          {(section === 'general' || section === 'workspace') && (
            <div>
              <SettingRow
                title="Tên Workspace mặc định"
                description="Hiển thị ở đầu thanh điều hướng."
                control={
                  <Select
                    aria-label="Default workspace"
                    value={settings.defaultWorkspace}
                    onChange={(e) => updateSettings({ defaultWorkspace: e.target.value })}
                  >
                    <option value="Personal Operations">Personal Operations</option>
                    <option value="Content Studio Ops">Content Studio Ops</option>
                    <option value="Research Lab">Research Lab</option>
                  </Select>
                }
              />
              <SettingRow
                title="Múi giờ chuẩn (IANA)"
                description="Áp dụng cho lịch trình, nhật ký hoạt động và thông báo."
                control={
                  <Select
                    aria-label="Default timezone"
                    value={settings.timezone}
                    onChange={(e) => updateSettings({ timezone: e.target.value })}
                  >
                    <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                    <option value="UTC">UTC</option>
                  </Select>
                }
              />
            </div>
          )}

          {(section === 'ai_models' || section === 'agent_behavior') && (
            <div>
              <SettingRow
                title="Mô hình suy luận mô phỏng mặc định"
                description="Lựa chọn mô hình hiển thị trong thanh soạn thảo AI Workspace."
                control={
                  <Select
                    aria-label="Default model"
                    value={settings.defaultModel}
                    onChange={(e) => updateSettings({ defaultModel: e.target.value })}
                  >
                    <option value="Miro Core (Simulated)">Miro Core (Simulated)</option>
                    <option value="Miro Fast (Simulated)">Miro Fast (Simulated)</option>
                    <option value="Miro Deep Research (Simulated)">Miro Deep Research (Simulated)</option>
                  </Select>
                }
              />
              <SettingRow
                title="Tự động mở Live Workspace khi chạy tác vụ"
                description="Chia đôi màn hình ngay khi Miro bắt đầu tác vụ từ AI Workspace."
                control={
                  <Switch
                    checked={settings.autoOpenLiveWorkspace}
                    ariaLabel="Auto open live workspace"
                    onCheckedChange={(v) => updateSettings({ autoOpenLiveWorkspace: v })}
                  />
                }
              />
              <SettingRow
                title="Cho phép chạy nền khi chuyển trang"
                description="Tác vụ mô phỏng tiếp tục tiến triển khi bạn đóng Live Workspace hoặc chuyển sang trang khác."
                control={
                  <Switch
                    checked={settings.allowBackgroundExecution}
                    ariaLabel="Allow background execution"
                    onCheckedChange={(v) => updateSettings({ allowBackgroundExecution: v })}
                  />
                }
              />
            </div>
          )}

          {(section === 'browser' || section === 'automation' || section === 'permissions' || section === 'security') && (
            <div>
              <SettingRow
                title="Browser Profile mặc định"
                description="Profile được ưu tiên chọn khi khởi chạy tác vụ nghiên cứu mới."
                control={
                  <Select
                    aria-label="Default browser profile"
                    value={settings.defaultProfileId}
                    onChange={(e) => updateSettings({ defaultProfileId: e.target.value })}
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.alias}
                      </option>
                    ))}
                  </Select>
                }
              />
              <SettingRow
                title="Bắt buộc phê duyệt trước khi xuất bản"
                description="Mọi hành động xuất bản công khai đều dừng ở trạng thái Chờ phê duyệt."
                control={
                  <Switch
                    checked={settings.requireApprovalForPublishing}
                    ariaLabel="Require approval for publishing"
                    onCheckedChange={(v) => updateSettings({ requireApprovalForPublishing: v })}
                  />
                }
              />
              <SettingRow
                title="Chính sách bảo mật nguyên mẫu"
                description="Không lưu cookie thật, không yêu cầu mật khẩu hay API key trong giao diện frontend."
                control={<span className="font-mono-tech text-[12px] text-[var(--color-success)]">ENFORCED</span>}
              />
            </div>
          )}

          {section === 'notifications' && (
            <div>
              <SettingRow
                title="Thông báo khi hoàn tất tác vụ"
                description="Hiển thị toast và ghi nhận trong trung tâm thông báo khi tác vụ kết thúc."
                control={
                  <Switch
                    checked={settings.notifyOnCompletion}
                    ariaLabel="Notify on completion"
                    onCheckedChange={(v) => updateSettings({ notifyOnCompletion: v })}
                  />
                }
              />
              <SettingRow
                title="Nhắc khi có yêu cầu phê duyệt"
                description="Đánh dấu màu hổ phách trên thanh tiêu đề khi có hành động cần bạn duyệt."
                control={
                  <Switch
                    checked={settings.notifyOnApproval}
                    ariaLabel="Notify on approval"
                    onCheckedChange={(v) => updateSettings({ notifyOnApproval: v })}
                  />
                }
              />
            </div>
          )}

          {(section === 'local_storage' || section === 'cloud_sync' || section === 'runtime' || section === 'about') && (
            <div>
              <SettingRow
                title="Khôi phục dữ liệu mẫu (Reset Demo Data)"
                description="Đưa toàn bộ tác vụ, lịch trình, nghiên cứu, phê duyệt và hội thoại về bộ dữ liệu mẫu gốc."
                control={
                  <Button variant="destructive" size="sm" onClick={() => setConfirmReset(true)}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.actions.resetDemo}</span>
                  </Button>
                }
              />
              <SettingRow
                title="Cloud Sync & Desktop Runtime"
                description="Nguyên mẫu trình duyệt hiện chạy hoàn toàn cục bộ. Tác vụ mô phỏng không tiếp tục sau khi đóng tab trình duyệt."
                control={<span className="font-mono-tech text-[12px] text-[var(--color-text-muted)]">LOCAL PROTOTYPE</span>}
              />
              <SettingRow
                title="Miro Design System 01"
                description="Command. Execute. Observe. Control. · Intelligence, in motion."
                control={<span className="font-mono-tech text-[12px] text-[var(--color-accent-text)]">v2.0 Prototype</span>}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t.actions.resetDemo}
        description="Hành động này sẽ xóa toàn bộ chỉnh sửa hiện tại trong localStorage và nạp lại bộ dữ liệu mẫu ban đầu."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReset}>Xác nhận khôi phục</Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Chủ đề màu sắc và ngôn ngữ hiện tại của bạn sẽ được giữ nguyên.
        </p>
      </Modal>
    </div>
  );
}
