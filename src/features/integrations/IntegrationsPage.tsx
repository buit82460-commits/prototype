import { useState } from 'react';
import {
  Bot,
  Chrome,
  Database,
  Globe,
  Plug,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import type { IntegrationItem } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button, Card, Modal, StatusTag } from '../../components/ui/primitives';

const CATEGORY_META: Record<
  IntegrationItem['category'],
  { title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ai_models: { title: 'AI Models', icon: Bot },
  browser_runtime: { title: 'Browser & Runtime', icon: Chrome },
  data: { title: 'Data & Storage', icon: Database },
  automation: { title: 'Automation', icon: Workflow },
  connectivity: { title: 'Connectivity', icon: Globe },
};

export function IntegrationsPage() {
  const { t } = useTranslation();
  const integrations = useMiroStore((s) => s.integrations);
  const updateIntegrationStatus = useMiroStore((s) => s.updateIntegrationStatus);

  const [configuring, setConfiguring] = useState<IntegrationItem | null>(null);

  const statusMeta = (status: IntegrationItem['status']) => {
    switch (status) {
      case 'simulated_connected':
        return { label: 'Simulated connected', tone: 'success' as const };
      case 'not_configured':
        return { label: 'Not configured', tone: 'neutral' as const };
      case 'unavailable':
        return { label: 'Unavailable', tone: 'warning' as const };
      case 'coming_soon':
        return { label: 'Coming soon', tone: 'info' as const };
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.integrations}</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Trạng thái kết nối dịch vụ trong bản nguyên mẫu. Không yêu cầu API key thật và không đánh dấu sai trạng thái hoạt động.
          </p>
        </div>

        {(Object.keys(CATEGORY_META) as IntegrationItem['category'][]).map((cat) => {
          const items = integrations.filter((i) => i.category === cat);
          const Icon = CATEGORY_META[cat].icon;
          return (
            <section key={cat} className="space-y-3">
              <h2 className="text-h4 text-[var(--color-text-primary)] flex items-center gap-2">
                <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span>{CATEGORY_META[cat].title}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => {
                  const st = statusMeta(item.status);
                  return (
                    <Card key={item.id} className="p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                              <Plug className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-h5 text-[var(--color-text-primary)]">{item.name}</h3>
                          </div>
                          <StatusTag tone={st.tone}>{st.label}</StatusTag>
                        </div>
                        <p className="text-[12px] text-[var(--color-text-secondary)]">{item.description}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{item.note}</p>
                      </div>
                      <div className="pt-2 border-t border-[var(--color-border-subtle)] flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={item.status === 'coming_soon' || item.status === 'unavailable'}
                          onClick={() => setConfiguring(item)}
                        >
                          Cấu hình mô phỏng
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Modal
        open={Boolean(configuring)}
        onClose={() => setConfiguring(null)}
        title={configuring ? `Cấu hình mô phỏng · ${configuring.name}` : ''}
        description="Bản nguyên mẫu không thu thập API key thật. Bạn chỉ bật/tắt trạng thái kết nối mô phỏng."
        footer={
          configuring && (
            <>
              <Button variant="secondary" onClick={() => setConfiguring(null)}>Đóng</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const next =
                    configuring.status === 'simulated_connected'
                      ? 'not_configured'
                      : 'simulated_connected';
                  updateIntegrationStatus(
                    configuring.id,
                    next,
                    next === 'simulated_connected'
                      ? 'Đang bật chế độ mô phỏng cục bộ.'
                      : 'Chưa cấu hình (chế độ nguyên mẫu).'
                  );
                  toast.success(`Đã cập nhật ${configuring.name} -> ${next}`);
                  setConfiguring(null);
                }}
              >
                {configuring.status === 'simulated_connected' ? 'Ngắt mô phỏng' : 'Bật kết nối mô phỏng'}
              </Button>
            </>
          )
        }
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Khi tích hợp với Miro Runtime backend trong tương lai, khóa xác thực sẽ được cấu hình bảo mật ở tầng máy chủ, không lưu trong giao diện trình duyệt.
        </p>
      </Modal>
    </div>
  );
}
