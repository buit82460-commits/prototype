import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Connection,
  type NodeProps,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react';
import {
  ArrowLeft,
  CheckCircle2,
  Chrome,
  Clock,
  Database,
  Film,
  GitBranch,
  Play,
  Plus,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Terminal,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Workflow, WorkflowNodeData, WorkflowNodeItem } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { triggerWorkflowRun } from '../../services/mock/executionEngine';
import { generateId, cn } from '../../lib/utils';
import {
  Button,
  Card,
  Input,
  StatusTag,
  Switch,
  Textarea,
} from '../../components/ui/primitives';

const NODE_LIBRARY: {
  category: WorkflowNodeData['category'];
  label: string;
  description: string;
}[] = [
  { category: 'trigger', label: 'Trigger · Lịch / Sự kiện', description: 'Điểm bắt đầu cho luồng tự động' },
  { category: 'browser', label: 'Browser · Thu thập', description: 'Tương tác trình duyệt mô phỏng qua Profile' },
  { category: 'ai', label: 'AI · Phân tích & Tóm tắt', description: 'Tổng hợp nội dung theo ngữ cảnh' },
  { category: 'media', label: 'Media · Tách cảnh', description: 'Phân tích video & transcript mẫu' },
  { category: 'condition', label: 'Condition · Phân nhánh', description: 'Kiểm tra điều kiện dữ liệu quan sát' },
  { category: 'data', label: 'Data · Lưu bảng', description: 'Ghi bản ghi vào Research / Knowledge' },
  { category: 'approval', label: 'Human Approval', description: 'Dừng chờ xác nhận của người vận hành' },
  { category: 'publishing', label: 'Publishing · Xuất bản', description: 'Đưa bản nháp vào hàng đợi kênh' },
];

function NodeCategoryIcon({ category }: { category: WorkflowNodeData['category'] }) {
  const cls = 'w-3.5 h-3.5 shrink-0';
  switch (category) {
    case 'trigger':
      return <Clock className={cls} />;
    case 'browser':
      return <Chrome className={cls} />;
    case 'ai':
      return <Sparkles className={cls} />;
    case 'media':
      return <Film className={cls} />;
    case 'condition':
      return <GitBranch className={cls} />;
    case 'data':
      return <Database className={cls} />;
    case 'approval':
      return <ShieldAlert className={cls} />;
    case 'publishing':
      return <Send className={cls} />;
  }
}

function MiroWorkflowNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={cn(
        'w-[220px] rounded-[8px] bg-[var(--color-surface-2)] border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/40'
          : d.status === 'running'
          ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]/70'
          : d.validationError
          ? 'border-[var(--color-error)]'
          : 'border-[var(--color-border-strong)]'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-[var(--color-border-interactive)] !border-[var(--color-canvas)]" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] min-w-0">
          <NodeCategoryIcon category={d.category} />
          <span className="text-[11px] uppercase tracking-[0.04em] font-medium truncate">
            {d.category}
          </span>
        </div>
        <span
          className={cn(
            'text-[10px] font-mono-tech px-1.5 py-0.5 rounded-[4px]',
            d.status === 'completed'
              ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
              : d.status === 'running'
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]'
              : d.status === 'waiting'
              ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
              : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]'
          )}
        >
          {d.status}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] font-medium text-[var(--color-text-primary)] leading-snug">
        {d.label}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)] line-clamp-2">
        {d.description}
      </p>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-[var(--color-accent)] !border-[var(--color-canvas)]" />
    </div>
  );
}

const nodeTypes = { miroNode: MiroWorkflowNode };

