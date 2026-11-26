import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAiWriteResource,
  computeProgressPercent,
  getNextOwnershipState,
  hasExclusiveResourceConflict,
  transitionTaskStatus,
} from './taskMachine';

test('computeProgressPercent returns null for indeterminate and waiting progress', () => {
  assert.equal(
    computeProgressPercent({
      mode: 'indeterminate',
      current: 0,
      total: null,
      unitLabel: 'sources',
      stageLabel: 'Searching',
    }),
    null
  );
  assert.equal(
    computeProgressPercent({
      mode: 'waiting',
      current: 1,
      total: 2,
      unitLabel: 'steps',
      stageLabel: 'Waiting for approval',
    }),
    null
  );
});

test('computeProgressPercent clamps count and stage progress between 0 and 100', () => {
  assert.equal(
    computeProgressPercent({
      mode: 'count',
      current: 4,
      total: 10,
      unitLabel: 'videos',
      stageLabel: 'Collecting',
    }),
    40
  );
  assert.equal(
    computeProgressPercent({
      mode: 'stage',
      current: 3,
      total: 5,
      unitLabel: 'stages',
      stageLabel: 'Configuring',
    }),
    60
  );
  assert.equal(
    computeProgressPercent({
      mode: 'count',
      current: 12,
      total: 10,
      unitLabel: 'videos',
      stageLabel: 'Done',
    }),
    100
  );
});

test('Human Takeover 6-state ownership machine prevents concurrent AI writes', () => {
  let state = getNextOwnershipState('ai_controlled', 'request_takeover');
  assert.equal(state, 'takeover_requested');
  assert.equal(canAiWriteResource(state), false);

  state = getNextOwnershipState(state, 'advance_transfer');
  assert.equal(state, 'transferring_control');
  assert.equal(canAiWriteResource(state), false);

  state = getNextOwnershipState(state, 'advance_transfer');
  assert.equal(state, 'human_controlled');
  assert.equal(canAiWriteResource(state), false);

  state = getNextOwnershipState(state, 'return_control');
  assert.equal(state, 'returning_control');
  assert.equal(canAiWriteResource(state), false);

  state = getNextOwnershipState(state, 'advance_return');
  assert.equal(state, 'ai_resuming');
  assert.equal(canAiWriteResource(state), false);

  state = getNextOwnershipState(state, 'advance_return');
  assert.equal(state, 'ai_controlled');
  assert.equal(canAiWriteResource(state), true);
});

test('Exclusive resource conflict blocks same profile but allows distinct profiles', () => {
  const existing = [
    {
      id: 'task-1',
      status: 'running' as const,
      resource: {
        kind: 'browser' as const,
        id: 'profile-20',
        label: 'Profile 20',
        route: '/browser/profile-20',
        exclusiveKey: 'browser:profile-20',
      },
    },
  ];

  assert.equal(
    hasExclusiveResourceConflict(
      {
        id: 'task-2',
        resource: {
          kind: 'browser',
          id: 'profile-20',
          label: 'Profile 20',
          route: '/browser/profile-20',
          exclusiveKey: 'browser:profile-20',
        },
      },
      existing
    ),
    true
  );

  assert.equal(
    hasExclusiveResourceConflict(
      {
        id: 'task-3',
        resource: {
          kind: 'browser',
          id: 'profile-21',
          label: 'Profile 21',
          route: '/browser/profile-21',
          exclusiveKey: 'browser:profile-21',
        },
      },
      existing
    ),
    false
  );
});

test('Task status transitions enforce terminal immutability and retry rules', () => {
  assert.equal(transitionTaskStatus('running', 'pause'), 'paused');
  assert.equal(transitionTaskStatus('paused', 'resume'), 'running');
  assert.equal(transitionTaskStatus('waiting_for_approval', 'approve'), 'running');
  assert.equal(transitionTaskStatus('waiting_for_approval', 'reject'), 'cancelled');
  assert.equal(transitionTaskStatus('completed', 'cancel'), 'completed');
  assert.equal(transitionTaskStatus('failed', 'retry'), 'queued');
  assert.equal(transitionTaskStatus('partial', 'retry'), 'queued');
});
