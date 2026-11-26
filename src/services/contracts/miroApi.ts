import type {
  ApprovalRequest,
  BrowserProfile,
  KnowledgeDocument,
  MediaAsset,
  Publication,
  ResearchProject,
  Schedule,
  Task,
  Workflow,
} from '../../domain/types';

/**
 * Contract interfaces for integrating Miro's frontend with a future real backend runtime.
 * The current prototype fulfills these operations locally via Zustand + executionEngine.ts.
 */
export interface MiroTaskServiceContract {
  listTasks(): Promise<Task[]>;
  pauseTask(taskId: string): Promise<void>;
  resumeTask(taskId: string): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  retryTask(taskId: string): Promise<void>;
  stopAllAutomatedTasks(): Promise<void>;
}

export interface MiroResourceServiceContract {
  listProfiles(): Promise<BrowserProfile[]>;
  listSchedules(): Promise<Schedule[]>;
  listWorkflows(): Promise<Workflow[]>;
  listResearchProjects(): Promise<ResearchProject[]>;
  listMediaAssets(): Promise<MediaAsset[]>;
  listPublications(): Promise<Publication[]>;
  listKnowledgeDocs(): Promise<KnowledgeDocument[]>;
  resolveApproval(approvalId: string, decision: 'approved' | 'rejected'): Promise<ApprovalRequest>;
}
