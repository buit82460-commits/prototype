import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Film,
  Folder,
  MessageSquare,
  Search,
  Workflow,
} from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatTimeInZone } from '../../lib/format';
import { Button, Card, SegmentedTabs, StatusTag } from '../../components/ui/primitives';
import { LiveTaskCard } from '../../components/shared/LiveTaskCard';

type ProjectTab =
  | 'overview'
  | 'conversations'
  | 'tasks'
  | 'research'
  | 'media'
  | 'schedules'
  | 'workflows'
  | 'knowledge';

export function ProjectsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const projects = useMiroStore((s) => s.projects);
  const tasks = useMiroStore((s) => s.tasks);
  const conversations = useMiroStore((s) => s.conversations);
  const researchProjects = useMiroStore((s) => s.researchProjects);
  const mediaAssets = useMiroStore((s) => s.mediaAssets);
  const schedules = useMiroStore((s) => s.schedules);
  const workflows = useMiroStore((s) => s.workflows);
  const knowledgeDocs = useMiroStore((s) => s.knowledgeDocs);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const setActiveConversation = useMiroStore((s) => s.setActiveConversation);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [tab, setTab] = useState<ProjectTab>('overview');
  const project = projectId ? projects.find((p) => p.id === projectId) : null;

  useEffect(() => {
    setActiveContext(
      project ? { projectId: project.id, resourceLabel: project.name } : { resourceLabel: undefined }
    );
  }, [project, setActiveContext]);

  // Project Library
  if (!project) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.projects}</h1>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Tổ chức liên kết tác vụ, hội thoại, nghiên cứu, tư liệu media, lịch trình và tri thức theo từng mục tiêu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => {
              const pTasks = tasks.filter((tk) => tk.projectId === p.id);
              const pResources =
                researchProjects.filter((r) => r.projectId === p.id).length +
                mediaAssets.filter((m) => m.projectId === p.id).length +
                schedules.filter((sc) => sc.projectId === p.id).length;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-5 text-left hover:border-[var(--color-border-strong)] transition-colors flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-accent-text)]">
                        <Folder className="w-4 h-4" />
                      </div>
                      <StatusTag tone="success">{p.status}</StatusTag>
                    </div>
                    <div>
                      <h2 className="text-h4 text-[var(--color-text-primary)]">{p.name}</h2>
                      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)] line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-muted)]">
                    <span className="font-mono-tech">
                      {pTasks.length} tác vụ · {pResources} tài nguyên
                    </span>
                    <span className="font-mono-tech">{formatTimeInZone(p.lastActivity, timezone)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Project Detail
  const pTasks = tasks.filter((tk) => tk.projectId === project.id);
  const pConvs = conversations.filter((c) => c.projectId === project.id);
  const pResearch = researchProjects.filter((r) => r.projectId === project.id);
  const pMedia = mediaAssets.filter((m) => m.projectId === project.id);
  const pSchedules = schedules.filter((sc) => sc.projectId === project.id);
  const pWorkflows = workflows.filter((w) => w.projectId === project.id);
  const pKnowledge = knowledgeDocs.filter((d) => d.projectId === project.id);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1280px] space-y-5">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="px-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tất cả dự án</span>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-h2 text-[var(--color-text-primary)]">{project.name}</h1>
                <StatusTag tone="success">{project.status}</StatusTag>
              </div>
              <p className="text-[14px] text-[var(--color-text-secondary)] max-w-[740px]">
                {project.description}
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/workspace')}>
              <MessageSquare className="w-4 h-4" />
              <span>Làm việc trong AI Workspace</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'overview', label: 'Tổng quan' },
              { value: 'conversations', label: 'Hội thoại', count: pConvs.length },
              { value: 'tasks', label: 'Tác vụ', count: pTasks.length },
              { value: 'research', label: 'Nghiên cứu', count: pResearch.length },
              { value: 'media', label: 'Media', count: pMedia.length },
              { value: 'schedules', label: 'Lịch trình', count: pSchedules.length },
              { value: 'workflows', label: 'Workflows', count: pWorkflows.length },
              { value: 'knowledge', label: 'Tri thức', count: pKnowledge.length },
            ]}
          />
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              <Card className="space-y-1.5">
                <h2 className="text-h5 text-[var(--color-text-secondary)]">Mục tiêu dự án</h2>
                <p className="text-[14px] text-[var(--color-text-primary)]">{project.goal}</p>
              </Card>
              <div className="space-y-2.5">
                <h3 className="text-h4 text-[var(--color-text-primary)]">Tác vụ thuộc dự án</h3>
                {pTasks.map((tk) => (
                  <LiveTaskCard key={tk.id} task={tk} compact />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-3">
              <Card className="space-y-2.5">
                <h3 className="text-h5 text-[var(--color-text-primary)]">Tài nguyên liên kết</h3>
                <div className="space-y-1.5 text-[13px] text-[var(--color-text-secondary)]">
                  <div className="flex justify-between"><span>Nghiên cứu</span><span className="font-mono-tech">{pResearch.length}</span></div>
                  <div className="flex justify-between"><span>Media Assets</span><span className="font-mono-tech">{pMedia.length}</span></div>
                  <div className="flex justify-between"><span>Lịch trình</span><span className="font-mono-tech">{pSchedules.length}</span></div>
                  <div className="flex justify-between"><span>Workflows</span><span className="font-mono-tech">{pWorkflows.length}</span></div>
                  <div className="flex justify-between"><span>Tài liệu tri thức</span><span className="font-mono-tech">{pKnowledge.length}</span></div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'conversations' && (
          <div className="space-y-2.5">
            {pConvs.length === 0 ? (
              <Card className="p-6 text-center text-[13px] text-[var(--color-text-muted)]">Chưa có hội thoại gắn với dự án này.</Card>
            ) : (
              pConvs.map((c) => (
                <Card key={c.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-h5 text-[var(--color-text-primary)]">{c.title}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">{c.messages.length} tin nhắn</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActiveConversation(c.id);
                      navigate('/workspace');
                    }}
                  >
                    Mở hội thoại
                  </Button>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            {pTasks.map((tk) => (
              <LiveTaskCard key={tk.id} task={tk} />
            ))}
          </div>
        )}

        {tab === 'research' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pResearch.map((r) => (
              <Card key={r.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-h5 text-[var(--color-text-primary)] flex items-center gap-2">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
                    {r.title}
                  </span>
                  <StatusTag tone={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</StatusTag>
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">{r.summary}</p>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/research/${r.id}`)}>
                  Mở bảng nghiên cứu
                </Button>
              </Card>
            ))}
          </div>
        )}

        {tab === 'media' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pMedia.map((m) => (
              <Card key={m.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[var(--color-accent-text)]" />
                  <p className="text-h5 text-[var(--color-text-primary)] truncate">{m.name}</p>
                </div>
                <p className="text-[12px] font-mono-tech text-[var(--color-text-muted)]">
                  {m.resolution} · {m.durationSec}s · {m.analysisStatus}
                </p>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/media/${m.id}`)}>
                  Mở trong Media Studio
                </Button>
              </Card>
            ))}
          </div>
        )}

        {tab === 'schedules' && (
          <div className="space-y-2.5">
            {pSchedules.map((sc) => (
              <Card key={sc.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-h5 text-[var(--color-text-primary)] flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[var(--color-text-muted)]" />
                    {sc.name}
                  </p>
                  <p className="text-[12px] font-mono-tech text-[var(--color-text-muted)]">
                    {sc.time} · {sc.recurrence} · {sc.timezone}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/schedules/${sc.id}`)}>
                  Mở lịch trình
                </Button>
              </Card>
            ))}
          </div>
        )}

        {tab === 'workflows' && (
          <div className="space-y-2.5">
            {pWorkflows.map((wf) => (
              <Card key={wf.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-h5 text-[var(--color-text-primary)] flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-[var(--color-text-muted)]" />
                    {wf.name}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{wf.description}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/workflows/${wf.id}`)}>
                  Mở Workflow Editor
                </Button>
              </Card>
            ))}
          </div>
        )}

        {tab === 'knowledge' && (
          <div className="space-y-2.5">
            {pKnowledge.map((doc) => (
              <Card key={doc.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-h5 text-[var(--color-text-primary)]">{doc.title}</p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">{doc.collection}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate('/knowledge')}>
                  Mở tài liệu
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
