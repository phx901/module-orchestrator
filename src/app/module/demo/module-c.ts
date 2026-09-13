import { Compute } from '../compute/compute';
import { ModuleDefinition } from '../module-definition';

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
