export type ThemeMode = 'midnight-lime' | 'navy-cream' | 'light' | 'system';
export type Language = 'vi' | 'en';
export type DensityMode = 'comfortable' | 'compact';

export type TaskStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'waiting_for_approval'
  | 'waiting_for_resource'
  | 'pausing'
  | 'paused'
  | 'recovering'
  | 'cancelling'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled';

export type OwnershipState =
  | 'ai_controlled'
  | 'takeover_requested'
  | 'transferring_control'
  | 'human_controlled'
  | 'returning_control'
  | 'ai_resuming';

export type TaskTrigger = 'chat' | 'manual' | 'schedule' | 'workflow' | 'event';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ResourceKind =
  | 'browser'
  | 'schedule'
  | 'research'
  | 'media'
  | 'workflow'
  | 'publishing'
  | 'document';

export type TaskScenarioKind =
  | 'schedule_create'
  | 'tiktok_research'
  | 'publish_approval'
  | 'partial_research'
  | 'recovery_demo'
  | 'media_analysis'
  | 'workflow_run'
  | 'document_draft';

export type ProgressMode = 'count' | 'stage' | 'indeterminate' | 'waiting';

export interface TaskProgress {
  mode: ProgressMode;
  current: number;
  total: number | null;
  unitLabel: string;
  stageLabel: string;
}

export interface TaskStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  detail?: string;
  timestamp?: string;
}

export interface ResourceRef {
  kind: ResourceKind;
  id: string;
  label: string;
  route: string;
  exclusiveKey?: string;
}

export interface EvidenceRecord {
  id: string;
  taskId: string;
  source: string;
  observation: string;
  validationStatus: 'verified' | 'partial' | 'missing' | 'warning';
  missingFields: string[];
  recordIdentity: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  instruction: string;
  scenario: TaskScenarioKind;
  status: TaskStatus;
  priority: TaskPriority;
  progress: TaskProgress;
  resource: ResourceRef;
  profileId?: string;
  trigger: TaskTrigger;
  conversationId?: string;
  projectId?: string;
  steps: TaskStep[];
  currentOperation: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  resultRoute?: string;
  errorMessage?: string;
  partialNote?: string;
  approvalId?: string;
}

export interface ResourceOwnership {
  resourceId: string;
  resourceKind: ResourceKind;
  state: OwnershipState;
  taskId?: string;
  updatedAt: string;
  lastHumanEditSummary?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  active: boolean;
  highlightElement?: string;
  pageSummary: string;
}

export type BrowserConnectionState =
  | 'connected'
  | 'disconnected'
  | 'busy'
  | 'unverified'
  | 'reconnecting';

export type IdentityVerificationState = 'verified' | 'unverified' | 'expired';

export interface BrowserProfile {
  id: string;
  name: string;
  alias: string;
  connectionState: BrowserConnectionState;
  identityVerification: IdentityVerificationState;
  tabs: BrowserTab[];
  currentTaskId?: string;
  permissions: string[];
  lastActivity: string;
  observations: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  status: 'active' | 'paused' | 'archived';
  lastActivity: string;
  accentTag: string;
}

export interface ScheduleRunHistory {
  id: string;
  runAt: string;
  status: 'completed' | 'partial' | 'failed';
  summary: string;
}

export interface Schedule {
  id: string;
  name: string;
  instruction: string;
  enabled: boolean;
  triggerType: 'recurring' | 'once' | 'event';
  time: string;
  date: string;
  recurrence: 'daily' | 'weekdays' | 'weekly' | 'hourly' | 'once';
  timezone: string;
  targetResourceId: string;
  targetResourceLabel: string;
  maxRunsPerDay: number;
  missedRunPolicy: 'skip' | 'run_immediately' | 'queue_next';
  approvalPolicy: 'auto' | 'require_approval';
  nextRun: string;
  lastRun?: string;
  status: 'active' | 'draft' | 'paused' | 'configuring';
  configuringField?: string | null;
  projectId?: string;
  taskId?: string;
  history: ScheduleRunHistory[];
}

export interface WorkflowNodeData {
  label: string;
  category:
    | 'trigger'
    | 'browser'
    | 'ai'
    | 'media'
    | 'condition'
    | 'data'
    | 'approval'
    | 'publishing';
  status: 'idle' | 'running' | 'completed' | 'waiting' | 'error';
  description: string;
  config: Record<string, string>;
  validationError?: string;
}

