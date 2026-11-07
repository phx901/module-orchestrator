import { Module, ModuleId } from './module';

export function indexModulesById(modules: Module[]): Map<ModuleId, Module> {
  return new Map(modules.map((module) => [module.id, module]));
}
