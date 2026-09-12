import { Compute } from '../core/compute/compute';
import { ModuleDefinition } from '../core/orchestrator/module-types';

export function createModuleC(compute: Compute): ModuleDefinition {
  return {
    id: 'C',
    dependsOn: ['A'],
    execute: (inputs) =>
      compute.run({
        durationMs: 1000,
        result: { status: 'ok', value: `C-data(${inputs['A']?.value})` },
      }),
  };
}
