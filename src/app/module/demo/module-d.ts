import { Compute } from '../compute/compute';
import { Module } from '../module';

export function createModuleD(compute: Compute): Module {
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
