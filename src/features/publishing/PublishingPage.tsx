import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Plus,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Publication, PublishingPlatform } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { formatTimeInZone } from '../../lib/format';
import { generateId, cn } from '../../lib/utils';
import {
  Button,
  Card,
  Input,
  SegmentedTabs,
  Select,
  StatusTag,
  Textarea,
} from '../../components/ui/primitives';

const PLATFORMS: PublishingPlatform[] = ['TikTok', 'Facebook', 'Instagram', 'YouTube', 'Threads'];

export function PublishingPage() {
  const { publicationId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const publications = useMiroStore((s) => s.publications);
  const mediaAssets = useMiroStore((s) => s.mediaAssets);
  const approvals = useMiroStore((s) => s.approvals);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const upsertPublication = useMiroStore((s) => s.upsertPublication);
  const updatePublication = useMiroStore((s) => s.updatePublication);
  const resolveApproval = useMiroStore((s) => s.resolveApproval);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [view, setView] = useState<'all' | 'draft' | 'queue' | 'history'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const selectedPub =
    (publicationId ? publications.find((p) => p.id === publicationId) : null) ?? publications[0];

  useEffect(() => {
    setActiveContext(
      selectedPub
        ? {
            resourceKind: 'publishing',
            resourceId: selectedPub.id,
            resourceLabel: `${selectedPub.platform} · ${selectedPub.title}`,
            projectId: selectedPub.projectId,
          }
        : { resourceLabel: undefined }
    );
  }, [selectedPub, setActiveContext]);

  const filtered = useMemo(() => {
    return publications.filter((p) => {
      if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
      if (view === 'draft' && p.status !== 'draft') return false;
      if (view === 'queue' && p.status !== 'queued' && p.status !== 'waiting_approval' && p.status !== 'approved') return false;
      if (view === 'history' && p.status !== 'published' && p.status !== 'rejected') return false;
      return true;
    });
  }, [publications, platformFilter, view]);

  const handleCreate = () => {
    const id = generateId('pub');
    const created: Publication = {
      id,
      title: 'Bản nháp xuất bản mới',
      platform: 'TikTok',
      account: '@miro.demo.beauty',
      mediaAssetId: mediaAssets[0]?.id,
      mediaLabel: mediaAssets[0]?.name ?? 'Chưa đính kèm media',
      caption: 'Nhập nội dung mô tả tại đây...',
      hashtags: ['#KANS377', '#demo'],
      scheduledFor: new Date(Date.now() + 4 * 3600_000).toISOString(),
      status: 'draft',
      projectId: 'proj-kans-377',
      validationIssues: [],
    };
    upsertPublication(created);
    navigate(`/publishing/${id}`);
    toast.success('Đã tạo bản nháp xuất bản mô phỏng');
  };

  const handleSubmitForApproval = (pub: Publication) => {
    if (!pub.caption.trim()) {
      toast.error('Caption không được để trống.');
      return;
    }
    const tk = launchTaskFromInstruction({
      instruction: `Xuất bản mô phỏng "${pub.title}" lên ${pub.platform} (${pub.account})`,
      overrideScenario: 'publish_approval',
      projectId: pub.projectId,
      trigger: 'manual',
      openLive: false,
    });
    updatePublication(pub.id, { status: 'waiting_approval', taskId: tk.id, approvalId: tk.approvalId });
    toast.info('Đã gửi yêu cầu phê duyệt xuất bản tới Trung tâm phê duyệt');
  };

  const pendingApproval = selectedPub
    ? approvals.find((a) => a.targetResourceId === selectedPub.id && a.status === 'pending')
    : undefined;

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.publishing}</h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Chuẩn bị nội dung đa nền tảng và kiểm duyệt an toàn. Mọi thao tác đăng đều được mô phỏng cục bộ.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          <span>Tạo bài xuất bản</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <SegmentedTabs
          value={view}
          onChange={setView}
          items={[
            { value: 'all', label: t.common.all, count: publications.length },
            { value: 'draft', label: 'Bản nháp' },
            { value: 'queue', label: 'Hàng đợi & Chờ duyệt' },
            { value: 'history', label: 'Lịch sử' },
          ]}
        />
        <select
          aria-label="Filter platform"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="h-9 rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2.5 text-[13px] text-[var(--color-text-secondary)]"
        >
          <option value="all">Tất cả nền tảng</option>
          {PLATFORMS.map((pl) => (
            <option key={pl} value={pl}>{pl}</option>
          ))}
        </select>
      </div>

      {/* Main Split: List + Editor + Platform Preview */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left List (3 cols) */}
        <div className="lg:col-span-3 overflow-y-auto space-y-2 pr-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/publishing/${p.id}`)}
              className={cn(
                'w-full rounded-[8px] border p-3 text-left space-y-1.5 transition-colors cursor-pointer',
                p.id === selectedPub?.id
                  ? 'bg-[var(--color-accent-subtle)]/70 border-[var(--color-accent-border)]'
                  : 'bg-[var(--color-surface-1)] border-[var(--color-border)] hover:bg-[var(--color-hover)]'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)]">{p.platform}</span>
                <StatusTag
                  tone={
                    p.status === 'published'
                      ? 'success'
                      : p.status === 'waiting_approval'
                      ? 'warning'
                      : p.status === 'rejected'
                      ? 'error'
                      : 'neutral'
                  }
                >
                  {p.status}
                </StatusTag>
              </div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)] line-clamp-2">{p.title}</p>
              <p className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                {formatTimeInZone(p.scheduledFor, timezone)}
              </p>
            </button>
          ))}
        </div>

        {/* Center Editor (5 cols) */}
        {selectedPub && (
          <Card className="lg:col-span-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-h4 text-[var(--color-text-primary)]">Trình soạn xuất bản</h2>
              <StatusTag tone="neutral">Simulated Only</StatusTag>
            </div>

            {pendingApproval && (
              <div className="rounded-[8px] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/40 p-3 space-y-2">
                <p className="text-[12px] font-medium text-[var(--color-warning)] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Đang chờ phê duyệt xuất bản</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => resolveApproval(pendingApproval.id, 'approved')}>
                    {t.actions.approve}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => resolveApproval(pendingApproval.id, 'rejected')}>
                    {t.actions.reject}
                  </Button>
                </div>
              </div>
            )}

            <Input
              label="Tiêu đề nội bộ"
              value={selectedPub.title}
              onChange={(e) => updatePublication(selectedPub.id, { title: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Nền tảng"
                value={selectedPub.platform}
                onChange={(e) =>
                  updatePublication(selectedPub.id, { platform: e.target.value as PublishingPlatform })
                }
              >
                {PLATFORMS.map((pl) => (
                  <option key={pl} value={pl}>{pl}</option>
                ))}
              </Select>
              <Input
                label="Tài khoản mẫu"
                value={selectedPub.account}
                onChange={(e) => updatePublication(selectedPub.id, { account: e.target.value })}
              />
            </div>

            <Select
              label="Tư liệu Media đính kèm"
              value={selectedPub.mediaAssetId ?? ''}
              onChange={(e) => {
                const asset = mediaAssets.find((m) => m.id === e.target.value);
                updatePublication(selectedPub.id, {
                  mediaAssetId: e.target.value,
                  mediaLabel: asset ? `${asset.name} (${asset.durationSec}s)` : 'Bài viết văn bản',
                });
              }}
            >
              <option value="">Bài viết văn bản</option>
              {mediaAssets.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.durationSec}s)</option>
              ))}
            </Select>

            <Textarea
              label="Caption"
              rows={5}
              value={selectedPub.caption}
              onChange={(e) => updatePublication(selectedPub.id, { caption: e.target.value })}
            />

            <Input
              label="Hashtags (cách nhau bằng dấu cách)"
              value={selectedPub.hashtags.join(' ')}
              onChange={(e) =>
                updatePublication(selectedPub.id, {
                  hashtags: e.target.value.split(/\s+/).filter(Boolean),
                })
              }
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  updatePublication(selectedPub.id, { status: 'queued' });
                  toast.success('Đã đưa vào hàng đợi xuất bản');
                }}
              >
                Đưa vào hàng đợi
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedPub.status === 'published'}
                onClick={() => handleSubmitForApproval(selectedPub)}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi phê duyệt & Xuất bản (Mô phỏng)</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Right Platform Preview (4 cols) */}
        {selectedPub && (
          <Card className="lg:col-span-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-h4 text-[var(--color-text-primary)]">Xem trước · {selectedPub.platform}</h3>
              <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">Mock Preview</span>
            </div>

            <div className="mx-auto w-full max-w-[280px] rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-border-strong)] p-4 space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[var(--color-text-primary)]">{selectedPub.account}</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">{selectedPub.platform}</span>
              </div>
              <div className="rounded-[8px] bg-[#1E2B18] border border-[var(--color-border)] aspect-[9/12] p-3 flex flex-col justify-between">
                <span className="font-mono-tech text-[10px] text-white/75">{selectedPub.mediaLabel}</span>
                <div className="space-y-1">
                  <p className="text-[12px] text-white leading-4 line-clamp-4">{selectedPub.caption}</p>
                  <p className="text-[11px] text-[#C6F432]">{selectedPub.hashtags.join(' ')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <p className="font-medium text-[var(--color-text-secondary)]">Kiểm tra hợp lệ</p>
              {selectedPub.validationIssues.length === 0 ? (
                <p className="flex items-center gap-1.5 text-[var(--color-success)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đạt điều kiện xuất bản mô phỏng.</span>
                </p>
              ) : (
                selectedPub.validationIssues.map((iss, idx) => (
                  <p key={idx} className="text-[var(--color-warning)]">• {iss}</p>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
