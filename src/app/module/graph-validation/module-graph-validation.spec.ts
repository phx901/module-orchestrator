import { of } from 'rxjs';
import { validateModuleGraph } from './module-graph-validation';
import { Module, ModuleId } from '../module';
import { Result } from '../result';

describe('validateModuleGraph', () => {
  describe('passes', () => {
    it('for a valid graph', () => {
      expect(validateModuleGraph(exampleGraph)).toEqual([]);
    });
  });

  describe('fails', () => {
    it('with a message for each unknown dependency', () => {
      const modules = [createModule('A', ['Missing'])];
      expect(validateModuleGraph(modules)).toEqual([
        'Module "A" depends on unknown module "Missing".',
      ]);
    });

    it('with a message for each cycle', () => {
      const modules = [createModule('A', ['B']), createModule('B', ['A'])];
      expect(validateModuleGraph(modules)).toEqual(['Cycle detected: A -> B -> A.']);
    });

    it('with dependency and cycle errors together', () => {
      const modules = [
        createModule('A', ['Missing']),
        createModule('B', ['C']),
        createModule('C', ['B']),
      ];
      expect(validateModuleGraph(modules)).toEqual([
        'Module "A" depends on unknown module "Missing".',
        'Cycle detected: B -> C -> B.',
      ]);
    });
  });
});

const exampleGraph: Module[] = [
  createModule('A', []),
  createModule('B', ['A']),
  createModule('C', ['A']),
  createModule('D', ['C']),
  createModule('E', ['B', 'D']),
];

function createModule(id: ModuleId, dependsOn: ModuleId[]): Module {
  return {
    id,
    dependsOn,
    execute: () => of<Result>({ status: 'ok' }),
  };
}
