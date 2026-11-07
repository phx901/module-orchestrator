import { ModuleState, ModuleStatus } from '../module/module-state';
import { Module, ModuleId } from '../module/module';

export function getReadyModules(modules: Module[], states: Map<ModuleId, ModuleState>): ModuleId[] {
  return modules
    .filter((module) => isPending(module, states))
    .filter((module) => hasAllDependenciesCompleted(module, states))
    .map((module) => module.id);
}

export function getDependents(id: ModuleId, modules: Module[]): ModuleId[] {
  const directDependents = buildDependentsMap(modules);
  return collectTransitiveDependents(id, directDependents);
}

function getStatus(id: ModuleId, states: Map<ModuleId, ModuleState>): ModuleStatus | undefined {
  return states.get(id)?.status;
}

function isPending(module: Module, states: Map<ModuleId, ModuleState>): boolean {
  return getStatus(module.id, states) === 'Pending';
}

function hasAllDependenciesCompleted(module: Module, states: Map<ModuleId, ModuleState>): boolean {
  return module.dependsOn.every((dependencyId) => getStatus(dependencyId, states) === 'Completed');
}

function buildDependentsMap(modules: Module[]): Map<ModuleId, ModuleId[]> {
  const dependents = new Map<ModuleId, ModuleId[]>();
  for (const module of modules) {
    for (const dependencyId of module.dependsOn) {
      dependents.set(dependencyId, [...(dependents.get(dependencyId) ?? []), module.id]);
    }
  }
  return dependents;
}

function collectTransitiveDependents(startId: ModuleId, directDependents: Map<ModuleId, ModuleId[]>): ModuleId[] {
  const result = new Set<ModuleId>();
  const queue = [...(directDependents.get(startId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (result.has(current)) {
      continue;
    }
    result.add(current);
    queue.push(...(directDependents.get(current) ?? []));
  }

  return [...result];
}
