import { Compute } from '../compute/compute';
import { ModuleDefinition } from '../module-definition';

export function createModuleA(compute: Compute): ModuleDefinition {
  return {
    id: 'A',
    dependsOn: [],
    execute: () => compute.run({ durationMs: 1000, result: { status: 'ok', value: 'A-data' } }),
  };
}