export function WorkflowsPage() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const workflows = useMiroStore((s) => s.workflows);
  const upsertWorkflow = useMiroStore((s) => s.upsertWorkflow);
  const updateWorkflowGraph = useMiroStore((s) => s.updateWorkflowGraph);
  const toggleWorkflowEnabled = useMiroStore((s) => s.toggleWorkflowEnabled);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [libSearch, setLibSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(true);

  const activeWf = workflowId ? workflows.find((w) => w.id === workflowId) : null;

  useEffect(() => {
    setActiveContext(
      activeWf
        ? { resourceKind: 'workflow', resourceId: activeWf.id, resourceLabel: activeWf.name, projectId: activeWf.projectId }
        : { resourceLabel: undefined }
    );
  }, [activeWf, setActiveContext]);

  const selectedNode = activeWf?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!activeWf) return;
      const next = changes.applyTo(activeWf.nodes as any) as unknown as WorkflowNodeItem[];
      updateWorkflowGraph(activeWf.id, next, activeWf.edges);
    },
    [activeWf, updateWorkflowGraph]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!activeWf) return;
      const next = changes.applyTo(activeWf.edges as any) as any;
      updateWorkflowGraph(activeWf.id, activeWf.nodes, next);
    },
    [activeWf, updateWorkflowGraph]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!activeWf) return;
      const next = addEdge(connection, activeWf.edges);
      updateWorkflowGraph(activeWf.id, activeWf.nodes, next);
    },
    [activeWf, updateWorkflowGraph]
  );

  const filteredLib = useMemo(
    () =>
      NODE_LIBRARY.filter(
        (n) =>
          n.label.toLowerCase().includes(libSearch.toLowerCase()) ||
          n.category.toLowerCase().includes(libSearch.toLowerCase())
      ),
    [libSearch]
  );

  const handleCreateWorkflow = () => {
    const id = generateId('wf');
    const wf: Workflow = {
      id,
      name: 'Workflow tự động hóa mới',
      description: 'Luồng công việc đa bước có điểm kiểm duyệt an toàn.',
      enabled: false,
      nodes: [
        {
          id: 'n-start',
          type: 'miroNode',
          position: { x: 80, y: 120 },
          data: {
            label: 'Trigger thủ công',
            category: 'trigger',
            status: 'idle',
            description: 'Khởi chạy theo yêu cầu người vận hành',
            config: { mode: 'manual' },
          },
        },
        {
          id: 'n-step2',
          type: 'miroNode',
          position: { x: 380, y: 120 },
          data: {
            label: 'Phân tích AI',
            category: 'ai',
            status: 'idle',
            description: 'Tóm tắt dữ liệu đầu vào',
            config: { model: 'Miro Core (Simulated)' },
          },
        },
      ],
      edges: [{ id: 'e-init', source: 'n-start', target: 'n-step2' }],
      executionLog: [],
    };
    upsertWorkflow(wf);
    navigate(`/workflows/${id}`);
  };

  const handleAddNode = (item: (typeof NODE_LIBRARY)[number]) => {
    if (!activeWf) return;
    const id = generateId('node');
    const lastNode = activeWf.nodes[activeWf.nodes.length - 1];
    const newNode: WorkflowNodeItem = {
      id,
      type: 'miroNode',
      position: {
        x: lastNode ? lastNode.position.x + 260 : 80,
        y: lastNode ? lastNode.position.y : 120,
      },
      data: {
        label: item.label,
        category: item.category,
        status: 'idle',
        description: item.description,
        config: { mode: 'simulated' },
      },
    };
    const nextEdges = lastNode
      ? [...activeWf.edges, { id: generateId('edge'), source: lastNode.id, target: id }]
      : activeWf.edges;
    updateWorkflowGraph(activeWf.id, [...activeWf.nodes, newNode], nextEdges);
    setSelectedNodeId(id);
  };

  const handleValidate = () => {
    if (!activeWf) return;
    const hasTrigger = activeWf.nodes.some((n) => n.data.category === 'trigger');
    if (!hasTrigger) {
      toast.error('Workflow cần ít nhất 1 node Trigger.');
      return;
    }
    toast.success(`Hợp lệ: ${activeWf.nodes.length} node và ${activeWf.edges.length} kết nối sẵn sàng.`);
  };

  // Workflow Library View
  if (!activeWf) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.workflows}</h1>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Thiết kế và mô phỏng các luồng tự động hóa đa bước kết nối trình duyệt, AI, media và phê duyệt thủ công.
              </p>
            </div>
            <Button variant="primary" onClick={handleCreateWorkflow}>
              <Plus className="w-4 h-4" />
              <span>Tạo Workflow</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf) => (
              <Card key={wf.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <WorkflowIcon className="w-4 h-4 text-[var(--color-accent-text)]" />
                      <h2 className="text-h4 text-[var(--color-text-primary)]">{wf.name}</h2>
                    </div>
                    <Switch
                      checked={wf.enabled}
                      ariaLabel={`Toggle ${wf.name}`}
                      onCheckedChange={() => toggleWorkflowEnabled(wf.id)}
                    />
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)]">{wf.description}</p>
                  <p className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                    {wf.nodes.length} nodes · {wf.edges.length} connections · Last: {wf.lastStatus ?? 'idle'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/workflows/${wf.id}`)}>
                    Mở trình dựng canvas
                  </Button>
                  <Button
                    variant="subtleAccent"
                    size="sm"
                    onClick={() => {
                      triggerWorkflowRun(wf.id);
                      navigate(`/workflows/${wf.id}`);
                      toast.success(`Đang chạy mô phỏng "${wf.name}"`);
                    }}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Chạy mô phỏng</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Workflow Interactive Canvas Editor
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 h-12 border-b border-[var(--color-border)] bg-[var(--color-surface-1)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thư viện</span>
          </Button>
          <input
            aria-label="Workflow name"
            value={activeWf.name}
            onChange={(e) => upsertWorkflow({ ...activeWf, name: e.target.value })}
            className="bg-transparent text-h5 text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-focus-ring)] rounded-[4px] px-2 py-1 focus:outline-none truncate max-w-[260px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <span className="text-[12px] text-[var(--color-text-muted)]">Bật</span>
            <Switch
              checked={activeWf.enabled}
              ariaLabel="Enable workflow"
              onCheckedChange={() => toggleWorkflowEnabled(activeWf.id)}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleValidate}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kiểm tra</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.success('Đã lưu thay đổi workflow cục bộ')}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lưu</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              triggerWorkflowRun(activeWf.id);
              setLogOpen(true);
              toast.success('Đã kích hoạt lượt chạy workflow mô phỏng');
            }}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Chạy</span>
          </Button>
        </div>
      </div>

      {/* 3-Column Editor */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Node Library (~220px) */}
        <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)]">
          <div className="p-3 border-b border-[var(--color-border)]">
            <input
              type="text"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              placeholder="Tìm node..."
              className="h-8 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2.5 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-focus-ring)]"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            <p className="px-1 text-[11px] font-medium text-[var(--color-text-muted)]">
              Nhấn để thêm vào canvas
            </p>
            {filteredLib.map((item) => (
              <button
                key={item.category}
                type="button"
                onClick={() => handleAddNode(item)}
                className="w-full rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-2.5 text-left hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer space-y-0.5"
              >
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-primary)]">
                  <NodeCategoryIcon category={item.category} />
                  <span className="truncate">{item.label}</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">{item.description}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Center React Flow Canvas */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <div className="flex-1 min-h-[280px] relative">
            <ReactFlow
              nodes={activeWf.nodes as any}
              edges={activeWf.edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-border-strong)" />
              <Controls />
            </ReactFlow>
          </div>

          {/* Bottom Execution Log */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-1)] shrink-0">
            <button
              type="button"
              onClick={() => setLogOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 h-9 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Nhật ký thực thi Workflow ({activeWf.executionLog.length})</span>
              </span>
              <span>{logOpen ? 'Thu gọn' : 'Mở rộng'}</span>
            </button>
            {logOpen && (
              <div className="max-h-[140px] overflow-y-auto px-4 pb-3 space-y-1 font-mono-tech text-[11px]">
                {activeWf.executionLog.length === 0 ? (
                  <p className="text-[var(--color-text-muted)]">Nhấn "Chạy" để xem dòng thực thi mô phỏng theo từng node.</p>
                ) : (
                  activeWf.executionLog.map((entry) => (
                    <div key={entry.id} className="flex items-baseline gap-2.5">
                      <span className="text-[var(--color-text-muted)] shrink-0">{entry.time}</span>
                      <span className="text-[var(--color-accent-text)] shrink-0">[{entry.node}]</span>
                      <span className="text-[var(--color-text-secondary)]">{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Node Inspector (~310px) */}
        <aside className="hidden lg:flex w-[310px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-sidebar)] p-4 overflow-y-auto space-y-4">
          <h2 className="text-h4 text-[var(--color-text-primary)]">Node Inspector</h2>
          {!selectedNode ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Chọn một node trên canvas để chỉnh sửa cấu hình và xem trạng thái đầu vào/đầu ra.
            </p>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <StatusTag tone="neutral">{selectedNode.data.category}</StatusTag>
                <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">{selectedNode.id}</span>
              </div>

              <Input
                label="Tên node"
                value={selectedNode.data.label}
                onChange={(e) =>
                  updateWorkflowGraph(
                    activeWf.id,
                    activeWf.nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n
                    ),
                    activeWf.edges
                  )
                }
              />

              <Textarea
                label="Mô tả hành vi"
                value={selectedNode.data.description}
                onChange={(e) =>
                  updateWorkflowGraph(
                    activeWf.id,
                    activeWf.nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, data: { ...n.data, description: e.target.value } } : n
                    ),
                    activeWf.edges
                  )
                }
              />

              <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]">
                <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Tham số cấu hình</p>
                {Object.entries(selectedNode.data.config).map(([k, val]) => (
                  <Input
                    key={k}
                    label={k}
                    value={val}
                    onChange={(e) =>
                      updateWorkflowGraph(
                        activeWf.id,
                        activeWf.nodes.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, config: { ...n.data.config, [k]: e.target.value } } }
                            : n
                        ),
                        activeWf.edges
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
