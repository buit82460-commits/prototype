import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ActivityEvent,
  AppNotification,
  ApprovalRequest,
  BrowserConnectionState,
  BrowserProfile,
  ChatMessage,
  Conversation,
  EvidenceRecord,
  IntegrationItem,
  InterventionItem,
  KnowledgeDocument,
  MediaAsset,
  OwnershipState,
  Project,
  Publication,
  ResearchProject,
  ResearchRecord,
  ResourceKind,
  ResourceOwnership,
  Schedule,
  Task,
  TaskPriority,
  TaskStatus,
  UserSettings,
  Workflow,
  WorkflowEdgeItem,
  WorkflowNodeItem,
} from '../domain/types';
import {
  getNextOwnershipState,
  isTaskActive,
  transitionTaskStatus,
} from '../domain/taskMachine';
import { createInitialSeedState, type MiroSeedState } from '../services/mock/seedData';
import { generateId } from '../lib/utils';

export type LiveWorkspaceMode = 'hidden' | 'split' | 'expanded';

export interface ActiveContextSelection {
  resourceKind?: ResourceKind;
  resourceId?: string;
  resourceLabel?: string;
  projectId?: string;
  taskId?: string;
  route?: string;
}

interface MiroUIState {
  activeConversationId: string;
  liveWorkspaceMode: LiveWorkspaceMode;
  liveWorkspaceTaskId: string | null;
  liveWorkspaceTab: 'workspace' | 'activity' | 'evidence' | 'result';
  taskMonitorOpen: boolean;
  approvalCenterOpen: boolean;
  aiAssistantOpen: boolean;
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
  activeContext: ActiveContextSelection;
  lastConversationRouteId: string | null;
}

interface MiroActions {
  // Settings & UI
  updateSettings: (patch: Partial<UserSettings>) => void;
  setActiveConversation: (id: string) => void;
  createConversation: (title?: string, projectId?: string) => string;
  setLiveWorkspace: (mode: LiveWorkspaceMode, taskId?: string | null) => void;
  setLiveWorkspaceTab: (tab: 'workspace' | 'activity' | 'evidence' | 'result') => void;
  setTaskMonitorOpen: (open: boolean) => void;
  setApprovalCenterOpen: (open: boolean) => void;
  setAiAssistantOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setActiveContext: (ctx: ActiveContextSelection) => void;
  setLastConversationRouteId: (id: string | null) => void;

  // Messages
  appendMessage: (conversationId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;

  // Tasks
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updater: (t: Task) => Task) => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  setTaskPriority: (taskId: string, priority: TaskPriority) => void;
  stopAllAutomatedTasks: () => number;

  // Ownership (Human Takeover)
  requestTakeover: (resourceId: string, resourceKind: ResourceKind, taskId?: string) => void;
  advanceOwnershipTransfer: (resourceId: string) => void;
  returnControlToAi: (resourceId: string, editSummary?: string) => void;
  advanceOwnershipReturn: (resourceId: string) => void;

  // Schedules
  upsertSchedule: (schedule: Schedule) => void;
  updateSchedule: (scheduleId: string, patch: Partial<Schedule>) => void;
  deleteSchedule: (scheduleId: string) => void;
  duplicateSchedule: (scheduleId: string) => Schedule | null;

  // Workflows
  upsertWorkflow: (wf: Workflow) => void;
  updateWorkflowGraph: (wfId: string, nodes: WorkflowNodeItem[], edges: WorkflowEdgeItem[]) => void;
  toggleWorkflowEnabled: (wfId: string) => void;
  appendWorkflowLog: (wfId: string, entry: Workflow['executionLog'][number]) => void;

  // Browser
  setProfileConnection: (profileId: string, state: BrowserConnectionState) => void;
  updateProfile: (profileId: string, updater: (p: BrowserProfile) => BrowserProfile) => void;

  // Research
  upsertResearchProject: (proj: ResearchProject) => void;
  addResearchRecord: (rec: ResearchRecord) => void;
  updateResearchRecordNotes: (recordId: string, notes: string) => void;
  updateResearchProjectNotes: (researchId: string, notes: string) => void;

