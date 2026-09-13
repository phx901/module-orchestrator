import { Compute } from '../compute/compute';
import { ModuleDefinition } from '../module-definition';

export function createModuleC(compute: Compute): ModuleDefinition {
  let attempts = 0;
  return {
    id: 'C',
    dependsOn: ['A'],
    execute: (inputs) => {
      attempts += 1;
      return compute.run({
        durationMs: 1000,
        failWith: attempts % 2 === 1 ? 'C schlägt fehl (Demo)' : undefined,
        result: { status: 'ok', value: `C-data(${inputs['A']?.value})` },
      });
    },
  };
}
