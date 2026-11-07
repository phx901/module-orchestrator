import { Module, ModuleId } from '../module';
import { detectCycles } from './cycle-detection';
import { findUnknownDependencies, UnknownDependency } from './dependency-detection';

export function validateModuleGraph(modules: Module[]): string[] {
  const unknownDependencyErrors = findUnknownDependencyErrors(modules);
  const cycleErrors = findCycleErrors(modules);

  return [...unknownDependencyErrors, ...cycleErrors];
}

function findUnknownDependencyErrors(modules: Module[]): string[] {
  const unknownDependencies = findUnknownDependencies(modules);
  return unknownDependencies.map(createErrorMessageForUnknownDependency);
}

function createErrorMessageForUnknownDependency(unknownDependency: UnknownDependency): string {
  return `Module "${unknownDependency.moduleId}" depends on unknown module "${unknownDependency.dependencyId}".`;
}

function findCycleErrors(modules: Module[]): string[] {
  const cycles = detectCycles(modules);
  return cycles.map(createErrorMessageForCycle);
}

function createErrorMessageForCycle(cycle: ModuleId[]): string {
  return `Cycle detected: ${cycle.join(' -> ')}.`;
}
