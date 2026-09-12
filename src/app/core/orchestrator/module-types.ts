import { Observable } from 'rxjs';
import { Result } from './result';

export type ModuleId = string;

export type ModuleStatus = 'Pending' | 'Ready' | 'Running' | 'Completed' | 'Failed' | 'Blocked';

export interface ModuleState {
  status: ModuleStatus;
  result?: Result;
  startedAt?: number;
  finishedAt?: number;
}

export interface ModuleDefinition {
  id: ModuleId;
  dependsOn: ModuleId[];
  execute(inputs: Partial<Record<ModuleId, Result>>): Observable<Result>;
}
