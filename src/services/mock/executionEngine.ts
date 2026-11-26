import { toast } from 'sonner';
import { useMiroStore } from '../../stores/useMiroStore';
import {
  canAiWriteResource,
  hasExclusiveResourceConflict,
} from '../../domain/taskMachine';
import type {
  Publication,
  ResearchProject,
  ResearchRecord,
  Schedule,
  Task,
  TaskScenarioKind,
  TaskTrigger,
} from '../../domain/types';
import { SAMPLE_TIKTOK_CREATORS } from './seedData';
import { generateId } from '../../lib/utils';

const SCHEDULE_STAGES = [
  { field: 'name', label: 'Đặt tên lịch trình & mục tiêu', apply: (s: Schedule) => ({ name: s.name || 'Nghiên cứu 10 video TikTok KANS 377', configuringField: 'name' }) },
  { field: 'instruction', label: 'Cấu hình hướng dẫn thực thi cho Miro', apply: (s: Schedule) => ({ instruction: s.instruction, configuringField: 'instruction' }) },
  { field: 'time', label: 'Thiết lập khung giờ 08:00 mỗi ngày (Asia/Bangkok)', apply: () => ({ time: '08:00', recurrence: 'daily' as const, timezone: 'Asia/Bangkok', configuringField: 'time' }) },
  { field: 'targetResourceId', label: 'Gán tài nguyên mục tiêu Profile 20', apply: () => ({ targetResourceId: 'profile-20', targetResourceLabel: 'Profile 20 · TikTok Research Main', configuringField: 'targetResourceId' }) },
  { field: 'approvalPolicy', label: 'Xác nhận chính sách chạy & kích hoạt lịch', apply: () => ({ approvalPolicy: 'auto' as const, enabled: true, status: 'active' as const, configuringField: null }) },
];

let engineTimer: ReturnType<typeof setInterval> | null = null;

export function detectScenarioFromPrompt(prompt: string): TaskScenarioKind {
  const lower = prompt.toLowerCase();
  if (lower.includes('lịch') || lower.includes('schedule') || lower.includes('8 giờ') || lower.includes('mỗi ngày')) {
    return 'schedule_create';
  }
  if (lower.includes('một phần') || lower.includes('partial') || lower.includes('5 video') || lower.includes('5 bản ghi')) {
    return 'partial_research';
  }
  if (lower.includes('profile 23') || lower.includes('khôi phục') || lower.includes('lỗi') || lower.includes('recovery')) {
    return 'recovery_demo';
  }
  if (lower.includes('đăng') || lower.includes('xuất bản') || lower.includes('publish') || lower.includes('duyệt')) {
    return 'publish_approval';
  }
  if (lower.includes('phân tích video') || lower.includes('analyze this video') || lower.includes('media') || lower.includes('product review')) {
    return 'media_analysis';
  }
  if (lower.includes('workflow') || lower.includes('luồng')) {
    return 'workflow_run';
  }
  if (lower.includes('báo cáo') || lower.includes('tài liệu') || lower.includes('soạn') || lower.includes('document')) {
    return 'document_draft';
  }
  return 'tiktok_research';
}

