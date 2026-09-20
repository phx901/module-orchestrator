import { of } from 'rxjs';
import { findUnknownDependencies } from './dependency-detection';
import { Module, ModuleId } from '../module';
import { Result } from '../result';

function createModule(id: ModuleId, dependsOn: ModuleId[] = []): Module {
  return {
    id,
    dependsOn,
    execute: () => of<Result>({ status: 'ok' }),
  };
}

describe('findUnknownDependencies', () => {
  describe('returns no unknown dependencies', () => {
    it('for an empty graph', () => {
      expect(findUnknownDependencies([])).toEqual([]);
    });

    it('for a single module without dependencies', () => {
      expect(findUnknownDependencies([createModule('A')])).toEqual([]);
    });

    it('for independent modules', () => {
      const modules = [createModule('A'), createModule('B'), createModule('C')];
      expect(findUnknownDependencies(modules)).toEqual([]);
    });

    it('for a linear dependency chain', () => {
      const modules = [
        createModule('A'),
        createModule('B', ['A']),
        createModule('C', ['B']),
      ];
      expect(findUnknownDependencies(modules)).toEqual([]);
    });

    it('for a diamond-shaped graph', () => {
      const modules = [
        createModule('A'),
        createModule('B', ['A']),
        createModule('C', ['A']),
        createModule('D', ['B', 'C']),
      ];
      expect(findUnknownDependencies(modules)).toEqual([]);
    });
  });

  describe('finds unknown dependencies', () => {
    it('for a single unknown dependency', () => {
      const modules = [createModule('A', ['Missing'])];
      expect(findUnknownDependencies(modules)).toEqual([
        { moduleId: 'A', dependencyId: 'Missing' },
      ]);
    });

    it('for multiple unknown dependencies of one module', () => {
      const modules = [createModule('A', ['Missing1', 'Missing2'])];
      expect(findUnknownDependencies(modules)).toEqual([
        { moduleId: 'A', dependencyId: 'Missing1' },
        { moduleId: 'A', dependencyId: 'Missing2' },
      ]);
    });

    it('for unknown dependencies of multiple modules', () => {
      const modules = [createModule('A', ['MissingA']), createModule('B', ['MissingB'])];
      expect(findUnknownDependencies(modules)).toEqual([
        { moduleId: 'A', dependencyId: 'MissingA' },
        { moduleId: 'B', dependencyId: 'MissingB' },
      ]);
    });

    it('only for unknown dependencies, not known ones', () => {
      const modules = [createModule('A'), createModule('B', ['A', 'Missing'])];
      expect(findUnknownDependencies(modules)).toEqual([
        { moduleId: 'B', dependencyId: 'Missing' },
      ]);
    });
  });
});
