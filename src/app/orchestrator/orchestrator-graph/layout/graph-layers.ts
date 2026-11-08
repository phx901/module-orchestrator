import { Module, ModuleId } from '../../../module/module';
import { Layers } from './graph-layout';

export function groupIntoLayers(modules: Module[]): Layers {
  const layers: Layers = [];
  let unassigned = modules;

  while (unassigned.length > 0) {
    const layer = nextLayer(unassigned);

    if (cycleDetected(layer)) break;

    layers.push(layer);
    unassigned = without(unassigned, layer);
  }

  return layers;
}

function nextLayer(unassigned: Module[]): Module[] {
  const unassignedIds = new Set(unassigned.map((module) => module.id));
  return unassigned.filter((module) => hasAllDependenciesPlaced(module, unassignedIds));
}

function hasAllDependenciesPlaced(module: Module, unassignedIds: Set<ModuleId>): boolean {
  return module.dependsOn.every((id) => !unassignedIds.has(id));
}

function cycleDetected(layer: Module[]): boolean {
  return layer.length === 0;
}

function without(modules: Module[], removed: Module[]): Module[] {
  const removedIds = new Set(removed.map((module) => module.id));
  return modules.filter((module) => !removedIds.has(module.id));
}