export function launchTaskFromInstruction(params: {
  instruction: string;
  conversationId?: string;
  trigger?: TaskTrigger;
  profileId?: string;
  projectId?: string;
  overrideScenario?: TaskScenarioKind;
  openLive?: boolean;
}): Task {
  const store = useMiroStore.getState();
  const scenario = params.overrideScenario ?? detectScenarioFromPrompt(params.instruction);
  const nowIso = new Date().toISOString();
  const taskId = generateId('task');
  const trigger = params.trigger ?? 'chat';
  const requestedProfileId =
    params.profileId ??
    (params.instruction.includes('21')
      ? 'profile-21'
      : params.instruction.includes('23')
      ? 'profile-23'
      : store.settings.defaultProfileId || 'profile-20');

  let task: Task;

  if (scenario === 'schedule_create') {
    const scheduleId = generateId('sched');
    const draftSchedule: Schedule = {
      id: scheduleId,
      name: 'Nghiên cứu 10 video TikTok về KANS 377',
      instruction: params.instruction,
      enabled: false,
      triggerType: 'recurring',
      time: '08:00',
      date: nowIso.slice(0, 10),
      recurrence: 'daily',
      timezone: store.settings.timezone || 'Asia/Bangkok',
      targetResourceId: requestedProfileId,
      targetResourceLabel: `${requestedProfileId === 'profile-21' ? 'Profile 21 · Fashion Media Collector' : 'Profile 20 · TikTok Research Main'}`,
      maxRunsPerDay: 1,
      missedRunPolicy: 'queue_next',
      approvalPolicy: 'auto',
      nextRun: new Date(Date.now() + 14 * 3600_000).toISOString(),
      status: 'configuring',
      configuringField: 'name',
      projectId: params.projectId ?? 'proj-kans-377',
      taskId,
      history: [],
    };
    store.upsertSchedule(draftSchedule);

    task = {
      id: taskId,
      title: 'Tạo lịch trình nghiên cứu KANS 377 (08:00 hàng ngày)',
      instruction: params.instruction,
      scenario: 'schedule_create',
      status: 'queued',
      priority: 'high',
      progress: {
        mode: 'stage',
        current: 0,
        total: SCHEDULE_STAGES.length,
        unitLabel: 'bước cấu hình',
        stageLabel: 'Chuẩn bị khởi tạo bản nháp lịch trình',
      },
      resource: {
        kind: 'schedule',
        id: scheduleId,
        label: draftSchedule.name,
        route: `/schedules/${scheduleId}`,
      },
      profileId: requestedProfileId,
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-kans-377',
      currentOperation: 'Đang tạo bản nháp lịch trình trong Schedules...',
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: SCHEDULE_STAGES.map((st, idx) => ({
        id: `ss-${idx}`,
        label: st.label,
        status: 'pending',
      })),
    };
  } else if (scenario === 'publish_approval') {
    const pubId = generateId('pub');
    const approvalId = generateId('appr');
    const pub: Publication = {
      id: pubId,
      title: params.instruction.slice(0, 56),
      platform: 'TikTok',
      account: '@miro.demo.beauty',
      mediaAssetId: 'media-product-review-01',
      mediaLabel: 'Product Review 01 (0:42)',
      caption: `${params.instruction}\n\n#KANS377 #mirodemo`,
      hashtags: ['#KANS377', '#mirodemo'],
      scheduledFor: new Date(Date.now() + 2 * 3600_000).toISOString(),
      status: 'waiting_approval',
      projectId: params.projectId ?? 'proj-kans-377',
      taskId,
      approvalId,
      validationIssues: [],
    };
    store.upsertPublication(pub);

    task = {
      id: taskId,
      title: 'Chuẩn bị xuất bản nội dung (Chờ phê duyệt)',
      instruction: params.instruction,
      scenario: 'publish_approval',
      status: 'queued',
      priority: 'high',
      progress: {
        mode: 'stage',
        current: 0,
        total: 4,
        unitLabel: 'bước',
        stageLabel: 'Khởi tạo bản nháp xuất bản',
      },
      resource: {
        kind: 'publishing',
        id: pubId,
        label: `TikTok · ${pub.account}`,
        route: `/publishing/${pubId}`,
      },
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-kans-377',
      approvalId,
      currentOperation: 'Đang kiểm tra nội dung và thiết lập yêu cầu phê duyệt...',
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: [
        { id: 'pa-1', label: 'Đính kèm tư liệu media mẫu', status: 'pending' },
        { id: 'pa-2', label: 'Kiểm tra caption & tuân thủ chính sách', status: 'pending' },
        { id: 'pa-3', label: 'Gửi yêu cầu phê duyệt tới Trung tâm phê duyệt', status: 'pending' },
        { id: 'pa-4', label: 'Hoàn tất xuất bản mô phỏng', status: 'pending' },
      ],
    };
  } else if (scenario === 'partial_research') {
    const resId = generateId('res');
    const researchProj: ResearchProject = {
      id: resId,
      title: 'Khảo sát 5 video mẫu (Giới hạn nguồn mô phỏng)',
      query: params.instruction.slice(0, 36),
      platform: 'TikTok',
      researchType: 'Focused Audit',
      status: 'running',
      targetCount: 5,
      projectId: params.projectId ?? 'proj-kans-377',
      lastActivity: nowIso,
      summary: 'Đang thu thập 5 bản ghi mẫu...',
      notes: '',
      sources: [
        { id: generateId('src'), label: 'TikTok Search Demo', url: 'https://demo.tiktok.local/search?q=partial', capturedAt: nowIso },
      ],
    };
    store.upsertResearchProject(researchProj);

    task = {
      id: taskId,
      title: 'Thu thập 5 bản ghi TikTok mẫu (Kiểm thử kết quả một phần)',
      instruction: params.instruction,
      scenario: 'partial_research',
      status: 'queued',
      priority: 'medium',
      progress: {
        mode: 'count',
        current: 0,
        total: 5,
        unitLabel: 'video',
        stageLabel: 'Đang chuẩn bị thu thập 5 bản ghi mẫu',
      },
      resource: {
        kind: 'research',
        id: resId,
        label: researchProj.title,
        route: `/research/${resId}`,
        exclusiveKey: `browser:${requestedProfileId}`,
      },
      profileId: requestedProfileId,
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-kans-377',
      currentOperation: `Mở ${requestedProfileId} để thu thập 5 bản ghi mẫu`,
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: [
        { id: 'pr-1', label: `Kết nối ${requestedProfileId} (Mô phỏng)`, status: 'pending' },
        { id: 'pr-2', label: 'Quan sát & ghi nhận bản ghi hợp lệ', status: 'pending' },
        { id: 'pr-3', label: 'Đóng gói báo cáo trung thực theo số bản ghi quan sát được', status: 'pending' },
      ],
    };
  } else if (scenario === 'recovery_demo') {
    task = {
      id: taskId,
      title: 'Kiểm tra & thu thập trên Profile 23',
      instruction: params.instruction,
      scenario: 'recovery_demo',
      status: 'queued',
      priority: 'high',
      progress: {
        mode: 'stage',
        current: 0,
        total: 3,
        unitLabel: 'bước',
        stageLabel: 'Kiểm tra kết nối Profile 23',
      },
      resource: {
        kind: 'browser',
        id: 'profile-23',
        label: 'Profile 23 · Backup Scraper Node',
        route: '/browser/profile-23',
        exclusiveKey: 'browser:profile-23',
      },
      profileId: 'profile-23',
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-affiliate-ops',
      currentOperation: 'Đang kiểm tra cầu nối Profile 23...',
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: [
        { id: 'rd-1', label: 'Kiểm tra tín hiệu Profile 23', status: 'pending' },
        { id: 'rd-2', label: 'Xác minh phiên & mở trang mục tiêu', status: 'pending' },
        { id: 'rd-3', label: 'Hoàn tất đồng bộ', status: 'pending' },
      ],
    };
  } else if (scenario === 'media_analysis') {
    const asset = store.mediaAssets[0];
    const assetId = asset?.id ?? 'media-product-review-01';
    store.updateMediaAsset(assetId, { analysisStatus: 'analyzing', analysisProgress: 10 });
    task = {
      id: taskId,
      title: `Phân tích video: ${asset?.name ?? 'Product Review 01'}`,
      instruction: params.instruction,
      scenario: 'media_analysis',
      status: 'queued',
      priority: 'medium',
      progress: {
        mode: 'stage',
        current: 0,
        total: 4,
        unitLabel: 'giai đoạn',
        stageLabel: 'Đang nạp video vào Media Studio',
      },
      resource: {
        kind: 'media',
        id: assetId,
        label: asset?.name ?? 'Product Review 01',
        route: `/media/${assetId}`,
      },
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-kans-377',
      currentOperation: 'Tách phân cảnh & tạo transcript mô phỏng...',
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: [
        { id: 'ma-1', label: 'Trích xuất khung hình chính (Demo)', status: 'pending' },
        { id: 'ma-2', label: 'Xác định ranh giới phân cảnh', status: 'pending' },
        { id: 'ma-3', label: 'Đồng bộ transcript theo mốc thời gian', status: 'pending' },
        { id: 'ma-4', label: 'Tóm tắt cấu trúc Hook & nhịp dựng', status: 'pending' },
      ],
    };
  } else if (scenario === 'document_draft') {
    const docId = generateId('kn');
    store.upsertKnowledgeDoc({
      id: docId,
      title: 'Báo cáo tổng hợp chiến dịch KANS 377 (Bản nháp)',
      collection: 'Ghi chú do AI tạo',
      sourceKind: 'ai_generated',
      content: '# Báo cáo tổng hợp KANS 377 (Đang soạn thảo mô phỏng)\n\nĐang tổng hợp dữ liệu từ bảng Nghiên cứu...',
      tags: ['KANS377', 'report', 'ai-draft'],
      projectId: params.projectId ?? 'proj-kans-377',
      includedInAiContext: true,
      updatedAt: nowIso,
    });
    task = {
      id: taskId,
      title: 'Soạn thảo báo cáo tổng hợp KANS 377',
      instruction: params.instruction,
      scenario: 'document_draft',
      status: 'queued',
      priority: 'medium',
      progress: {
        mode: 'stage',
        current: 0,
        total: 3,
        unitLabel: 'mục',
        stageLabel: 'Đang dựng khung tài liệu',
      },
      resource: {
        kind: 'document',
        id: docId,
        label: 'Báo cáo tổng hợp KANS 377',
        route: '/knowledge',
      },
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-kans-377',
      currentOperation: 'Đang soạn thảo các phần nội dung báo cáo...',
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: [
        { id: 'dd-1', label: 'Tổng hợp số liệu quan sát từ Research', status: 'pending' },
        { id: 'dd-2', label: 'Phân loại 3 nhóm hook hiệu quả nhất', status: 'pending' },
        { id: 'dd-3', label: 'Hoàn thiện đề xuất lịch sản xuất', status: 'pending' },
      ],
    };
  } else {
    // Default Scenario B: TikTok Research 10 videos on Profile 20 (or requested profile)
    const resId = generateId('res');
    const profileObj = store.browserProfiles.find((p) => p.id === requestedProfileId);
    const profileLabel = profileObj ? profileObj.name : 'Profile 20';
    const researchProj: ResearchProject = {
      id: resId,
      title: `Nghiên cứu 10 video KANS 377 (${profileLabel})`,
      query: 'KANS 377',
      platform: 'TikTok',
      researchType: 'TikTok Video Collection',
      status: 'running',
      targetCount: 10,
      projectId: params.projectId ?? 'proj-kans-377',
      lastActivity: nowIso,
      summary: 'Đang thu thập 10 bản ghi video mẫu trên trình duyệt mô phỏng...',
      notes: 'Tất cả bản ghi thu thập được là dữ liệu mẫu mô phỏng.',
      sources: [
        { id: generateId('src'), label: `TikTok Search Demo (${profileLabel})`, url: 'https://demo.tiktok.local/search?q=KANS+377', capturedAt: nowIso },
      ],
    };
    store.upsertResearchProject(researchProj);

    task = {
      id: taskId,
      title: `Nghiên cứu 10 video KANS 377 (${profileLabel})`,
      instruction: params.instruction,
      scenario: 'tiktok_research',
      status: 'queued',
      priority: 'high',
      progress: {
        mode: 'count',
        current: 0,
        total: 10,
        unitLabel: 'video',
        stageLabel: `${profileLabel} · Đang xếp hàng khởi chạy`,
      },
      resource: {
        kind: 'browser',
        id: resId,
        label: `${profileLabel} · KANS 377 Research`,
        route: `/research/${resId}`,
        exclusiveKey: `browser:${requestedProfileId}`,
      },
      profileId: requestedProfileId,
      trigger,
      conversationId: params.conversationId,
      projectId: params.projectId ?? 'proj-kans-377',
      currentOperation: `Chuẩn bị mở ${profileLabel} (Mô phỏng)...`,
      createdAt: nowIso,
      updatedAt: nowIso,
      steps: [
        { id: 'tr-1', label: `Khởi chạy ${profileLabel} & mở TikTok Search (Demo)`, status: 'pending' },
        { id: 'tr-2', label: 'Cuộn & quan sát 10 video KANS 377 mẫu', status: 'pending' },
        { id: 'tr-3', label: 'Chuẩn hóa chỉ số & đánh dấu trường thiếu', status: 'pending' },
        { id: 'tr-4', label: 'Lưu bảng Nghiên cứu & tóm tắt kết quả', status: 'pending' },
      ],
    };
  }

  store.addTask(task);

  if (params.conversationId) {
    const introMap: Record<TaskScenarioKind, string> = {
      schedule_create: 'Miro đã khởi tạo tác vụ cấu hình lịch trình nghiên cứu hàng ngày vào 08:00 (Asia/Bangkok). Bạn có thể quan sát trực tiếp từng trường đang được điền trong Live Workspace hoặc bấm Tiếp quản để chỉnh sửa thủ công.',
      tiktok_research: `Miro đã bắt đầu tác vụ tìm kiếm và phân tích 10 video KANS 377 trên ${task.profileId === 'profile-21' ? 'Profile 21' : 'Profile 20'} (mô phỏng). Tác vụ sẽ tiếp tục chạy nền ngay cả khi bạn đóng Live Workspace hoặc chuyển sang trang khác.`,
      publish_approval: 'Miro đã tạo bản nháp xuất bản mô phỏng và đang gửi yêu cầu phê duyệt. Sẽ không có thao tác đăng nào diễn ra cho đến khi bạn xác nhận.',
      partial_research: 'Miro bắt đầu thu thập 5 bản ghi mẫu. Nếu nguồn giới hạn giữa chừng, Miro sẽ báo trạng thái Hoàn tất một phần với đúng số bản ghi xác thực được.',
      recovery_demo: 'Miro đang kiểm tra kết nối trên Profile 23 để chạy tác vụ. Nếu tài nguyên đang ngắt kết nối, bạn sẽ nhận cảnh báo và nút khôi phục rõ ràng.',
      media_analysis: 'Miro đang phân tích phân cảnh và tạo transcript mô phỏng trong Media Studio.',
      workflow_run: 'Miro đang kích hoạt luồng tự động hóa mô phỏng.',
      document_draft: 'Miro đang soạn thảo tài liệu báo cáo tổng hợp trong Tri thức.',
    };
    store.appendMessage(params.conversationId, {
      role: 'assistant',
      content: introMap[scenario],
      taskId: task.id,
      resourceLinks: [{ label: `Mở ${task.resource.label}`, route: task.resource.route }],
    });
  }

  if (params.openLive ?? store.settings.autoOpenLiveWorkspace) {
    store.setLiveWorkspace('split', task.id);
    store.setLiveWorkspaceTab('workspace');
  }

  return task;
}

