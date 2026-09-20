import { countStatesWithStatus, hasStateWithStatus } from './module-state-utils';
import { ModuleState } from './module-state';

describe('countStatesWithStatus', () => {
  it('counts states with the given status', () => {
    const states: ModuleState[] = [
      { status: 'Completed' },
      { status: 'Running' },
      { status: 'Completed' },
      { status: 'Pending' },
    ];
    expect(countStatesWithStatus(states, 'Completed')).toBe(2);
    expect(countStatesWithStatus(states, 'Running')).toBe(1);
    expect(countStatesWithStatus(states, 'Pending')).toBe(1);
  });

  it('returns zero when no state matches the status', () => {
    const states: ModuleState[] = [{ status: 'Failed' }, { status: 'Blocked' }];
    expect(countStatesWithStatus(states, 'Completed')).toBe(0);
  });

  it('returns zero for an empty list', () => {
    expect(countStatesWithStatus([], 'Running')).toBe(0);
  });
});

describe('hasStateWithStatus', () => {
  it('returns true when at least one state matches the status', () => {
    const states: ModuleState[] = [
      { status: 'Completed' },
      { status: 'Failed' },
      { status: 'Pending' },
    ];
    expect(hasStateWithStatus(states, 'Failed')).toBe(true);
  });

  it('returns false when no state matches the status', () => {
    const states: ModuleState[] = [{ status: 'Completed' }, { status: 'Running' }];
    expect(hasStateWithStatus(states, 'Failed')).toBe(false);
  });

  it('returns false for an empty list', () => {
    expect(hasStateWithStatus([], 'Failed')).toBe(false);
  });
});
