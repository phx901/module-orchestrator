import { of } from 'rxjs';
import { getDependents, getReadyModules } from './scheduling';
import { ModuleState } from '../module/module-state';
import { Module, ModuleId } from '../module/module';
import { Result } from '../module/result';

function makeDef(id: ModuleId, dependsOn: ModuleId[] = []): Module {
  return {
    id,
    dependsOn,
    execute: () => of<Result>({ status: 'ok' }),
  };
}

function makeStates(entries: Record<ModuleId, ModuleState['status']>): Map<ModuleId, ModuleState> {
  return new Map(Object.entries(entries).map(([id, status]) => [id, { status }]));
}

const exampleGraph: Module[] = [
  makeDef('A'),
  makeDef('B', ['A']),
  makeDef('C', ['A']),
  makeDef('D', ['C']),
  makeDef('E', ['B', 'D']),
];

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
