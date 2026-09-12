import { Compute } from '../core/compute/compute';
import { ModuleDefinition } from '../core/orchestrator/module-types';

export function createModuleD(compute: Compute): ModuleDefinition {
  return {
    id: 'D',
    dependsOn: ['C'],
    execute: (inputs) =>
      compute.run({
        durationMs: 1000,
        result: { status: 'ok', value: `D-data(${inputs['C']?.value})` },
      }),
  };
}
