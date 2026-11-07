import { Result } from '../module/result';

export type ModuleStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Blocked';

export interface ModuleState {
  status: ModuleStatus;
  result?: Result;
  startedAt?: number;
  finishedAt?: number;
}
