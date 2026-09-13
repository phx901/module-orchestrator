import { ModuleState } from '../module/module-state';
import { ModuleDefinition, ModuleId } from '../module/module-definition';

export function detectCycle(defs: ModuleDefinition[]): ModuleId[] | null {
  const byId = new Map(defs.map((def) => [def.id, def]));
  const visited = new Set<ModuleId>();
  const inStack = new Set<ModuleId>();
  const stack: ModuleId[] = [];

  function visit(id: ModuleId): ModuleId[] | null {
    if (inStack.has(id)) {
      const cycleStart = stack.indexOf(id);
      return [...stack.slice(cycleStart), id];
    }
    if (visited.has(id)) {
      return null;
    }

    visited.add(id);
    inStack.add(id);
    stack.push(id);

    for (const depId of byId.get(id)?.dependsOn ?? []) {
      const cycle = visit(depId);
      if (cycle) {
        return cycle;
      }
    }

    stack.pop();
    inStack.delete(id);
    return null;
  }

  for (const def of defs) {
    const cycle = visit(def.id);
    if (cycle) {
      return cycle;
    }
  }
  return null;
}

export function validateGraph(defs: ModuleDefinition[]): string[] {
  const knownIds = new Set(defs.map((def) => def.id));
  const errors: string[] = [];

  for (const def of defs) {
    for (const depId of def.dependsOn) {
      if (!knownIds.has(depId)) {
        errors.push(`Module "${def.id}" depends on unknown module "${depId}".`);
      }
    }
  }

  const cycle = detectCycle(defs);
  if (cycle) {
    errors.push(`Cycle detected: ${cycle.join(' -> ')}.`);
  }

  return errors;
}

export function getReadyModules(
  defs: ModuleDefinition[],
  states: Map<ModuleId, ModuleState>,
): ModuleId[] {
  return defs
    .filter((def) => states.get(def.id)?.status === 'Pending')
    .filter((def) => def.dependsOn.every((depId) => states.get(depId)?.status === 'Completed'))
    .map((def) => def.id);
}

export function getDependents(id: ModuleId, defs: ModuleDefinition[]): ModuleId[] {
  const directDependents = new Map<ModuleId, ModuleId[]>();
  for (const def of defs) {
    for (const depId of def.dependsOn) {
      directDependents.set(depId, [...(directDependents.get(depId) ?? []), def.id]);
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
