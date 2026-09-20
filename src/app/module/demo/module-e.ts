import { Compute } from '../compute/compute';
import { Module } from '../module';

export function createModuleE(compute: Compute): Module {
  return {
    id: 'E',
    dependsOn: ['D', 'C'],
    execute: (inputs) =>
      compute.run({
        durationMs: 1000,
        result: { status: 'ok', value: `E-data(${inputs['D']?.value},${inputs['C']?.value})` },
      }),
  };
}
