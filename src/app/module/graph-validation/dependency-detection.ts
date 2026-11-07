import { Module, ModuleId } from '../module';

export interface UnknownDependency {
  moduleId: ModuleId;
  dependencyId: ModuleId;
}

export function findUnknownDependencies(modules: Module[]): UnknownDependency[] {
  const knownModuleIds = extractModuleIds(modules);
  const unknownDependencies = findUnknownDependenciesForModules(modules, knownModuleIds);

  return unknownDependencies;
}

function extractModuleIds(modules: Module[]): Set<ModuleId> {
  return new Set(modules.map((module) => module.id));
}

function findUnknownDependenciesForModules(modules: Module[], knownModuleIds: Set<ModuleId>): UnknownDependency[] {
  const unknownDependencies = [] as UnknownDependency[];
  
  for (const module of modules) {
    const unknownDependenciesForModule = findUnknownDependenciesForModule(module, knownModuleIds);
    unknownDependencies.push(...unknownDependenciesForModule);
  }

  return unknownDependencies;
}

function findUnknownDependenciesForModule(module: Module, knownModuleIds: Set<ModuleId>): UnknownDependency[] {
  const unknownDependencyIds = module.dependsOn.filter((dependencyId) => !knownModuleIds.has(dependencyId));

  return unknownDependencyIds.map((dependencyId) => ({
    moduleId: module.id,
    dependencyId,
  }));
}