  // Media
  addMediaAsset: (asset: MediaAsset) => void;
  updateMediaAsset: (assetId: string, patch: Partial<MediaAsset>) => void;

  // Publishing
  upsertPublication: (pub: Publication) => void;
  updatePublication: (pubId: string, patch: Partial<Publication>) => void;

  // Knowledge
  upsertKnowledgeDoc: (doc: KnowledgeDocument) => void;
  toggleKnowledgeContext: (docId: string) => void;
  deleteKnowledgeDoc: (docId: string) => void;

  // Approvals, Interventions, Notifications, Activity, Evidence
  addApproval: (appr: ApprovalRequest) => void;
  resolveApproval: (approvalId: string, decision: 'approved' | 'rejected') => void;
  addIntervention: (item: InterventionItem) => void;
  resolveIntervention: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  addActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  addEvidence: (ev: Omit<EvidenceRecord, 'id' | 'timestamp'>) => void;

  // Integrations
  updateIntegrationStatus: (id: string, status: IntegrationItem['status'], note?: string) => void;

  // Demo Reset
  resetDemoData: () => void;
}

export type MiroStore = MiroSeedState & MiroUIState & MiroActions;

function buildInitialUI(): MiroUIState {
  return {
    activeConversationId: 'conv-new',
    liveWorkspaceMode: 'hidden',
    liveWorkspaceTaskId: null,
    liveWorkspaceTab: 'workspace',
    taskMonitorOpen: false,
    approvalCenterOpen: false,
    aiAssistantOpen: false,
    commandPaletteOpen: false,
    mobileNavOpen: false,
    activeContext: {},
    lastConversationRouteId: null,
  };
}

