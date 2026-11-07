import { ModuleState, ModuleStatus } from './module-state';

export function countStatesWithStatus(states: ModuleState[], status: ModuleStatus): number {
  const matchingStates = states.filter((state) => state.status === status);
  return matchingStates.length;
}

export function hasStateWithStatus(states: ModuleState[], status: ModuleStatus): boolean {
  return states.some((state) => state.status === status);
}
