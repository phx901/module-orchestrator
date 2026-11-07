import { indexModulesById } from './module-utils';
import { Module } from './module';

describe('indexModulesById', () => {
  it('indexes modules by their id', () => {
    const modules: Module[] = [
      { id: 'a', dependsOn: [], execute: () => undefined as never },
      { id: 'b', dependsOn: ['a'], execute: () => undefined as never },
    ];

    const index = indexModulesById(modules);

    expect(index.get('a')?.id).toBe('a');
    expect(index.get('b')?.id).toBe('b');
  });

  it('returns an empty map for an empty list', () => {
    expect(indexModulesById([]).size).toBe(0);
  });
});
