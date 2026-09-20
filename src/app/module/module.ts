import { Observable } from 'rxjs';
import { Result } from './result';

export type ModuleId = string;

export interface Module {
  id: ModuleId;
  dependsOn: ModuleId[];
  execute(inputs: Partial<Record<ModuleId, Result>>): Observable<Result>;
}
