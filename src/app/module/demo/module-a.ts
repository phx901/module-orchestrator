import { Compute } from '../compute/compute';
import { Module } from '../module';

export function createModuleA(compute: Compute): Module {
  return {
    id: 'A',
    dependsOn: [],
    execute: () => compute.run({ durationMs: 1000, result: { status: 'ok', value: 'A-data' } }),
  };
}