export const useMiroStore = create<MiroStore>()(
  persist(
    (set, get) => ({
      ...createInitialSeedState(),
      ...buildInitialUI(),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setActiveConversation: (id) =>
        set({ activeConversationId: id }),

      createConversation: (title, projectId) => {
        const id = generateId('conv');
        const conv: Conversation = {
          id,
          title: title || (get().settings.language === 'en' ? 'New session' : 'Phiên làm việc mới'),
          projectId,
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setLiveWorkspace: (mode, taskId) =>
        set((s) => ({
          liveWorkspaceMode: mode,
          liveWorkspaceTaskId: taskId !== undefined ? taskId : s.liveWorkspaceTaskId,
        })),

      setLiveWorkspaceTab: (tab) => set({ liveWorkspaceTab: tab }),
      setTaskMonitorOpen: (open) => set({ taskMonitorOpen: open }),
      setApprovalCenterOpen: (open) => set({ approvalCenterOpen: open }),
      setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      setActiveContext: (ctx) => set({ activeContext: ctx }),
      setLastConversationRouteId: (id) => set({ lastConversationRouteId: id }),

      appendMessage: (conversationId, msg) => {
        const id = generateId('msg');
        const nowIso = new Date().toISOString();
        const full: ChatMessage = { ...msg, id, timestamp: nowIso };
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const shouldRename =
              c.messages.length === 0 && msg.role === 'user' && msg.content.trim().length > 0;
            return {
              ...c,
              title: shouldRename ? msg.content.trim().slice(0, 44) : c.title,
              updatedAt: nowIso,
              messages: [...c.messages, full],
            };
          }),
        }));
        return id;
      },

      addTask: (task) =>
        set((s) => ({
          tasks: [task, ...s.tasks],
          activities: [
            {
              id: generateId('act'),
              type: 'task_lifecycle',
              timestamp: new Date().toISOString(),
              taskId: task.id,
              resourceId: task.resource.id,
              resourceLabel: task.resource.label,
              summary: `Khởi tạo tác vụ "${task.title}" (${task.trigger}).`,
              technicalMeta: { taskId: task.id, scenario: task.scenario, trigger: task.trigger },
            },
            ...s.activities,
          ],
        })),

      updateTask: (taskId, updater) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? updater(t) : t)),
        })),

      pauseTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const nextStatus = transitionTaskStatus(task.status, 'pause');
        if (nextStatus === task.status) return;
        const nowIso = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: nextStatus, updatedAt: nowIso, currentOperation: 'Đã tạm dừng theo yêu cầu người vận hành' }
              : t
          ),
          activities: [
            {
              id: generateId('act'),
              type: 'task_lifecycle',
              timestamp: nowIso,
              taskId,
              resourceId: task.resource.id,
              resourceLabel: task.resource.label,
              summary: `Tạm dừng tác vụ "${task.title}".`,
              technicalMeta: { prevStatus: task.status, nextStatus },
            },
            ...s.activities,
          ],
        }));
      },

      resumeTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const nextStatus = transitionTaskStatus(task.status, 'resume');
        if (nextStatus === task.status) return;
        const nowIso = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: nextStatus, updatedAt: nowIso, currentOperation: 'Tiếp tục thực thi tác vụ mô phỏng...' }
              : t
          ),
          activities: [
            {
              id: generateId('act'),
              type: 'task_lifecycle',
              timestamp: nowIso,
              taskId,
              resourceId: task.resource.id,
              resourceLabel: task.resource.label,
              summary: `Tiếp tục thực thi tác vụ "${task.title}".`,
              technicalMeta: { prevStatus: task.status, nextStatus },
            },
            ...s.activities,
          ],
        }));
      },

      cancelTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const nextStatus = transitionTaskStatus(task.status, 'cancel');
        if (nextStatus === task.status) return;
        const nowIso = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: nextStatus,
                  updatedAt: nowIso,
                  completedAt: nowIso,
                  currentOperation: 'Đã hủy bởi người vận hành',
                }
              : t
          ),
          browserProfiles: s.browserProfiles.map((p) =>
            p.currentTaskId === taskId
              ? { ...p, currentTaskId: undefined, connectionState: p.connectionState === 'busy' ? 'connected' : p.connectionState }
              : p
          ),
          activities: [
            {
              id: generateId('act'),
              type: 'task_lifecycle',
              timestamp: nowIso,
              taskId,
              resourceId: task.resource.id,
              resourceLabel: task.resource.label,
              summary: `Hủy tác vụ "${task.title}".`,
              technicalMeta: { prevStatus: task.status, nextStatus },
            },
            ...s.activities,
          ],
        }));
      },

      retryTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const nowIso = new Date().toISOString();
        const isRecovery = task.scenario === 'recovery_demo';
        const nextStatus: TaskStatus = isRecovery ? 'recovering' : 'queued';
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: nextStatus,
                  errorMessage: undefined,
                  partialNote: undefined,
                  updatedAt: nowIso,
                  progress: {
                    ...t.progress,
                    current: 0,
                    stageLabel: isRecovery ? 'Đang khôi phục kết nối Profile 23...' : 'Đang đưa lại vào hàng đợi...',
                  },
                  currentOperation: isRecovery ? 'Đang kết nối lại tài nguyên và thử lại tác vụ' : 'Đã xếp hàng thử lại',
                  steps: t.steps.map((st, idx) => ({
                    ...st,
                    status: idx === 0 ? 'active' : 'pending',
                    detail: undefined,
                  })),
                }
              : t
          ),
          browserProfiles: isRecovery
            ? s.browserProfiles.map((p) =>
                p.id === task.profileId ? { ...p, connectionState: 'reconnecting' } : p
              )
            : s.browserProfiles,
          activities: [
            {
              id: generateId('act'),
              type: 'recovery',
              timestamp: nowIso,
              taskId,
              resourceId: task.resource.id,
              resourceLabel: task.resource.label,
              summary: `Khởi chạy thử lại tác vụ "${task.title}".`,
              technicalMeta: { mode: isRecovery ? 'recovery' : 'retry' },
            },
            ...s.activities,
          ],
        }));
      },

      setTaskPriority: (taskId, priority) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, priority, updatedAt: new Date().toISOString() } : t)),
        })),

      stopAllAutomatedTasks: () => {
        const nowIso = new Date().toISOString();
        let stoppedCount = 0;
        set((s) => {
          const nextTasks = s.tasks.map((t) => {
            if (isTaskActive(t.status) || t.status === 'waiting_for_resource') {
              stoppedCount += 1;
              return {
                ...t,
                status: 'paused' as TaskStatus,
                updatedAt: nowIso,
                currentOperation: 'Đã dừng khẩn cấp cùng toàn bộ tác vụ tự động',
              };
            }
            return t;
          });
          return {
            tasks: nextTasks,
            browserProfiles: s.browserProfiles.map((p) =>
              p.connectionState === 'busy' ? { ...p, connectionState: 'connected', currentTaskId: undefined } : p
            ),
            activities: [
              {
                id: generateId('act'),
                type: 'task_lifecycle',
                timestamp: nowIso,
                summary: `Đã dừng khẩn cấp ${stoppedCount} tác vụ tự động đang chạy/chờ.`,
                technicalMeta: { stoppedCount, action: 'stop_all' },
              },
              ...s.activities,
            ],
          };
        });
        return stoppedCount;
      },

      requestTakeover: (resourceId, resourceKind, taskId) => {
        const nowIso = new Date().toISOString();
        const existing = get().ownerships[resourceId];
        const current: OwnershipState = existing?.state ?? 'ai_controlled';
        const next = getNextOwnershipState(current, 'request_takeover');
        set((s) => ({
          ownerships: {
            ...s.ownerships,
            [resourceId]: {
              resourceId,
              resourceKind,
              state: next,
              taskId: taskId ?? existing?.taskId,
              updatedAt: nowIso,
            },
          },
          tasks: s.tasks.map((t) =>
            t.id === taskId || t.resource.id === resourceId
              ? isTaskActive(t.status)
                ? { ...t, status: 'pausing', currentOperation: 'Đang tạm dừng cập nhật AI để bàn giao quyền cho bạn...' }
                : t
              : t
          ),
          activities: [
            {
              id: generateId('act'),
              type: 'resource_update',
              timestamp: nowIso,
              taskId,
              resourceId,
              summary: `Yêu cầu Human Takeover trên tài nguyên ${resourceId}.`,
              technicalMeta: { ownershipState: next, simulated: true },
            },
            ...s.activities,
          ],
        }));
      },

      advanceOwnershipTransfer: (resourceId) => {
        const nowIso = new Date().toISOString();
        const existing = get().ownerships[resourceId];
        if (!existing) return;
        const next = getNextOwnershipState(existing.state, 'advance_transfer');
        set((s) => ({
          ownerships: {
            ...s.ownerships,
            [resourceId]: { ...existing, state: next, updatedAt: nowIso },
          },
          tasks:
            next === 'human_controlled'
              ? s.tasks.map((t) =>
                  t.id === existing.taskId || t.resource.id === resourceId
                    ? t.status === 'pausing' || isTaskActive(t.status)
                      ? { ...t, status: 'paused', currentOperation: 'Tạm dừng — Bạn đang trực tiếp điều khiển tài nguyên (Mô phỏng)' }
                      : t
                    : t
                )
              : s.tasks,
        }));
      },

      returnControlToAi: (resourceId, editSummary) => {
        const nowIso = new Date().toISOString();
        const existing = get().ownerships[resourceId];
        if (!existing) return;
        const next = getNextOwnershipState(existing.state, 'return_control');
        set((s) => ({
          ownerships: {
            ...s.ownerships,
            [resourceId]: {
              ...existing,
              state: next,
              updatedAt: nowIso,
              lastHumanEditSummary: editSummary || existing.lastHumanEditSummary,
            },
          },
          activities: [
            {
              id: generateId('act'),
              type: 'resource_update',
              timestamp: nowIso,
              taskId: existing.taskId,
              resourceId,
              summary: `Người dùng trả quyền điều khiển tài nguyên ${resourceId} về cho Miro.${editSummary ? ` (${editSummary})` : ''}`,
              technicalMeta: { ownershipState: next, simulated: true },
            },
            ...s.activities,
          ],
        }));
      },

      advanceOwnershipReturn: (resourceId) => {
        const nowIso = new Date().toISOString();
        const existing = get().ownerships[resourceId];
        if (!existing) return;
        const next = getNextOwnershipState(existing.state, 'advance_return');
        set((s) => ({
          ownerships: {
            ...s.ownerships,
            [resourceId]: { ...existing, state: next, updatedAt: nowIso },
          },
          tasks:
            next === 'ai_controlled'
              ? s.tasks.map((t) =>
                  (t.id === existing.taskId || t.resource.id === resourceId) && t.status === 'paused'
                    ? {
                        ...t,
                        status: 'running',
                        updatedAt: nowIso,
                        currentOperation: existing.lastHumanEditSummary
                          ? `Miro đã quan sát thay đổi (${existing.lastHumanEditSummary}) và tiếp tục thực thi`
                          : 'Miro đã quan sát lại trạng thái mới và tiếp tục thực thi',
                      }
                    : t
                )
              : s.tasks,
        }));
      },

      upsertSchedule: (schedule) =>
        set((s) => {
          const exists = s.schedules.some((sc) => sc.id === schedule.id);
          return {
            schedules: exists
              ? s.schedules.map((sc) => (sc.id === schedule.id ? schedule : sc))
              : [schedule, ...s.schedules],
          };
        }),

      updateSchedule: (scheduleId, patch) =>
        set((s) => ({
          schedules: s.schedules.map((sc) => (sc.id === scheduleId ? { ...sc, ...patch } : sc)),
        })),

      deleteSchedule: (scheduleId) =>
        set((s) => ({
          schedules: s.schedules.filter((sc) => sc.id !== scheduleId),
        })),

      duplicateSchedule: (scheduleId) => {
        const orig = get().schedules.find((sc) => sc.id === scheduleId);
        if (!orig) return null;
        const copy: Schedule = {
          ...orig,
          id: generateId('sched'),
          name: `${orig.name} (Bản sao)`,
          enabled: false,
          status: 'draft',
          history: [],
        };
        set((s) => ({ schedules: [copy, ...s.schedules] }));
        return copy;
      },

      upsertWorkflow: (wf) =>
        set((s) => {
          const exists = s.workflows.some((w) => w.id === wf.id);
          return {
            workflows: exists ? s.workflows.map((w) => (w.id === wf.id ? wf : w)) : [wf, ...s.workflows],
          };
        }),

      updateWorkflowGraph: (wfId, nodes, edges) =>
        set((s) => ({
          workflows: s.workflows.map((w) => (w.id === wfId ? { ...w, nodes, edges } : w)),
        })),

      toggleWorkflowEnabled: (wfId) =>
        set((s) => ({
          workflows: s.workflows.map((w) => (w.id === wfId ? { ...w, enabled: !w.enabled } : w)),
        })),

      appendWorkflowLog: (wfId, entry) =>
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === wfId ? { ...w, executionLog: [entry, ...w.executionLog].slice(0, 40) } : w
          ),
        })),

      setProfileConnection: (profileId, state) => {
        const nowIso = new Date().toISOString();
        set((s) => ({
          browserProfiles: s.browserProfiles.map((p) =>
            p.id === profileId
              ? {
                  ...p,
                  connectionState: state,
                  identityVerification: state === 'connected' ? 'verified' : p.identityVerification,
                  lastActivity: nowIso,
                  observations: [
                    state === 'connected'
                      ? 'Đã kết nối lại cầu nối mô phỏng thành công.'
                      : state === 'disconnected'
                      ? 'Người dùng đã ngắt kết nối phiên mô phỏng.'
                      : `Chuyển trạng thái kết nối: ${state}.`,
                    ...p.observations,
                  ].slice(0, 6),
                }
              : p
          ),
          interventions:
            state === 'connected'
              ? s.interventions.map((i) =>
                  i.affectedResourceId === profileId ? { ...i, resolved: true } : i
                )
              : s.interventions,
          activities: [
            {
              id: generateId('act'),
              type: 'connection',
              timestamp: nowIso,
              resourceId: profileId,
              summary: `Cập nhật trạng thái kết nối ${profileId} -> ${state}.`,
              technicalMeta: { profileId, connectionState: state, simulated: true },
            },
            ...s.activities,
          ],
        }));
      },

      updateProfile: (profileId, updater) =>
        set((s) => ({
          browserProfiles: s.browserProfiles.map((p) => (p.id === profileId ? updater(p) : p)),
        })),

      upsertResearchProject: (proj) =>
        set((s) => {
          const exists = s.researchProjects.some((r) => r.id === proj.id);
          return {
            researchProjects: exists
              ? s.researchProjects.map((r) => (r.id === proj.id ? proj : r))
              : [proj, ...s.researchProjects],
          };
        }),

      addResearchRecord: (rec) =>
        set((s) => ({
          researchRecords: [rec, ...s.researchRecords],
        })),

      updateResearchRecordNotes: (recordId, notes) =>
        set((s) => ({
          researchRecords: s.researchRecords.map((r) => (r.id === recordId ? { ...r, notes } : r)),
        })),

      updateResearchProjectNotes: (researchId, notes) =>
        set((s) => ({
          researchProjects: s.researchProjects.map((r) => (r.id === researchId ? { ...r, notes } : r)),
        })),

      addMediaAsset: (asset) =>
        set((s) => ({ mediaAssets: [asset, ...s.mediaAssets] })),

      updateMediaAsset: (assetId, patch) =>
        set((s) => ({
          mediaAssets: s.mediaAssets.map((a) => (a.id === assetId ? { ...a, ...patch } : a)),
        })),

      upsertPublication: (pub) =>
        set((s) => {
          const exists = s.publications.some((p) => p.id === pub.id);
          return {
            publications: exists
              ? s.publications.map((p) => (p.id === pub.id ? pub : p))
              : [pub, ...s.publications],
          };
        }),

      updatePublication: (pubId, patch) =>
        set((s) => ({
          publications: s.publications.map((p) => (p.id === pubId ? { ...p, ...patch } : p)),
        })),

      upsertKnowledgeDoc: (doc) =>
        set((s) => {
          const exists = s.knowledgeDocs.some((d) => d.id === doc.id);
          return {
            knowledgeDocs: exists
              ? s.knowledgeDocs.map((d) => (d.id === doc.id ? doc : d))
              : [doc, ...s.knowledgeDocs],
          };
        }),

      toggleKnowledgeContext: (docId) =>
        set((s) => ({
          knowledgeDocs: s.knowledgeDocs.map((d) =>
            d.id === docId ? { ...d, includedInAiContext: !d.includedInAiContext } : d
          ),
        })),

      deleteKnowledgeDoc: (docId) =>
        set((s) => ({
          knowledgeDocs: s.knowledgeDocs.filter((d) => d.id !== docId),
        })),

      addApproval: (appr) =>
        set((s) => ({ approvals: [appr, ...s.approvals] })),

      resolveApproval: (approvalId, decision) => {
        const appr = get().approvals.find((a) => a.id === approvalId);
        if (!appr || appr.status !== 'pending') return;
        const nowIso = new Date().toISOString();
        set((s) => ({
          approvals: s.approvals.map((a) =>
            a.id === approvalId ? { ...a, status: decision, resolvedAt: nowIso } : a
          ),
          tasks: s.tasks.map((t) => {
            if (t.id !== appr.taskId) return t;
            if (decision === 'approved') {
              return {
                ...t,
                status: 'running',
                updatedAt: nowIso,
                currentOperation: 'Đã phê duyệt — Đang hoàn tất xuất bản mô phỏng...',
                progress: {
                  mode: 'stage',
                  current: 3,
                  total: 4,
                  unitLabel: 'bước',
                  stageLabel: 'Đang hoàn tất xuất bản mô phỏng',
                },
                steps: t.steps.map((st, idx) =>
                  idx <= 2 ? { ...st, status: 'completed', timestamp: nowIso } : { ...st, status: 'active' }
                ),
              };
            }
            return {
              ...t,
              status: 'cancelled',
              updatedAt: nowIso,
              completedAt: nowIso,
              currentOperation: 'Đã từ chối phê duyệt xuất bản',
              steps: t.steps.map((st, idx) =>
                idx === 2 ? { ...st, status: 'failed', detail: 'Người vận hành đã từ chối.' } : idx > 2 ? { ...st, status: 'skipped' } : st
              ),
            };
          }),
          publications: s.publications.map((p) =>
            p.id === appr.targetResourceId
              ? { ...p, status: decision === 'approved' ? 'approved' : 'rejected' }
              : p
          ),
          notifications: [
            {
              id: generateId('notif'),
              message:
                decision === 'approved'
                  ? `Đã phê duyệt: ${appr.requestedAction}`
                  : `Đã từ chối: ${appr.requestedAction}`,
              timestamp: nowIso,
              relatedRoute: appr.targetRoute,
              relatedLabel: appr.targetResourceLabel,
              read: false,
              level: decision === 'approved' ? 'success' : 'warning',
            },
            ...s.notifications,
          ],
          activities: [
            {
              id: generateId('act'),
              type: 'approval',
              timestamp: nowIso,
              taskId: appr.taskId,
              resourceId: appr.targetResourceId,
              resourceLabel: appr.targetResourceLabel,
              summary:
                decision === 'approved'
                  ? `Phê duyệt yêu cầu cho ${appr.targetResourceLabel}.`
                  : `Từ chối yêu cầu cho ${appr.targetResourceLabel}.`,
              technicalMeta: { approvalId, decision },
            },
            ...s.activities,
          ],
        }));
      },

      addIntervention: (item) =>
        set((s) => ({ interventions: [item, ...s.interventions] })),

      resolveIntervention: (id) =>
        set((s) => ({
          interventions: s.interventions.map((i) => (i.id === id ? { ...i, resolved: true } : i)),
        })),

      addNotification: (notif) =>
        set((s) => ({
          notifications: [
            { ...notif, id: generateId('notif'), timestamp: new Date().toISOString(), read: false },
            ...s.notifications,
          ],
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      addActivity: (event) =>
        set((s) => ({
          activities: [
            { ...event, id: generateId('act'), timestamp: new Date().toISOString() },
            ...s.activities,
          ].slice(0, 120),
        })),

      addEvidence: (ev) =>
        set((s) => ({
          evidences: [
            { ...ev, id: generateId('ev'), timestamp: new Date().toISOString() },
            ...s.evidences,
          ],
        })),

      updateIntegrationStatus: (id, status, note) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, status, note: note ?? i.note } : i
          ),
        })),

      resetDemoData: () => {
        const currentSettings = get().settings;
        const fresh = createInitialSeedState();
        set({
          ...fresh,
          ...buildInitialUI(),
          settings: { ...fresh.settings, theme: currentSettings.theme, language: currentSettings.language },
        });
      },
    }),
    {
      name: 'miro-workspace-v2-store',
      partialize: (state) => ({
        settings: state.settings,
        projects: state.projects,
        browserProfiles: state.browserProfiles,
        schedules: state.schedules,
        workflows: state.workflows,
        researchProjects: state.researchProjects,
        researchRecords: state.researchRecords,
        mediaAssets: state.mediaAssets,
        publications: state.publications,
        knowledgeDocs: state.knowledgeDocs,
        tasks: state.tasks,
        ownerships: state.ownerships,
        approvals: state.approvals,
        interventions: state.interventions,
        notifications: state.notifications,
        activities: state.activities,
        evidences: state.evidences,
        conversations: state.conversations,
        integrations: state.integrations,
      }),
    }
  )
);
