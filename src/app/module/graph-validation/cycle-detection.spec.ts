import { of } from 'rxjs';
import { detectCycles } from './cycle-detection';
import { Module, ModuleId } from '../module';
import { Result } from '../result';

function createModule(id: ModuleId, dependsOn: ModuleId[] = []): Module {
  return {
    id,
    dependsOn,
    execute: () => of<Result>({ status: 'ok' }),
  };
}

describe('detectCycles', () => {
  describe('returns no cycles', () => {
    it('for an empty graph', () => {
      expect(detectCycles([])).toEqual([]);
    });

    it('for a single module without dependencies', () => {
      expect(detectCycles([createModule('A')])).toEqual([]);
    });

    it('for independent modules', () => {
      const modules = [createModule('A'), createModule('B'), createModule('C')];
      expect(detectCycles(modules)).toEqual([]);
    });

    it('for a linear dependency chain', () => {
      const modules = [
        createModule('A'),
        createModule('B', ['A']),
        createModule('C', ['B']),
      ];
      expect(detectCycles(modules)).toEqual([]);
    });

    it('for a diamond-shaped graph', () => {
      const modules = [
        createModule('A'),
        createModule('B', ['A']),
        createModule('C', ['A']),
        createModule('D', ['B', 'C']),
      ];
      expect(detectCycles(modules)).toEqual([]);
    });
  });

  describe('finds cycles', () => {
    it('for a two-module cycle', () => {
      const modules = [createModule('A', ['B']), createModule('B', ['A'])];
      expect(detectCycles(modules)).toEqual([['A', 'B', 'A']]);
    });

    it('for a self-referencing module', () => {
      const modules = [createModule('A', ['A'])];
      expect(detectCycles(modules)).toEqual([['A', 'A']]);
    });

    it('for a longer cycle', () => {
      const modules = [
        createModule('A', ['B']),
        createModule('B', ['C']),
        createModule('C', ['A']),
      ];
      expect(detectCycles(modules)).toEqual([['A', 'B', 'C', 'A']]);
    });

    it('for a cycle that starts in the middle of the graph', () => {
      const modules = [
        createModule('A', ['B']),
        createModule('B', ['C']),
        createModule('C', ['B']),
      ];
      expect(detectCycles(modules)).toEqual([['B', 'C', 'B']]);
    });

    it('for multiple independent cycles', () => {
      const modules = [
        createModule('A', ['B']),
        createModule('B', ['A']),
        createModule('C', ['D']),
        createModule('D', ['C']),
      ];
      expect(detectCycles(modules)).toEqual([
        ['A', 'B', 'A'],
        ['C', 'D', 'C'],
      ]);
    });
  });
});
