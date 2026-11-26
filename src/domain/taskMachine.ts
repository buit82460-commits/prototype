import type { OwnershipState, Task, TaskProgress, TaskStatus } from './types';

export const ACTIVE_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'queued',
  'planning',
  'running',
  'recovering',
  'pausing',
  'cancelling',
]);

export const WAITING_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'waiting_for_approval',
  'waiting_for_resource',
]);

export const TERMINAL_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'completed',
  'partial',
  'failed',
  'cancelled',
]);

export function isTaskActive(status: TaskStatus): boolean {
  return ACTIVE_TASK_STATUSES.has(status);
}

export function isTaskWaiting(status: TaskStatus): boolean {
  return WAITING_TASK_STATUSES.has(status);
}

export function isTaskTerminal(status: TaskStatus): boolean {
  return TERMINAL_TASK_STATUSES.has(status);
}

export function canPauseTask(status: TaskStatus): boolean {
  return status === 'running' || status === 'planning' || status === 'queued' || status === 'waiting_for_resource';
}

export function canResumeTask(status: TaskStatus): boolean {
  return status === 'paused' || status === 'pausing';
}

export function canCancelTask(status: TaskStatus): boolean {
  return !TERMINAL_TASK_STATUSES.has(status);
}

export function canRetryTask(status: TaskStatus): boolean {
  return status === 'failed' || status === 'cancelled' || status === 'partial';
}

export function computeProgressPercent(progress: TaskProgress): number | null {
  if (progress.mode === 'indeterminate' || progress.mode === 'waiting') {
    return null;
  }
  if (!progress.total || progress.total <= 0) {
    return null;
  }
  const pct = Math.round((progress.current / progress.total) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function canAiWriteResource(ownershipState: OwnershipState | undefined): boolean {
  if (!ownershipState) return true;
  return ownershipState === 'ai_controlled';
}

export function getNextOwnershipState(
  current: OwnershipState,
  action: 'request_takeover' | 'advance_transfer' | 'return_control' | 'advance_return'
): OwnershipState {
  switch (action) {
    case 'request_takeover':
      if (current === 'ai_controlled' || current === 'ai_resuming') return 'takeover_requested';
      return current;
    case 'advance_transfer':
      if (current === 'takeover_requested') return 'transferring_control';
      if (current === 'transferring_control') return 'human_controlled';
      return current;
    case 'return_control':
      if (current === 'human_controlled') return 'returning_control';
      return current;
    case 'advance_return':
      if (current === 'returning_control') return 'ai_resuming';
      if (current === 'ai_resuming') return 'ai_controlled';
      return current;
    default:
      return current;
  }
}

export function hasExclusiveResourceConflict(
  candidate: Pick<Task, 'id' | 'resource'>,
  allTasks: ReadonlyArray<Pick<Task, 'id' | 'status' | 'resource'>>
): boolean {
  const key = candidate.resource.exclusiveKey;
  if (!key) return false;
  return allTasks.some(
    (other) =>
      other.id !== candidate.id &&
      other.resource.exclusiveKey === key &&
      (other.status === 'running' || other.status === 'planning' || other.status === 'recovering')
  );
}

export function transitionTaskStatus(
  current: TaskStatus,
  action: 'start' | 'pause' | 'resume' | 'cancel' | 'retry' | 'approve' | 'reject' | 'fail' | 'complete' | 'partial'
): TaskStatus {
  switch (action) {
    case 'start':
      return current === 'queued' || current === 'waiting_for_resource' ? 'planning' : current;
    case 'pause':
      return canPauseTask(current) ? 'paused' : current;
    case 'resume':
      return canResumeTask(current) ? 'running' : current;
    case 'cancel':
      return canCancelTask(current) ? 'cancelled' : current;
    case 'retry':
      return canRetryTask(current) ? 'queued' : current;
    case 'approve':
      return current === 'waiting_for_approval' ? 'running' : current;
    case 'reject':
      return current === 'waiting_for_approval' ? 'cancelled' : current;
    case 'fail':
      return isTaskTerminal(current) ? current : 'failed';
    case 'complete':
      return isTaskTerminal(current) ? current : 'completed';
    case 'partial':
      return isTaskTerminal(current) ? current : 'partial';
    default:
      return current;
  }
}
