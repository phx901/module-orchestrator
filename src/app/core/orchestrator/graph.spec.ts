import { of } from 'rxjs';
import { detectCycle, getDependents, getReadyModules, validateGraph } from './graph';
import { ModuleDefinition, ModuleId, ModuleState } from './module-types';
import { Result } from './result';

function makeDef(id: ModuleId, dependsOn: ModuleId[] = []): ModuleDefinition {
  return {
    id,
    dependsOn,
    execute: () => of<Result>({ status: 'ok' }),
  };
}

function makeStates(entries: Record<ModuleId, ModuleState['status']>): Map<ModuleId, ModuleState> {
  return new Map(Object.entries(entries).map(([id, status]) => [id, { status }]));
}

const exampleGraph: ModuleDefinition[] = [
  makeDef('A'),
  makeDef('B', ['A']),
  makeDef('C', ['A']),
  makeDef('D', ['C']),
  makeDef('E', ['B', 'D']),
];

describe('detectCycle', () => {
  it('returns null for the acyclic example graph', () => {
    expect(detectCycle(exampleGraph)).toBeNull();
  });

  it('detects a direct cycle', () => {
    const defs = [makeDef('A', ['B']), makeDef('B', ['A'])];
    expect(detectCycle(defs)).toEqual(['A', 'B', 'A']);
  });

  it('detects an indirect cycle', () => {
    const defs = [makeDef('A', ['B']), makeDef('B', ['C']), makeDef('C', ['A'])];
    expect(detectCycle(defs)).toEqual(['A', 'B', 'C', 'A']);
  });
});

describe('validateGraph', () => {
  it('returns no errors for the valid example graph', () => {
    expect(validateGraph(exampleGraph)).toEqual([]);
  });

  it('reports a missing dependency', () => {
    const defs = [makeDef('A', ['Missing'])];
    expect(validateGraph(defs)).toEqual([
      'Module "A" depends on unknown module "Missing".',
    ]);
  });

  it('reports a cycle', () => {
    const defs = [makeDef('A', ['B']), makeDef('B', ['A'])];
    expect(validateGraph(defs)).toEqual(['Cycle detected: A -> B -> A.']);
  });
});

describe('getReadyModules', () => {
  it('returns the root module when nothing has run yet', () => {
    const states = makeStates({ A: 'Pending', B: 'Pending', C: 'Pending', D: 'Pending', E: 'Pending' });
    expect(getReadyModules(exampleGraph, states)).toEqual(['A']);
  });

  it('returns B and C in parallel once A is completed', () => {
    const states = makeStates({ A: 'Completed', B: 'Pending', C: 'Pending', D: 'Pending', E: 'Pending' });
    expect(getReadyModules(exampleGraph, states)).toEqual(['B', 'C']);
  });

  it('does not return E until both B and D are completed', () => {
    const states = makeStates({ A: 'Completed', B: 'Completed', C: 'Completed', D: 'Pending', E: 'Pending' });
    expect(getReadyModules(exampleGraph, states)).toEqual(['D']);
  });

  it('returns E once B and D are both completed', () => {
    const states = makeStates({ A: 'Completed', B: 'Completed', C: 'Completed', D: 'Completed', E: 'Pending' });
    expect(getReadyModules(exampleGraph, states)).toEqual(['E']);
  });

  it('ignores modules that are already running or completed', () => {
    const states = makeStates({ A: 'Completed', B: 'Running', C: 'Completed', D: 'Pending', E: 'Pending' });
    expect(getReadyModules(exampleGraph, states)).toEqual(['D']);
  });
});

describe('getDependents', () => {
  it('returns all transitive dependents of the root module', () => {
    expect(getDependents('A', exampleGraph)).toEqual(
      expect.arrayContaining(['B', 'C', 'D', 'E']),
    );
    expect(getDependents('A', exampleGraph)).toHaveLength(4);
  });

  it('returns only E as dependent of D', () => {
    expect(getDependents('D', exampleGraph)).toEqual(['E']);
  });

  it('returns an empty array for a leaf module', () => {
    expect(getDependents('E', exampleGraph)).toEqual([]);
  });
});
