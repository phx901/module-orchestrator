import { Compute } from '../compute/compute';
import { ModuleDefinition } from '../module-definition';

export function createModuleD(compute: Compute): ModuleDefinition {
  return {
    id: 'D',
    dependsOn: ['B'],
    execute: (inputs) =>
      compute.run({
        durationMs: 1000,
        result: { status: 'ok', value: `D-data(${inputs['B']?.value})` },
      }),
  };
}
