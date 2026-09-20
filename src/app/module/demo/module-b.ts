import { Compute } from '../compute/compute';
import { Module } from '../module';

export function createModuleB(compute: Compute): Module {
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
