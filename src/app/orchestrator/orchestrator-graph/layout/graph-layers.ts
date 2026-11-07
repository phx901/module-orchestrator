import { Module } from '../../../module/module';

export function groupIntoLayers(remaining: Module[]): Module[][] {
  const remainingIds = new Set(remaining.map((module) => module.id));
  const layer = remaining.filter((module) => module.dependsOn.every((id) => !remainingIds.has(id)));
  if (layer.length === 0) return [];
  return [layer, ...groupIntoLayers(remaining.filter((module) => !layer.includes(module)))];
}
