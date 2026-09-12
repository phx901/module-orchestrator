import { Compute } from '../core/compute/compute';
import { ModuleDefinition } from '../core/orchestrator/module-types';

export function createModuleB(compute: Compute): ModuleDefinition {
  return {
    id: 'B',
    dependsOn: ['A'],
    execute: (inputs) =>
      compute.run({
        durationMs: 2000,
        result: { status: 'ok', value: `B-data(${inputs['A']?.value})` },
      }),
  };
}
