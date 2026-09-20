import { Module, ModuleId } from '../module';

export type Cycle = ModuleId[];

interface CycleSearchState {
  modules: Map<ModuleId, Module>;
  visited: Set<ModuleId>;
  onPath: Set<ModuleId>;
  path: ModuleId[];
}

export function detectCycles(modules: Module[]): Cycle[] {
  const state = createSearchState(modules);
  const cycles = findCyclesFromModules(modules, state);

  return cycles;
}

function createSearchState(modules: Module[]): CycleSearchState {
  return {
    modules: new Map(modules.map((module) => [module.id, module])),
    visited: new Set(),
    onPath: new Set(),
    path: [],
  };
}

function findCyclesFromModules(modules: Module[], searchState: CycleSearchState): Cycle[] {
  const cycles = [] as Cycle[];

  for (const module of modules) {
    const cyclesFromModule = findCyclesFromModule(module.id, searchState);
    cycles.push(...cyclesFromModule);
  }

  return cycles;
}

function findCyclesFromModule(moduleId: ModuleId, searchState: CycleSearchState): Cycle[] {
  if (searchState.onPath.has(moduleId)) return [reconstructCycle(moduleId, searchState.path)];
  if (searchState.visited.has(moduleId)) return [];

  searchState.visited.add(moduleId);
  searchState.onPath.add(moduleId);
  searchState.path.push(moduleId);

  const cycles = [] as Cycle[];
  for (const dependencyId of getDependenciesOfModule(moduleId, searchState.modules)) {
    const cyclesFromDependency = findCyclesFromModule(dependencyId, searchState);
    cycles.push(...cyclesFromDependency);
  }

  searchState.path.pop();
  searchState.onPath.delete(moduleId);
  return cycles;
}

function reconstructCycle(id: ModuleId, path: ModuleId[]): Cycle {
  const cycleStart = path.indexOf(id);
  return [...path.slice(cycleStart), id];
}

function getDependenciesOfModule(id: ModuleId, modules: Map<ModuleId, Module>): ModuleId[] {
  return modules.get(id)?.dependsOn ?? [];
}
