import { Compute } from '../core/compute/compute';
import { ModuleDefinition } from '../core/orchestrator/module-types';

export function createModuleA(compute: Compute): ModuleDefinition {
  return {
    id: 'A',
    dependsOn: [],
    execute: () => compute.run({ durationMs: 1000, result: { status: 'ok', value: 'A-data' } }),
  };
}
