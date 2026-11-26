import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Film,
  Grid,
  Image as ImageIcon,
  List,
  Music,
  Pause,
  Play,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MediaAsset } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { generateId, cn } from '../../lib/utils';
import {
  Button,
  SegmentedTabs,
  StatusTag,
  Textarea,
} from '../../components/ui/primitives';

export function MediaStudioPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const mediaAssets = useMiroStore((s) => s.mediaAssets);
  const addMediaAsset = useMiroStore((s) => s.addMediaAsset);
  const updateMediaAsset = useMiroStore((s) => s.updateMediaAsset);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'image' | 'audio'>('all');
  const [libLayout, setLibLayout] = useState<'list' | 'grid'>('list');
  const [inspectorTab, setInspectorTab] = useState<'metadata' | 'transcript' | 'analysis' | 'notes'>('analysis');
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);

  const selectedAsset =
    (assetId ? mediaAssets.find((m) => m.id === assetId) : null) ?? mediaAssets[0];

  useEffect(() => {
    setActiveContext(
      selectedAsset
        ? {
            resourceKind: 'media',
            resourceId: selectedAsset.id,
            resourceLabel: selectedAsset.name,
            projectId: selectedAsset.projectId,
          }
        : { resourceLabel: undefined }
    );
  }, [selectedAsset, setActiveContext]);

  useEffect(() => {
    setCurrentSec(0);
    setPlaying(false);
  }, [selectedAsset?.id]);

  useEffect(() => {
    if (!playing || !selectedAsset) return;
    const id = setInterval(() => {
      setCurrentSec((sec) => (sec + 1 >= selectedAsset.durationSec ? 0 : sec + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, selectedAsset]);

  const filteredAssets = useMemo(() => {
    return mediaAssets.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.collection.toLowerCase().includes(q);
      }
      return true;
    });
  }, [mediaAssets, typeFilter, search]);

  const activeScene =
    selectedAsset?.scenes.find((sc) => currentSec >= sc.startSec && currentSec < sc.endSec) ??
    selectedAsset?.scenes[0];

  const handleDemoUpload = () => {
    const id = generateId('media');
    const created: MediaAsset = {
      id,
      name: `Demo Clip ${mediaAssets.length + 1}.mp4`,
      type: 'video',
      collection: 'Demo Uploads',
      durationSec: 30,
      resolution: '1080 × 1920',
      sizeLabel: '14.5 MB',
      projectId: 'proj-kans-377',
      analysisStatus: 'pending',
      analysisProgress: 0,
      createdAt: new Date().toISOString(),
      notes: 'Tệp tải lên mô phỏng trong trình duyệt.',
      accentTone: '#1F2C24',
      scenes: [
        {
          id: generateId('sc'),
          startSec: 0,
          endSec: 12,
          label: 'Mở đầu sản phẩm',
          description: 'Khung hình giới thiệu mẫu.',
          transcript: 'Đoạn mở đầu mẫu cho tệp vừa tải lên.',
        },
        {
          id: generateId('sc'),
          startSec: 12,
          endSec: 30,
          label: 'Chi tiết & Kết thúc',
          description: 'Khung hình kết thúc mẫu.',
          transcript: 'Đoạn kết thúc mẫu có thể phân tích thêm với Miro.',
        },
      ],
    };
    addMediaAsset(created);
    navigate(`/media/${id}`);
    toast.success(`Đã thêm tư liệu mẫu: ${created.name}`);
  };

  const handleRunAnalysis = () => {
    if (!selectedAsset) return;
    launchTaskFromInstruction({
      instruction: `Phân tích video ${selectedAsset.name} trong Media Studio`,
      overrideScenario: 'media_analysis',
      projectId: selectedAsset.projectId,
      trigger: 'manual',
      openLive: false,
    });
    toast.info(`Đang chạy phân tích mô phỏng cho ${selectedAsset.name}`);
  };

  const fmtTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Media Library (250px) */}
        <aside className="hidden md:flex w-[250px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)]">
          <div className="p-3 border-b border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-h4 text-[var(--color-text-primary)]">{t.nav.media}</h1>
              <div className="flex items-center gap-1">
                <Button variant={libLayout === 'list' ? 'subtleAccent' : 'ghost'} size="icon" className="h-7 w-7" aria-label="List view" onClick={() => setLibLayout('list')}>
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button variant={libLayout === 'grid' ? 'subtleAccent' : 'ghost'} size="icon" className="h-7 w-7" aria-label="Grid view" onClick={() => setLibLayout('grid')}>
                  <Grid className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm media..."
                className="h-8 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-2 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-focus-ring)]"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'video', 'audio', 'image'] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTypeFilter(tp)}
                  className={cn(
                    'flex-1 h-6 rounded-[4px] text-[11px] font-medium capitalize cursor-pointer transition-colors',
                    typeFilter === tp
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)]'
                  )}
                >
                  {tp}
                </button>
              ))}
            </div>

            <Button variant="secondary" size="sm" className="w-full" onClick={handleDemoUpload}>
              <Upload className="w-3.5 h-3.5" />
              <span>Tải lên mẫu (Demo)</span>
            </Button>
          </div>

          <div className={cn('flex-1 overflow-y-auto p-2.5', libLayout === 'grid' ? 'grid grid-cols-2 gap-2 content-start' : 'space-y-1.5')}>
            {filteredAssets.map((m) => {
              const active = m.id === selectedAsset?.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => navigate(`/media/${m.id}`)}
                  className={cn(
                    'w-full rounded-[8px] border text-left transition-colors cursor-pointer overflow-hidden',
                    active
                      ? 'bg-[var(--color-accent-subtle)]/70 border-[var(--color-accent-border)]'
                      : 'bg-[var(--color-surface-1)] border-[var(--color-border)] hover:bg-[var(--color-hover)]',
                    libLayout === 'list' ? 'p-2 flex items-center gap-2.5' : 'p-1.5 space-y-1.5'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-[4px] flex items-center justify-center text-white/75 shrink-0',
                      libLayout === 'list' ? 'h-10 w-10' : 'aspect-video w-full'
                    )}
                    style={{ backgroundColor: m.accentTone }}
                  >
                    {m.type === 'video' ? (
                      <Film className="w-4 h-4" />
                    ) : m.type === 'audio' ? (
                      <Music className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">{m.name}</p>
                    <p className="font-mono-tech text-[10px] text-[var(--color-text-muted)]">
                      {fmtTime(m.durationSec)} · {m.analysisStatus}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Preview + Playback Controls */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-canvas)] overflow-y-auto p-4 sm:p-5 gap-4">
          {selectedAsset ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-h3 text-[var(--color-text-primary)]">{selectedAsset.name}</h2>
                  <p className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                    {selectedAsset.collection} · {selectedAsset.resolution} · {selectedAsset.sizeLabel} · Simulated Preview
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag tone={selectedAsset.analysisStatus === 'analyzed' ? 'success' : selectedAsset.analysisStatus === 'analyzing' ? 'accent' : 'neutral'}>
                    {selectedAsset.analysisStatus}
                  </StatusTag>
                  <Button variant="primary" size="sm" onClick={handleRunAnalysis}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Phân tích (Mô phỏng)</span>
                  </Button>
                </div>
              </div>

              {/* Large Preview Canvas */}
              <div
                className="flex-1 min-h-[240px] max-h-[420px] rounded-[10px] border border-[var(--color-border)] p-5 flex flex-col justify-between relative overflow-hidden"
                style={{ backgroundColor: selectedAsset.accentTone }}
              >
                <div className="flex items-center justify-between text-[11px] font-mono-tech text-white/80">
                  <span>{activeScene?.label ?? selectedAsset.name}</span>
                  <span>
                    {fmtTime(currentSec)} / {fmtTime(selectedAsset.durationSec)}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 text-center my-auto">
                  <button
                    type="button"
                    aria-label={playing ? 'Pause preview' : 'Play preview'}
                    onClick={() => setPlaying((p) => !p)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 border border-white/25 text-white hover:bg-black/75 transition-colors cursor-pointer"
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <p className="text-[12px] text-white/80 max-w-[440px]">
                    {activeScene?.description}
                  </p>
                </div>

                <div className="rounded-[6px] bg-black/60 px-3 py-2 text-[12px] text-white/95">
                  {activeScene?.transcript}
                </div>
              </div>

              {/* Playback Scrubber */}
              <div className="flex items-center gap-3 px-1">
                <Button variant="secondary" size="icon" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </Button>
                <input
                  type="range"
                  aria-label="Timeline scrubber"
                  min={0}
                  max={selectedAsset.durationSec}
                  value={currentSec}
                  onChange={(e) => setCurrentSec(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-accent)] cursor-pointer"
                />
                <span className="font-mono-tech text-[12px] text-[var(--color-text-secondary)] w-[72px] text-right">
                  {fmtTime(currentSec)} / {fmtTime(selectedAsset.durationSec)}
                </span>
              </div>

              {/* Simulated Future Capabilities Strip: REA-MẮT & REA Video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-h5 text-[var(--color-text-primary)]">REA-MẮT · Visual Inspector</span>
                    <StatusTag tone="info">Mô phỏng lộ trình</StatusTag>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    Đánh giá bố cục khung hình, mật độ chữ và điểm dừng ánh nhìn theo từng phân cảnh (tính năng tương lai).
                  </p>
                </div>
                <div className="rounded-[8px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-h5 text-[var(--color-text-primary)]">REA Video · Auto Cut Brief</span>
                    <StatusTag tone="neutral">Coming Soon</StatusTag>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    Đề xuất điểm cắt nhịp dựng và tạo biến thể mở đầu từ tư liệu thô sau khi tích hợp runtime xử lý media.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Right: Inspector (330px) */}
        {selectedAsset && (
          <aside className="hidden lg:flex w-[330px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-sidebar)]">
            <div className="p-3 border-b border-[var(--color-border)]">
              <SegmentedTabs
                value={inspectorTab}
                onChange={setInspectorTab}
                className="w-full justify-between"
                items={[
                  { value: 'analysis', label: 'Phân tích' },
                  { value: 'transcript', label: 'Thoại' },
                  { value: 'metadata', label: 'Thông tin' },
                  { value: 'notes', label: 'Ghi chú' },
                ]}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {inspectorTab === 'analysis' && (
                <div className="space-y-2.5">
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    Trạng thái phân tích mô phỏng ({selectedAsset.analysisProgress}%). Nhấn một phân cảnh để nhảy mốc thời gian:
                  </p>
                  {selectedAsset.scenes.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setCurrentSec(sc.startSec)}
                      className={cn(
                        'w-full rounded-[8px] border p-3 text-left space-y-1 transition-colors cursor-pointer',
                        activeScene?.id === sc.id
                          ? 'bg-[var(--color-accent-subtle)]/70 border-[var(--color-accent-border)]'
                          : 'bg-[var(--color-surface-1)] border-[var(--color-border)] hover:bg-[var(--color-hover)]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="font-medium text-[var(--color-text-primary)]">{sc.label}</span>
                        <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                          {fmtTime(sc.startSec)}–{fmtTime(sc.endSec)}
                        </span>
                      </div>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">{sc.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {inspectorTab === 'transcript' && (
                <div className="space-y-2">
                  {selectedAsset.scenes.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setCurrentSec(sc.startSec)}
                      className="w-full rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-2.5 text-left space-y-1 hover:bg-[var(--color-hover)] cursor-pointer"
                    >
                      <span className="font-mono-tech text-[11px] text-[var(--color-accent-text)]">
                        [{fmtTime(sc.startSec)}]
                      </span>
                      <p className="text-[12px] text-[var(--color-text-primary)] leading-5">{sc.transcript}</p>
                    </button>
                  ))}
                </div>
              )}

              {inspectorTab === 'metadata' && (
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                    <span className="text-[var(--color-text-muted)]">Định dạng</span>
                    <span className="uppercase font-mono-tech">{selectedAsset.type}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                    <span className="text-[var(--color-text-muted)]">Độ phân giải</span>
                    <span className="font-mono-tech">{selectedAsset.resolution}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                    <span className="text-[var(--color-text-muted)]">Thời lượng</span>
                    <span className="font-mono-tech">{selectedAsset.durationSec}s</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                    <span className="text-[var(--color-text-muted)]">Dung lượng mẫu</span>
                    <span className="font-mono-tech">{selectedAsset.sizeLabel}</span>
                  </div>
                </div>
              )}

              {inspectorTab === 'notes' && (
                <Textarea
                  label="Ghi chú biên tập"
                  rows={8}
                  value={selectedAsset.notes}
                  onChange={(e) => updateMediaAsset(selectedAsset.id, { notes: e.target.value })}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Timeline Strip */}
      {selectedAsset && (
        <div className="h-[112px] border-t border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-2.5 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
            <span className="font-medium">Timeline phân cảnh ({selectedAsset.scenes.length} đoạn)</span>
            <span className="font-mono-tech">Playhead: {fmtTime(currentSec)}</span>
          </div>
          <div className="flex-1 flex items-stretch gap-1.5 overflow-x-auto">
            {selectedAsset.scenes.map((sc) => {
              const widthPct = Math.max(12, ((sc.endSec - sc.startSec) / selectedAsset.durationSec) * 100);
              const isCurrent = activeScene?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setCurrentSec(sc.startSec)}
                  style={{ width: `${widthPct}%` }}
                  className={cn(
                    'min-w-[110px] rounded-[6px] border px-2.5 py-1.5 text-left flex flex-col justify-between transition-colors cursor-pointer',
                    isCurrent
                      ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-text-primary)]'
                      : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                  )}
                >
                  <span className="text-[11px] font-medium truncate">{sc.label}</span>
                  <span className="font-mono-tech text-[10px] text-[var(--color-text-muted)]">
                    {fmtTime(sc.startSec)} → {fmtTime(sc.endSec)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
