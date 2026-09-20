import { ModuleState } from '../module/module-state';
import { Module, ModuleId } from '../module/module';

export function getReadyModules(
  modules: Module[],
  states: Map<ModuleId, ModuleState>,
): ModuleId[] {
  return modules
    .filter((module) => states.get(module.id)?.status === 'Pending')
    .filter((module) =>
      module.dependsOn.every((dependencyId) => states.get(dependencyId)?.status === 'Completed'),
    )
    .map((module) => module.id);
}

export function getDependents(id: ModuleId, modules: Module[]): ModuleId[] {
  const directDependents = new Map<ModuleId, ModuleId[]>();
  for (const module of modules) {
    for (const dependencyId of module.dependsOn) {
      directDependents.set(dependencyId, [
        ...(directDependents.get(dependencyId) ?? []),
        module.id,
      ]);
    }
  }

  const result = new Set<ModuleId>();
  const queue = [...(directDependents.get(id) ?? [])];

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
