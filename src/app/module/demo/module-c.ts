import { Compute } from '../compute/compute';
import { Module } from '../module';

export function createModuleC(compute: Compute): Module {
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
