import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  Download,
  ExternalLink,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { formatNumberCompact, formatTimeInZone } from '../../lib/format';
import {
  Button,
  Card,
  SegmentedTabs,
  StatusTag,
  Textarea,
} from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

type RecordSortKey = 'creator' | 'views' | 'likes' | 'comments' | 'shares';

export function ResearchPage() {
  const { researchId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const researchProjects = useMiroStore((s) => s.researchProjects);
  const researchRecords = useMiroStore((s) => s.researchRecords);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const updateResearchRecordNotes = useMiroStore((s) => s.updateResearchRecordNotes);
  const updateResearchProjectNotes = useMiroStore((s) => s.updateResearchProjectNotes);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [tab, setTab] = useState<'results' | 'sources' | 'notes' | 'summary'>('results');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RecordSortKey>('views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [showSharesCol, setShowSharesCol] = useState(true);

  const activeResearch = researchId ? researchProjects.find((r) => r.id === researchId) : null;

  useEffect(() => {
    setActiveContext(
      activeResearch
        ? {
            resourceKind: 'research',
            resourceId: activeResearch.id,
            resourceLabel: activeResearch.title,
            projectId: activeResearch.projectId,
          }
        : { resourceLabel: undefined }
    );
  }, [activeResearch, setActiveContext]);

  const toggleSort = (key: RecordSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const records = useMemo(() => {
    if (!activeResearch) return [];
    const base = researchRecords.filter((r) => {
      if (r.researchId !== activeResearch.id) return false;
      if (showMissingOnly && r.missingFields.length === 0) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.creator.toLowerCase().includes(q) ||
          r.caption.toLowerCase().includes(q) ||
          r.hashtags.join(' ').toLowerCase().includes(q)
        );
      }
      return true;
    });
    const mult = sortDir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      if (sortKey === 'creator') return a.creator.localeCompare(b.creator) * mult;
      return ((a[sortKey] ?? -1) - (b[sortKey] ?? -1)) * mult;
    });
  }, [activeResearch, researchRecords, search, showMissingOnly, sortKey, sortDir]);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  const handleExportJson = () => {
    if (!activeResearch) return;
    const blob = new Blob(
      [JSON.stringify({ sampleNotice: 'Fictional Miro prototype data', research: activeResearch, records }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeResearch.id}-demo.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất tệp JSON dữ liệu mẫu');
  };

  const SortHeader = ({ label, k }: { label: string; k: RecordSortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)] cursor-pointer whitespace-nowrap"
    >
      <span>{label}</span>
      <ArrowUpDown className={cn('w-3 h-3', sortKey === k ? 'text-[var(--color-accent-text)]' : 'opacity-45')} />
    </button>
  );

  // Research Project List
  if (!activeResearch) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.research}</h1>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Quản lý bảng thu thập và bằng chứng quan sát. Toàn bộ chỉ số đều được gắn nhãn dữ liệu mẫu mô phỏng.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                const created = launchTaskFromInstruction({
                  instruction: 'Tìm và phân tích 10 video KANS 377 trên TikTok bằng Profile 20.',
                  overrideScenario: 'tiktok_research',
                  trigger: 'manual',
                  openLive: false,
                });
                navigate(created.resource.route);
                toast.success('Đã khởi chạy tác vụ nghiên cứu 10 video mẫu');
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Nghiên cứu mới (10 video mẫu)</span>
            </Button>
          </div>

          <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[680px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="h-[36px] text-[12px] font-medium text-[var(--color-text-secondary)]">
                  <th className="px-4">Tên dự án nghiên cứu</th>
                  <th className="px-4">Loại</th>
                  <th className="px-4">Bản ghi thu thập</th>
                  <th className="px-4">Trạng thái</th>
                  <th className="px-4">Cập nhật cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {researchProjects.map((rp) => {
                  const count = researchRecords.filter((r) => r.researchId === rp.id).length;
                  return (
                    <tr
                      key={rp.id}
                      onClick={() => navigate(`/research/${rp.id}`)}
                      className="h-[52px] hover:bg-[var(--color-hover)]/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4">
                        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{rp.title}</p>
                        <p className="text-[11px] font-mono-tech text-[var(--color-text-muted)]">
                          {rp.platform} · Query: "{rp.query}"
                        </p>
                      </td>
                      <td className="px-4 text-[12px] text-[var(--color-text-secondary)]">{rp.researchType}</td>
                      <td className="px-4 font-mono-tech text-[12px] text-[var(--color-text-primary)]">
                        {count}/{rp.targetCount}
                      </td>
                      <td className="px-4">
                        <StatusTag tone={rp.status === 'completed' ? 'success' : rp.status === 'running' ? 'accent' : 'warning'}>
                          {rp.status}
                        </StatusTag>
                      </td>
                      <td className="px-4 font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                        {formatTimeInZone(rp.lastActivity, timezone)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Research Detail View
  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-4 sm:p-6 gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/research')} className="px-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Danh sách nghiên cứu</span>
              </Button>
              <StatusTag tone="neutral">{t.common.sampleDataBadge}</StatusTag>
            </div>
            <h1 className="text-h2 text-[var(--color-text-primary)]">{activeResearch.title}</h1>
            <p className="text-[12px] font-mono-tech text-[var(--color-text-muted)]">
              {activeResearch.platform} · Query: "{activeResearch.query}" · {records.length}/{activeResearch.targetCount} bản ghi mẫu
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportJson}>
            <Download className="w-3.5 h-3.5" />
            <span>{t.actions.exportDemo}</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'results', label: 'Kết quả', count: records.length },
              { value: 'sources', label: 'Nguồn', count: activeResearch.sources.length },
              { value: 'notes', label: 'Ghi chú' },
              { value: 'summary', label: 'Tóm tắt' },
            ]}
          />

          {tab === 'results' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-[220px]">
                <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Lọc creator, caption..."
                  className="h-8 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-2.5 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-focus-ring)]"
                />
              </div>
              <Button
                variant={showMissingOnly ? 'subtleAccent' : 'secondary'}
                size="sm"
                onClick={() => setShowMissingOnly((v) => !v)}
              >
                Thiếu trường
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSharesCol((v) => !v)}
                title="Ẩn/hiện cột Shares"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Cột Shares</span>
              </Button>
            </div>
          )}
        </div>

        {tab === 'results' && (
          <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
            <table className="w-full border-collapse text-left min-w-[720px]">
              <thead className="sticky top-0 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="h-[36px] text-[12px] font-medium text-[var(--color-text-secondary)]">
                  <th className="px-3"><SortHeader label="Nhà sáng tạo (Mẫu)" k="creator" /></th>
                  <th className="px-3">Nội dung mô tả</th>
                  <th className="px-3"><SortHeader label="Views" k="views" /></th>
                  <th className="px-3"><SortHeader label="Likes" k="likes" /></th>
                  <th className="px-3"><SortHeader label="Comments" k="comments" /></th>
                  {showSharesCol && <th className="px-3"><SortHeader label="Shares" k="shares" /></th>}
                  <th className="px-3">Quan sát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={showSharesCol ? 7 : 6} className="py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                      Đang thu thập hoặc chưa có bản ghi khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecordId(r.id)}
                      className={cn(
                        'h-[54px] cursor-pointer transition-colors',
                        r.id === selectedRecordId
                          ? 'bg-[var(--color-accent-subtle)]/50'
                          : 'hover:bg-[var(--color-hover)]/60'
                      )}
                    >
                      <td className="px-3 py-2 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-9 w-7 rounded-[4px] border border-[var(--color-border)] shrink-0 flex items-center justify-center font-mono-tech text-[9px] text-white/75"
                            style={{ backgroundColor: r.thumbnailTone }}
                          >
                            9:16
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate max-w-[145px]">
                              {r.creator}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[145px]">
                              {r.hashtags.slice(0, 2).join(' ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-2 max-w-[260px]">
                          {r.caption}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-middle font-mono-tech text-[12px] text-[var(--color-text-primary)]">
                        {formatNumberCompact(r.views)}
                      </td>
                      <td className="px-3 py-2 align-middle font-mono-tech text-[12px] text-[var(--color-text-secondary)]">
                        {formatNumberCompact(r.likes)}
                      </td>
                      <td className="px-3 py-2 align-middle font-mono-tech text-[12px] text-[var(--color-text-secondary)]">
                        {formatNumberCompact(r.comments)}
                      </td>
                      {showSharesCol && (
                        <td className="px-3 py-2 align-middle font-mono-tech text-[12px] text-[var(--color-text-secondary)]">
                          {formatNumberCompact(r.shares)}
                        </td>
                      )}
                      <td className="px-3 py-2 align-middle">
                        <StatusTag tone={r.observationStatus === 'observed' ? 'success' : 'warning'}>
                          {r.observationStatus === 'observed' ? 'Đủ trường' : 'Thiếu trường'}
                        </StatusTag>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sources' && (
          <div className="space-y-2">
            {activeResearch.sources.map((src) => (
              <Card key={src.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-h5 text-[var(--color-text-primary)]">{src.label}</p>
                  <p className="font-mono-tech text-[12px] text-[var(--color-text-muted)]">{src.url}</p>
                </div>
                <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                  {formatTimeInZone(src.capturedAt, timezone)}
                </span>
              </Card>
            ))}
          </div>
        )}

        {tab === 'notes' && (
          <Card className="space-y-3">
            <Textarea
              label="Ghi chú phân tích nghiên cứu"
              rows={8}
              value={activeResearch.notes}
              onChange={(e) => updateResearchProjectNotes(activeResearch.id, e.target.value)}
            />
          </Card>
        )}

        {tab === 'summary' && (
          <Card className="space-y-2.5">
            <h2 className="text-h4 text-[var(--color-text-primary)]">Tóm tắt nghiên cứu (Dữ liệu mẫu)</h2>
            <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">{activeResearch.summary}</p>
          </Card>
        )}
      </div>

      {/* Right Record & Evidence Inspector */}
      {selectedRecord && (
        <aside className="fixed inset-y-0 right-0 z-30 w-full sm:w-[390px] xl:static xl:z-auto h-full bg-[var(--color-sidebar)] border-l border-[var(--color-border)] flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)]">
            <div className="min-w-0">
              <p className="text-h5 text-[var(--color-text-primary)] truncate">{selectedRecord.creator}</p>
              <p className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">{selectedRecord.sampleTag}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Close record inspector" onClick={() => setSelectedRecordId(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              className="rounded-[8px] border border-[var(--color-border)] aspect-[16/9] p-3 flex flex-col justify-between"
              style={{ backgroundColor: selectedRecord.thumbnailTone }}
            >
              <span className="font-mono-tech text-[10px] text-white/75">Simulated Video Frame Placeholder</span>
              <span className="text-[12px] text-white font-medium line-clamp-2">{selectedRecord.caption}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-2.5">
                <p className="text-[var(--color-text-muted)]">Views</p>
                <p className="font-mono-tech text-[14px] font-medium text-[var(--color-text-primary)]">
                  {formatNumberCompact(selectedRecord.views)}
                </p>
              </div>
              <div className="rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-2.5">
                <p className="text-[var(--color-text-muted)]">Likes</p>
                <p className="font-mono-tech text-[14px] font-medium text-[var(--color-text-primary)]">
                  {formatNumberCompact(selectedRecord.likes)}
                </p>
              </div>
              <div className="rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-2.5">
                <p className="text-[var(--color-text-muted)]">Comments</p>
                <p className="font-mono-tech text-[14px] font-medium text-[var(--color-text-primary)]">
                  {selectedRecord.comments === null ? t.common.notObserved : formatNumberCompact(selectedRecord.comments)}
                </p>
              </div>
              <div className="rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-2.5">
                <p className="text-[var(--color-text-muted)]">Shares</p>
                <p className="font-mono-tech text-[14px] font-medium text-[var(--color-text-primary)]">
                  {selectedRecord.shares === null ? t.common.notObserved : formatNumberCompact(selectedRecord.shares)}
                </p>
              </div>
            </div>

            {selectedRecord.missingFields.length > 0 && (
              <div className="rounded-[6px] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/35 p-2.5 text-[12px] text-[var(--color-warning)]">
                Trường chưa quan sát được: {selectedRecord.missingFields.join(', ')}
              </div>
            )}

            <div className="space-y-1 text-[12px]">
              <p className="text-[var(--color-text-muted)]">URL nguồn mẫu</p>
              <p className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] break-all flex items-center gap-1">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {selectedRecord.sourceUrl}
              </p>
            </div>

            <Textarea
              label="Ghi chú cho bản ghi này"
              rows={3}
              value={selectedRecord.notes}
              onChange={(e) => updateResearchRecordNotes(selectedRecord.id, e.target.value)}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