export interface WorkflowNodeItem {
  id: string;
  type: 'miroNode';
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdgeItem {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  projectId?: string;
  lastRun?: string;
  lastStatus?: 'completed' | 'running' | 'failed' | 'waiting';
  nodes: WorkflowNodeItem[];
  edges: WorkflowEdgeItem[];
  executionLog: { id: string; time: string; node: string; message: string; level: 'info' | 'success' | 'warning' | 'error' }[];
}

export interface ResearchRecord {
  id: string;
  researchId: string;
  creator: string;
  caption: string;
  hashtags: string[];
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  sourceUrl: string;
  observationStatus: 'observed' | 'partial' | 'missing_metrics';
  missingFields: string[];
  observedAt: string;
  notes: string;
  sampleTag: string;
  thumbnailTone: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  query: string;
  platform: 'TikTok' | 'YouTube' | 'Instagram' | 'Web';
  researchType: string;
  status: 'completed' | 'running' | 'partial' | 'draft';
  targetCount: number;
  projectId?: string;
  lastActivity: string;
  summary: string;
  notes: string;
  sources: { id: string; label: string; url: string; capturedAt: string }[];
}

export interface MediaScene {
  id: string;
  startSec: number;
  endSec: number;
  label: string;
  description: string;
  transcript: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  collection: string;
  durationSec: number;
  resolution: string;
  sizeLabel: string;
  projectId?: string;
  analysisStatus: 'analyzed' | 'analyzing' | 'pending';
  analysisProgress: number;
  createdAt: string;
  notes: string;
  scenes: MediaScene[];
  accentTone: string;
}

export type PublishingPlatform = 'TikTok' | 'Facebook' | 'Instagram' | 'YouTube' | 'Threads';

export interface Publication {
  id: string;
  title: string;
  platform: PublishingPlatform;
  account: string;
  mediaAssetId?: string;
  mediaLabel: string;
  caption: string;
  hashtags: string[];
  scheduledFor: string;
  status: 'draft' | 'queued' | 'waiting_approval' | 'approved' | 'published' | 'rejected';
  projectId?: string;
  taskId?: string;
  approvalId?: string;
  validationIssues: string[];
}

export type KnowledgeSourceKind =
  | 'user_instruction'
  | 'project_knowledge'
  | 'external_retrieved'
  | 'ai_generated';

export interface KnowledgeDocument {
  id: string;
  title: string;
  collection: string;
  sourceKind: KnowledgeSourceKind;
  content: string;
  tags: string[];
  projectId?: string;
  includedInAiContext: boolean;
  updatedAt: string;
  sourceUrl?: string;
}

export type ActivityEventType =
  | 'task_lifecycle'
  | 'tool_execution'
  | 'schedule_execution'
  | 'resource_update'
  | 'connection'
  | 'approval'
  | 'recovery'
  | 'error';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  taskId?: string;
  resourceId?: string;
  resourceLabel?: string;
  summary: string;
  technicalMeta: Record<string, string | number | boolean>;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  requestedAction: string;
  targetResourceId: string;
  targetResourceLabel: string;
  targetRoute: string;
  reason: string;
  consequences: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface InterventionItem {
  id: string;
  taskId: string;
  problem: string;
  affectedResourceId: string;
  affectedResourceLabel: string;
  recommendedAction: string;
  workspaceRoute: string;
  resolved: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  relatedRoute?: string;
  relatedLabel?: string;
  read: boolean;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  taskId?: string;
  approvalId?: string;
  resourceLinks?: { label: string; route: string }[];
  structuredSummary?: {
    title: string;
    items: { label: string; value: string }[];
  };
  attachments?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: 'ai_models' | 'browser_runtime' | 'data' | 'automation' | 'connectivity';
  description: string;
  status: 'simulated_connected' | 'not_configured' | 'unavailable' | 'coming_soon';
  note: string;
}

export interface UserSettings {
  theme: ThemeMode;
  language: Language;
  density: DensityMode;
  sidebarCollapsed: boolean;
  timezone: string;
  defaultProfileId: string;
  defaultWorkspace: string;
  defaultModel: string;
  autoOpenLiveWorkspace: boolean;
  notifyOnCompletion: boolean;
  notifyOnApproval: boolean;
  requireApprovalForPublishing: boolean;
  allowBackgroundExecution: boolean;
}
