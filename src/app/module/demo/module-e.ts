import { Compute } from '../compute/compute';
import { ModuleDefinition } from '../module-definition';

export function createModuleE(compute: Compute): ModuleDefinition {
  return {
    id: 'E',
    dependsOn: ['B', 'D'],
    execute: (inputs) =>
      compute.run({
        durationMs: 1000,
        result: { status: 'ok', value: `E-data(${inputs['B']?.value},${inputs['D']?.value})` },
      }),
  };
}
