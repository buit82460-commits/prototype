import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { KnowledgeDocument, KnowledgeSourceKind } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatTimeInZone } from '../../lib/format';
import { generateId, cn } from '../../lib/utils';
import {
  Button,
  Card,
  Input,
  Select,
  StatusTag,
  Switch,
  Textarea,
} from '../../components/ui/primitives';

const SOURCE_LABELS: Record<KnowledgeSourceKind, { label: string; tone: 'accent' | 'info' | 'warning' | 'neutral' }> = {
  user_instruction: { label: 'Hướng dẫn người dùng (Ưu tiên cao)', tone: 'accent' },
  project_knowledge: { label: 'Tri thức dự án', tone: 'info' },
  external_retrieved: { label: 'Nguồn ngoài đã thu thập', tone: 'neutral' },
  ai_generated: { label: 'Ghi chú AI (Cần kiểm chứng)', tone: 'warning' },
};

export function KnowledgePage() {
  const { t } = useTranslation();

  const docs = useMiroStore((s) => s.knowledgeDocs);
  const projects = useMiroStore((s) => s.projects);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const upsertKnowledgeDoc = useMiroStore((s) => s.upsertKnowledgeDoc);
  const toggleKnowledgeContext = useMiroStore((s) => s.toggleKnowledgeContext);
  const deleteKnowledgeDoc = useMiroStore((s) => s.deleteKnowledgeDoc);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [sourceFilter, setSourceFilter] = useState<'all' | KnowledgeSourceKind>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(docs[0]?.id ?? '');

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (sourceFilter !== 'all' && d.sourceKind !== sourceFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.tags.join(' ').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [docs, sourceFilter, search]);

  const activeDoc = docs.find((d) => d.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    setActiveContext(
      activeDoc
        ? {
            resourceKind: 'document',
            resourceId: activeDoc.id,
            resourceLabel: activeDoc.title,
            projectId: activeDoc.projectId,
          }
        : { resourceLabel: undefined }
    );
  }, [activeDoc, setActiveContext]);

  const handleAddDoc = (kind: KnowledgeSourceKind) => {
    const id = generateId('kn');
    const created: KnowledgeDocument = {
      id,
      title: kind === 'user_instruction' ? 'Hướng dẫn mới cho Miro' : 'Tài liệu tri thức mới',
      collection: SOURCE_LABELS[kind].label,
      sourceKind: kind,
      content: 'Nhập nội dung quy chuẩn hoặc ghi chú dự án tại đây...',
      tags: ['notes'],
      projectId: projects[0]?.id,
      includedInAiContext: kind === 'user_instruction',
      updatedAt: new Date().toISOString(),
    };
    upsertKnowledgeDoc(created);
    setSelectedId(id);
    toast.success('Đã thêm tài liệu vào Tri thức');
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Collections & Source Authority Filter */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-3 space-y-4">
        <div className="space-y-1">
          <h1 className="text-h4 text-[var(--color-text-primary)]">{t.nav.knowledge}</h1>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Phân tách rõ thẩm quyền giữa hướng dẫn người dùng, tri thức dự án và ghi chú AI.
          </p>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={cn(
              'flex w-full items-center justify-between rounded-[6px] px-2.5 py-2 text-[12px] font-medium cursor-pointer',
              sourceFilter === 'all'
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
            )}
          >
            <span>Tất cả tài liệu</span>
            <span className="font-mono-tech">{docs.length}</span>
          </button>

          {(Object.keys(SOURCE_LABELS) as KnowledgeSourceKind[]).map((k) => {
            const count = docs.filter((d) => d.sourceKind === k).length;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSourceFilter(k)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-[6px] px-2.5 py-2 text-left text-[12px] cursor-pointer',
                  sourceFilter === k
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] font-medium'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
                )}
              >
                <span className="truncate">{SOURCE_LABELS[k].label}</span>
                <span className="font-mono-tech shrink-0">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[var(--color-border)] space-y-1.5">
          <Button variant="primary" size="sm" className="w-full justify-start" onClick={() => handleAddDoc('user_instruction')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm hướng dẫn</span>
          </Button>
          <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => handleAddDoc('project_knowledge')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tài liệu dự án</span>
          </Button>
        </div>
      </aside>

      {/* Center: Searchable list + Document Editor */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden">
        {/* Document List */}
        <div className="w-full lg:w-[290px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] flex flex-col max-h-[220px] lg:max-h-none">
          <div className="p-3 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tài liệu, thẻ..."
                className="h-8 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-2.5 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-focus-ring)]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filtered.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedId(doc.id)}
                className={cn(
                  'w-full rounded-[8px] border p-3 text-left space-y-1.5 cursor-pointer transition-colors',
                  doc.id === activeDoc?.id
                    ? 'bg-[var(--color-accent-subtle)]/70 border-[var(--color-accent-border)]'
                    : 'bg-[var(--color-surface-1)] border-[var(--color-border)] hover:bg-[var(--color-hover)]'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <StatusTag tone={SOURCE_LABELS[doc.sourceKind].tone}>
                    {doc.sourceKind.replace('_', ' ')}
                  </StatusTag>
                  {doc.includedInAiContext && (
                    <span className="font-mono-tech text-[10px] text-[var(--color-accent-text)]">AI CTX</span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)] line-clamp-2">
                  {doc.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Document Editor */}
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--color-canvas)]">
          {activeDoc ? (
            <div className="mx-auto max-w-[720px] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusTag tone={SOURCE_LABELS[activeDoc.sourceKind].tone}>
                  {SOURCE_LABELS[activeDoc.sourceKind].label}
                </StatusTag>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    deleteKnowledgeDoc(activeDoc.id);
                    toast.info('Đã xóa tài liệu');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </Button>
              </div>

              <Input
                label="Tiêu đề tài liệu"
                value={activeDoc.title}
                onChange={(e) =>
                  upsertKnowledgeDoc({ ...activeDoc, title: e.target.value, updatedAt: new Date().toISOString() })
                }
              />

              <Textarea
                label="Nội dung"
                rows={14}
                value={activeDoc.content}
                onChange={(e) =>
                  upsertKnowledgeDoc({ ...activeDoc, content: e.target.value, updatedAt: new Date().toISOString() })
                }
              />
            </div>
          ) : (
            <div className="py-16 text-center text-[13px] text-[var(--color-text-muted)]">
              <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Chọn một tài liệu để xem hoặc chỉnh sửa.
            </div>
          )}
        </div>
      </div>

      {/* Right: Metadata & AI Context Availability */}
      {activeDoc && (
        <aside className="hidden xl:flex w-[270px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-sidebar)] p-4 space-y-4">
          <h2 className="text-h5 text-[var(--color-text-primary)]">Ngữ cảnh & Nguồn</h2>
          <Card className="p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-[var(--color-text-primary)]">Đưa vào ngữ cảnh AI</span>
              <Switch
                checked={activeDoc.includedInAiContext}
                ariaLabel="Include in AI context"
                onCheckedChange={() => toggleKnowledgeContext(activeDoc.id)}
              />
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Khi bật, tài liệu được gắn rõ ràng vào ngữ cảnh đề xuất của Miro.
            </p>
          </Card>

          <Select
            label="Dự án liên kết"
            value={activeDoc.projectId ?? ''}
            onChange={(e) =>
              upsertKnowledgeDoc({ ...activeDoc, projectId: e.target.value || undefined })
            }
          >
            <option value="">Toàn cục (Mọi dự án)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <Input
            label="Thẻ (cách nhau bằng dấu phẩy)"
            value={activeDoc.tags.join(', ')}
            onChange={(e) =>
              upsertKnowledgeDoc({
                ...activeDoc,
                tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
          />

          <div className="text-[11px] font-mono-tech text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)] space-y-1">
            <div>Cập nhật: {formatTimeInZone(activeDoc.updatedAt, timezone)}</div>
            {activeDoc.sourceUrl && <div className="break-all">Nguồn: {activeDoc.sourceUrl}</div>}
          </div>
        </aside>
      )}
    </div>
  );
}