export function triggerWorkflowRun(workflowId: string): Task | null {
  const store = useMiroStore.getState();
  const wf = store.workflows.find((w) => w.id === workflowId);
  if (!wf) return null;
  const nowIso = new Date().toISOString();
  const taskId = generateId('task');

  store.updateWorkflowGraph(
    workflowId,
    wf.nodes.map((n, idx) => ({
      ...n,
      data: { ...n.data, status: idx === 0 ? 'running' : 'idle' },
    })),
    wf.edges.map((e, idx) => ({ ...e, animated: idx === 0 }))
  );

  const task: Task = {
    id: taskId,
    title: `Chạy Workflow: ${wf.name}`,
    instruction: `Thực thi mô phỏng workflow "${wf.name}"`,
    scenario: 'workflow_run',
    status: 'running',
    priority: 'medium',
    progress: {
      mode: 'stage',
      current: 0,
      total: wf.nodes.length,
      unitLabel: 'node',
      stageLabel: `Đang chạy node 1/${wf.nodes.length}`,
    },
    resource: {
      kind: 'workflow',
      id: workflowId,
      label: wf.name,
      route: `/workflows/${workflowId}`,
    },
    trigger: 'workflow',
    projectId: wf.projectId,
    currentOperation: `Đang thực thi ${wf.nodes[0]?.data.label ?? 'Trigger'}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    startedAt: nowIso,
    steps: wf.nodes.map((n, idx) => ({
      id: `wfst-${idx}`,
      label: n.data.label,
      status: idx === 0 ? 'active' : 'pending',
    })),
  };

  store.addTask(task);
  store.appendWorkflowLog(workflowId, {
    id: generateId('wl'),
    time: new Date().toTimeString().slice(0, 8),
    node: wf.nodes[0]?.data.label ?? 'Start',
    message: 'Bắt đầu lượt chạy mô phỏng mới.',
    level: 'info',
  });
  return task;
}

function tickOwnershipTransitions() {
  const store = useMiroStore.getState();
  for (const own of Object.values(store.ownerships)) {
    if (own.state === 'takeover_requested' || own.state === 'transferring_control') {
      store.advanceOwnershipTransfer(own.resourceId);
    } else if (own.state === 'returning_control' || own.state === 'ai_resuming') {
      store.advanceOwnershipReturn(own.resourceId);
    }
  }
}

function tickSingleTask(task: Task) {
  const store = useMiroStore.getState();
  const nowIso = new Date().toISOString();

  // Respect Human Takeover ownership lock
  const ownByResource = store.ownerships[task.resource.id];
  const ownByProfile = task.profileId ? store.ownerships[task.profileId] : undefined;
  if (!canAiWriteResource(ownByResource?.state) || !canAiWriteResource(ownByProfile?.state)) {
    return;
  }

  // Handle queued or waiting_for_resource
  if (task.status === 'queued' || task.status === 'waiting_for_resource') {
    if (hasExclusiveResourceConflict(task, store.tasks)) {
      if (task.status !== 'waiting_for_resource') {
        store.updateTask(task.id, (t) => ({
          ...t,
          status: 'waiting_for_resource',
          updatedAt: nowIso,
          currentOperation: `Đang chờ tài nguyên độc quyền ${t.profileId ?? t.resource.label} trống...`,
          progress: { ...t.progress, stageLabel: 'Đang chờ tài nguyên khả dụng' },
        }));
      }
      return;
    }

    store.updateTask(task.id, (t) => ({
      ...t,
      status: 'planning',
      startedAt: t.startedAt ?? nowIso,
      updatedAt: nowIso,
      currentOperation: 'Đang lập kế hoạch các bước thực thi...',
    }));
    return;
  }

  // Handle recovering (Scenario G)
  if (task.status === 'recovering') {
    const profId = task.profileId ?? 'profile-23';
    store.setProfileConnection(profId, 'connected');
    store.updateTask(task.id, (t) => ({
      ...t,
      status: 'running',
      updatedAt: nowIso,
      progress: { ...t.progress, current: 1, stageLabel: 'Đã kết nối lại Profile 23 · Đang đồng bộ' },
      currentOperation: 'Khôi phục thành công — Đang tiếp tục kiểm tra phiên Profile 23',
      steps: t.steps.map((st, idx) =>
        idx === 0 ? { ...st, status: 'completed', timestamp: nowIso } : idx === 1 ? { ...st, status: 'active' } : st
      ),
    }));
    toast.success('Đã kết nối lại Profile 23 (Mô phỏng)');
    return;
  }

  // Transition planning -> running
  if (task.status === 'planning') {
    if (task.profileId) {
      const prof = store.browserProfiles.find((p) => p.id === task.profileId);
      if (prof && prof.connectionState === 'disconnected') {
        store.updateTask(task.id, (t) => ({
          ...t,
          status: 'failed',
          updatedAt: nowIso,
          errorMessage: `${prof.name} đang ở trạng thái Ngắt kết nối. Hãy kết nối lại trong trang Trình duyệt hoặc nhấn Thử lại.`,
          currentOperation: `Thất bại: ${prof.name} không phản hồi`,
          steps: t.steps.map((st, idx) =>
            idx === 0 ? { ...st, status: 'failed', detail: 'Cầu nối mô phỏng đang offline.' } : { ...st, status: 'skipped' }
          ),
        }));
        store.addIntervention({
          id: generateId('int'),
          taskId: task.id,
          problem: `${prof.name} bị ngắt kết nối khi chạy "${task.title}".`,
          affectedResourceId: prof.id,
          affectedResourceLabel: `${prof.name} · ${prof.alias}`,
          recommendedAction: 'Kết nối lại Profile và nhấn Thử lại.',
          workspaceRoute: `/browser/${prof.id}`,
          resolved: false,
          createdAt: nowIso,
        });
        toast.error(`Tác vụ lỗi: ${prof.name} đang ngắt kết nối`);
        return;
      }
      store.updateProfile(task.profileId, (p) => ({
        ...p,
        connectionState: 'busy',
        currentTaskId: task.id,
        lastActivity: nowIso,
      }));
    }

    store.updateTask(task.id, (t) => ({
      ...t,
      status: 'running',
      updatedAt: nowIso,
      steps: t.steps.map((st, idx) => (idx === 0 ? { ...st, status: 'active' } : st)),
    }));
    return;
  }

  if (task.status !== 'running') return;

  // Scenario-specific progression
  if (task.scenario === 'schedule_create') {
    const nextIdx = task.progress.current;
    const sched = store.schedules.find((sc) => sc.id === task.resource.id);
    if (nextIdx < SCHEDULE_STAGES.length) {
      const stage = SCHEDULE_STAGES[nextIdx];
      if (sched) {
        store.updateSchedule(sched.id, stage.apply(sched));
      }
      const nextCount = nextIdx + 1;
      const done = nextCount >= SCHEDULE_STAGES.length;
      store.updateTask(task.id, (t) => ({
        ...t,
        status: done ? 'completed' : 'running',
        updatedAt: nowIso,
        completedAt: done ? nowIso : undefined,
        currentOperation: done ? 'Đã hoàn tất tạo & kích hoạt lịch trình' : stage.label,
        resultSummary: done ? `Lịch trình "${sched?.name ?? t.resource.label}" đã được kích hoạt lúc 08:00 hàng ngày (Asia/Bangkok).` : undefined,
        resultRoute: done ? t.resource.route : undefined,
        progress: {
          mode: 'stage',
          current: nextCount,
          total: SCHEDULE_STAGES.length,
          unitLabel: 'bước cấu hình',
          stageLabel: done ? 'Hoàn tất cấu hình 5/5 bước' : `${nextCount}/${SCHEDULE_STAGES.length} · ${stage.label}`,
        },
        steps: t.steps.map((st, idx) =>
          idx < nextCount
            ? { ...st, status: 'completed', timestamp: st.timestamp ?? nowIso }
            : idx === nextCount
            ? { ...st, status: 'active' }
            : st
        ),
      }));
      if (done) {
        store.addActivity({
          type: 'schedule_execution',
          taskId: task.id,
          resourceId: task.resource.id,
          resourceLabel: task.resource.label,
          summary: `Hoàn tất tạo lịch trình "${sched?.name ?? task.resource.label}".`,
          technicalMeta: { recurrence: 'daily', time: sched?.time ?? '08:00', timezone: sched?.timezone ?? 'Asia/Bangkok' },
        });
        if (store.settings.notifyOnCompletion) {
          store.addNotification({
            message: `Lịch trình "${sched?.name ?? task.title}" đã sẵn sàng.`,
            relatedRoute: task.resource.route,
            relatedLabel: 'Mở lịch trình',
            level: 'success',
          });
          toast.success(`Hoàn tất: ${task.title}`);
        }
      }
    }
    return;
  }

  if (task.scenario === 'tiktok_research') {
    const nextCount = task.progress.current + 1;
    const total = task.progress.total ?? 10;
    const sample = SAMPLE_TIKTOK_CREATORS[(nextCount - 1) % SAMPLE_TIKTOK_CREATORS.length];
    const rec: ResearchRecord = {
      id: generateId('rec'),
      researchId: task.resource.id,
      creator: sample.creator,
      caption: sample.caption,
      hashtags: sample.hashtags,
      views: sample.views,
      likes: sample.likes,
      comments: sample.comments,
      shares: sample.shares,
      sourceUrl: `https://demo.tiktok.local/${sample.creator}/video/7500${nextCount}`,
      observationStatus: sample.comments === null || sample.shares === null ? 'partial' : 'observed',
      missingFields: [
        ...(sample.comments === null ? ['comments'] : []),
        ...(sample.shares === null ? ['shares'] : []),
      ],
      observedAt: nowIso,
      notes: '',
      sampleTag: 'Sample Demo Record',
      thumbnailTone: sample.tone,
    };
    store.addResearchRecord(rec);

    if (task.profileId) {
      store.updateProfile(task.profileId, (p) => ({
        ...p,
        lastActivity: nowIso,
        tabs: p.tabs.map((tb, idx) =>
          idx === 0
            ? {
                ...tb,
                url: rec.sourceUrl,
                title: `TikTok Demo — ${rec.creator}`,
                highlightElement: `Đang ghi nhận video #${nextCount}: ${rec.creator}`,
                pageSummary: rec.caption,
              }
            : tb
        ),
        observations: [`Ghi nhận video mẫu #${nextCount}/${total} (${rec.creator}).`, ...p.observations].slice(0, 8),
      }));
    }

    const done = nextCount >= total;
    store.updateTask(task.id, (t) => ({
      ...t,
      status: done ? 'completed' : 'running',
      updatedAt: nowIso,
      completedAt: done ? nowIso : undefined,
      currentOperation: done
        ? `Hoàn tất thu thập ${total}/${total} video mẫu KANS 377`
        : `Đang thu thập video ${nextCount}/${total} (${rec.creator})`,
      resultSummary: done
        ? `Đã thu thập và chuẩn hóa ${total} bản ghi video mẫu về KANS 377. Dữ liệu thiếu trường đã được gắn nhãn rõ ràng.`
        : undefined,
      resultRoute: done ? t.resource.route : undefined,
      progress: {
        mode: 'count',
        current: nextCount,
        total,
        unitLabel: 'video',
        stageLabel: done
          ? `Hoàn tất ${total}/${total} video mẫu`
          : `${t.profileId === 'profile-21' ? 'Profile 21' : 'Profile 20'} · Đang thu thập video (${nextCount}/${total})`,
      },
      steps: t.steps.map((st, idx) => {
        if (done) return { ...st, status: 'completed', timestamp: st.timestamp ?? nowIso };
        if (idx === 0) return { ...st, status: 'completed', timestamp: st.timestamp ?? nowIso };
        if (idx === 1) return { ...st, status: 'active', detail: `Đã thu thập ${nextCount}/${total} video mẫu.` };
        return st;
      }),
    }));

    if (nextCount === 1 || nextCount === 5 || done) {
      store.addEvidence({
        taskId: task.id,
        source: `${task.profileId ?? 'profile-20'} · TikTok Demo`,
        observation: `Quan sát hợp lệ bản ghi ${rec.creator} (${rec.missingFields.length ? `thiếu ${rec.missingFields.join(', ')}` : 'đủ chỉ số'}).`,
        validationStatus: rec.missingFields.length ? 'partial' : 'verified',
        missingFields: rec.missingFields,
        recordIdentity: rec.id,
      });
    }

    if (done) {
      const rp = store.researchProjects.find((r) => r.id === task.resource.id);
      if (rp) {
        store.upsertResearchProject({
          ...rp,
          status: 'completed',
          lastActivity: nowIso,
          summary: `Hoàn tất ${total}/${total} bản ghi mẫu cho KANS 377. Nhóm nội dung nhật ký 7–14 ngày và phân tích hoạt chất đạt mức tương tác mẫu cao nhất.`,
        });
      }
      if (task.profileId) {
        store.updateProfile(task.profileId, (p) => ({
          ...p,
          connectionState: 'connected',
          currentTaskId: undefined,
        }));
      }
      if (store.settings.notifyOnCompletion) {
        store.addNotification({
          message: `Hoàn tất thu thập ${total} video KANS 377 (Dữ liệu mẫu).`,
          relatedRoute: task.resource.route,
          relatedLabel: 'Mở bảng nghiên cứu',
          level: 'success',
        });
        toast.success(`Hoàn tất: ${task.title}`);
      }
    }
    return;
  }

  if (task.scenario === 'partial_research') {
    const nextCount = task.progress.current + 1;
    const sample = SAMPLE_TIKTOK_CREATORS[(nextCount + 2) % SAMPLE_TIKTOK_CREATORS.length];
    if (nextCount <= 3) {
      store.addResearchRecord({
        id: generateId('rec'),
        researchId: task.resource.id,
        creator: sample.creator,
        caption: sample.caption,
        hashtags: sample.hashtags,
        views: sample.views,
        likes: sample.likes,
        comments: sample.comments,
        shares: sample.shares,
        sourceUrl: `https://demo.tiktok.local/${sample.creator}/video/7600${nextCount}`,
        observationStatus: 'observed',
        missingFields: [],
        observedAt: nowIso,
        notes: '',
        sampleTag: 'Sample Demo Record',
        thumbnailTone: sample.tone,
      });
      const isLimitHit = nextCount === 3;
      store.updateTask(task.id, (t) => ({
        ...t,
        status: isLimitHit ? 'partial' : 'running',
        updatedAt: nowIso,
        completedAt: isLimitHit ? nowIso : undefined,
        currentOperation: isLimitHit
          ? 'Hoàn tất một phần · Thu thập được 3/5 bản ghi mẫu hợp lệ'
          : `Đang thu thập bản ghi ${nextCount}/5...`,
        partialNote: isLimitHit
          ? 'Nguồn mẫu chỉ trả về 3 bản ghi hợp lệ. Miro giữ trung thực 3 bản ghi này và không tự tạo thêm 2 bản ghi còn thiếu.'
          : undefined,
        resultSummary: isLimitHit ? '3/5 bản ghi mẫu hợp lệ đã được lưu.' : undefined,
        resultRoute: isLimitHit ? t.resource.route : undefined,
        progress: {
          mode: 'count',
          current: nextCount,
          total: 5,
          unitLabel: 'video',
          stageLabel: isLimitHit ? 'Hoàn tất một phần · 3/5 bản ghi' : `Đang thu thập ${nextCount}/5 bản ghi`,
        },
        steps: t.steps.map((st, idx) =>
          isLimitHit
            ? idx < 2
              ? { ...st, status: 'completed', timestamp: nowIso }
              : { ...st, status: 'failed', detail: 'Giới hạn nguồn sau bản ghi #3.' }
            : idx === 0
            ? { ...st, status: 'completed', timestamp: nowIso }
            : idx === 1
            ? { ...st, status: 'active' }
            : st
        ),
      }));
      if (isLimitHit) {
        const rp = store.researchProjects.find((r) => r.id === task.resource.id);
        if (rp) {
          store.upsertResearchProject({
            ...rp,
            status: 'partial',
            lastActivity: nowIso,
            summary: 'Thu thập được 3/5 bản ghi mẫu hợp lệ. Không bịa thêm 2 bản ghi thiếu.',
          });
        }
        if (task.profileId) {
          store.updateProfile(task.profileId, (p) => ({
            ...p,
            connectionState: 'connected',
            currentTaskId: undefined,
          }));
        }
        toast.warning('Tác vụ hoàn tất một phần (3/5 bản ghi hợp lệ)');
      }
    }
    return;
  }

  if (task.scenario === 'publish_approval') {
    const pub = store.publications.find((p) => p.id === task.resource.id);
    if (task.progress.current < 2) {
      const next = task.progress.current + 1;
      const reachingWait = next === 2;
      store.updateTask(task.id, (t) => ({
        ...t,
        status: reachingWait ? 'waiting_for_approval' : 'running',
        updatedAt: nowIso,
        currentOperation: reachingWait
          ? 'Chờ phê duyệt xuất bản trong Trung tâm phê duyệt'
          : 'Đang kiểm tra caption & tư liệu đính kèm...',
        progress: {
          mode: reachingWait ? 'waiting' : 'stage',
          current: next,
          total: 4,
          unitLabel: 'bước',
          stageLabel: reachingWait ? 'Đang chờ phê duyệt xuất bản' : 'Kiểm tra nội dung bản nháp',
        },
        steps: t.steps.map((st, idx) =>
          idx < next ? { ...st, status: 'completed', timestamp: nowIso } : idx === next ? { ...st, status: 'active' } : st
        ),
      }));
      if (reachingWait && task.approvalId && !store.approvals.some((a) => a.id === task.approvalId)) {
        store.addApproval({
          id: task.approvalId,
          taskId: task.id,
          requestedAction: `Phê duyệt xuất bản mô phỏng: ${pub?.title ?? task.title}`,
          targetResourceId: task.resource.id,
          targetResourceLabel: task.resource.label,
          targetRoute: task.resource.route,
          reason: 'Bắt buộc phê duyệt trước khi đăng nội dung lên kênh mạng xã hội.',
          consequences: 'Chuyển bản nháp sang trạng thái Đã xuất bản (Mô phỏng).',
          status: 'pending',
          createdAt: nowIso,
        });
        toast.info('Có yêu cầu phê duyệt xuất bản mới');
      }
      return;
    }

    // Approved -> finish simulated publish
    if (pub) {
      store.updatePublication(pub.id, { status: 'published' });
    }
    store.updateTask(task.id, (t) => ({
      ...t,
      status: 'completed',
      updatedAt: nowIso,
      completedAt: nowIso,
      currentOperation: 'Đã xuất bản thành công (Mô phỏng)',
      resultSummary: 'Nội dung đã được đánh dấu Đã xuất bản trong chế độ mô phỏng. Không gửi tới tài khoản thật.',
      resultRoute: t.resource.route,
      progress: {
        mode: 'stage',
        current: 4,
        total: 4,
        unitLabel: 'bước',
        stageLabel: 'Hoàn tất xuất bản mô phỏng',
      },
      steps: t.steps.map((st) => ({ ...st, status: 'completed', timestamp: st.timestamp ?? nowIso })),
    }));
    toast.success('Đã hoàn tất xuất bản mô phỏng');
    return;
  }

  if (task.scenario === 'recovery_demo') {
    const next = task.progress.current + 1;
    const total = 3;
    const done = next >= total;
    store.updateTask(task.id, (t) => ({
      ...t,
      status: done ? 'completed' : 'running',
      updatedAt: nowIso,
      completedAt: done ? nowIso : undefined,
      currentOperation: done ? 'Đã khôi phục và đồng bộ xong Profile 23' : 'Đang đồng bộ danh sách tab Profile 23...',
      resultSummary: done ? 'Profile 23 đã hoạt động trở lại bình thường (Mô phỏng).' : undefined,
      progress: {
        mode: 'stage',
        current: next,
        total,
        unitLabel: 'bước',
        stageLabel: done ? 'Khôi phục thành công 3/3' : `Đang đồng bộ ${next}/${total}`,
      },
      steps: t.steps.map((st, idx) =>
        idx < next ? { ...st, status: 'completed', timestamp: nowIso } : idx === next ? { ...st, status: 'active' } : st
      ),
    }));
    if (done) {
      store.updateProfile('profile-23', (p) => ({
        ...p,
        connectionState: 'connected',
        currentTaskId: undefined,
      }));
    }
    return;
  }

  if (task.scenario === 'media_analysis') {
    const next = task.progress.current + 1;
    const total = 4;
    const done = next >= total;
    const pct = Math.round((next / total) * 100);
    store.updateMediaAsset(task.resource.id, {
      analysisStatus: done ? 'analyzed' : 'analyzing',
      analysisProgress: pct,
    });
    store.updateTask(task.id, (t) => ({
      ...t,
      status: done ? 'completed' : 'running',
      updatedAt: nowIso,
      completedAt: done ? nowIso : undefined,
      currentOperation: done ? 'Hoàn tất phân tích phân cảnh & transcript mô phỏng' : t.steps[next - 1]?.label ?? 'Đang phân tích...',
      resultSummary: done ? 'Đã tách 4 phân cảnh và đồng bộ transcript mẫu trong Media Studio.' : undefined,
      resultRoute: done ? t.resource.route : undefined,
      progress: {
        mode: 'stage',
        current: next,
        total,
        unitLabel: 'giai đoạn',
        stageLabel: done ? 'Hoàn tất phân tích 4/4' : `Giai đoạn ${next}/${total}`,
      },
      steps: t.steps.map((st, idx) =>
        idx < next ? { ...st, status: 'completed', timestamp: nowIso } : idx === next ? { ...st, status: 'active' } : st
      ),
    }));
    return;
  }

  if (task.scenario === 'workflow_run') {
    const wf = store.workflows.find((w) => w.id === task.resource.id);
    if (!wf) return;
    const next = task.progress.current + 1;
    const total = wf.nodes.length;
    const done = next >= total;
    const activeNode = wf.nodes[Math.min(next, total - 1)];

    store.updateWorkflowGraph(
      wf.id,
      wf.nodes.map((n, idx) => ({
        ...n,
        data: {
          ...n.data,
          status: idx < next ? 'completed' : idx === next && !done ? 'running' : 'idle',
        },
      })),
      wf.edges.map((e, idx) => ({ ...e, animated: !done && idx === next - 1 }))
    );

    store.appendWorkflowLog(wf.id, {
      id: generateId('wl'),
      time: new Date().toTimeString().slice(0, 8),
      node: wf.nodes[next - 1]?.data.label ?? 'Node',
      message: `Hoàn tất node "${wf.nodes[next - 1]?.data.label ?? ''}" (Mô phỏng).`,
      level: 'success',
    });

    store.updateTask(task.id, (t) => ({
      ...t,
      status: done ? 'completed' : 'running',
      updatedAt: nowIso,
      completedAt: done ? nowIso : undefined,
      currentOperation: done ? 'Hoàn tất lượt chạy Workflow mô phỏng' : `Đang chạy node: ${activeNode?.data.label}`,
      resultSummary: done ? `Workflow "${wf.name}" đã chạy xong ${total}/${total} node.` : undefined,
      resultRoute: done ? t.resource.route : undefined,
      progress: {
        mode: 'stage',
        current: next,
        total,
        unitLabel: 'node',
        stageLabel: done ? `Hoàn tất ${total}/${total} node` : `Node ${next}/${total}`,
      },
      steps: t.steps.map((st, idx) =>
        idx < next ? { ...st, status: 'completed', timestamp: nowIso } : idx === next ? { ...st, status: 'active' } : st
      ),
    }));
    return;
  }

  if (task.scenario === 'document_draft') {
    const next = task.progress.current + 1;
    const total = 3;
    const done = next >= total;
    const doc = store.knowledgeDocs.find((d) => d.id === task.resource.id);
    if (doc) {
      const additions = [
        '\n\n## 1. Tổng hợp dữ liệu quan sát\n- Đã đối chiếu 5 bản ghi mẫu Đợt 1 cho KANS 377.\n- Các trường thiếu được đánh dấu rõ "—".',
        '\n\n## 2. Ba nhóm Hook hiệu quả\n- Nhật ký trải nghiệm 7–14 ngày.\n- So sánh bảng thành phần minh bạch.\n- Giải đáp trực tiếp câu hỏi thường gặp.',
        '\n\n## 3. Đề xuất kế hoạch tuần tới\n- Duy trì lịch quét 08:00 mỗi ngày trên Profile 20.\n- Sản xuất 2 video dọc dựa trên Product Review 01 và đưa qua bước Phê duyệt.',
      ];
      store.upsertKnowledgeDoc({
        ...doc,
        content: doc.content + (additions[next - 1] ?? ''),
        updatedAt: nowIso,
      });
    }
    store.updateTask(task.id, (t) => ({
      ...t,
      status: done ? 'completed' : 'running',
      updatedAt: nowIso,
      completedAt: done ? nowIso : undefined,
      currentOperation: done ? 'Đã lưu báo cáo hoàn chỉnh vào Tri thức' : `Đang biên soạn phần ${next}/${total}...`,
      resultSummary: done ? 'Báo cáo tổng hợp đã được lưu vào Tri thức và sẵn sàng gắn ngữ cảnh AI.' : undefined,
      resultRoute: done ? '/knowledge' : undefined,
      progress: {
        mode: 'stage',
        current: next,
        total,
        unitLabel: 'mục',
        stageLabel: done ? 'Hoàn tất 3/3 mục' : `Đang soạn mục ${next}/${total}`,
      },
      steps: t.steps.map((st, idx) =>
        idx < next ? { ...st, status: 'completed', timestamp: nowIso } : idx === next ? { ...st, status: 'active' } : st
      ),
    }));
  }
}

export function startMiroExecutionEngine() {
  if (engineTimer) return;
  engineTimer = setInterval(() => {
    tickOwnershipTransitions();
    const tasks = useMiroStore.getState().tasks;
    for (const task of tasks) {
      if (
        task.status === 'queued' ||
        task.status === 'planning' ||
        task.status === 'running' ||
        task.status === 'recovering' ||
        task.status === 'waiting_for_resource'
      ) {
        tickSingleTask(task);
      }
    }
  }, 1500);
}

export function stopMiroExecutionEngine() {
  if (engineTimer) {
    clearInterval(engineTimer);
    engineTimer = null;
  }
}
