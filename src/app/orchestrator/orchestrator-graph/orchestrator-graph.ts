import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Module, ModuleId } from '../../module/module';
import { Orchestrator } from '../orchestrator';
import { ModuleCard } from '../../module/module-card/module-card';
import { NODE_WIDTH, NODE_HEIGHT, SPACING_X, SPACING_Y } from './graph-constants';
import { EdgeLayout, GraphLayout, NodeLayout } from './graph-layout';


@Component({
  selector: 'app-orchestrator-graph',
  imports: [ModuleCard],
  templateUrl: './orchestrator-graph.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrchestratorGraph {
  private readonly orchestrator = inject(Orchestrator);

  protected readonly states = this.orchestrator.states;
  protected readonly layout = computed(() => computeLayout(this.orchestrator.modules()));

  protected retry(id: ModuleId): void {
    this.orchestrator.retry(id);
  }
}

function computeDepths(modules: Module[]): Map<ModuleId, number> {
  const modulesById = new Map(modules.map((module) => [module.id, module]));
  const depths = new Map<ModuleId, number>();

  function resolve(id: ModuleId): number {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    const dependsOn = modulesById.get(id)?.dependsOn ?? [];
    const depth = dependsOn.length > 0 ? Math.max(...dependsOn.map(resolve)) + 1 : 0;
    depths.set(id, depth);
    return depth;
  }

  for (const module of modules) {
    resolve(module.id);
  }
  return depths;
}

function computeLayout(modules: Module[]): GraphLayout {
  const depths = computeDepths(modules);
  const layers = new Map<number, ModuleId[]>();
  for (const module of modules) {
    const depth = depths.get(module.id) ?? 0;
    layers.set(depth, [...(layers.get(depth) ?? []), module.id]);
  }

  const positions = new Map<ModuleId, NodeLayout>();
  let maxWidth = 0;
  for (const [depth, moduleIds] of layers) {
    moduleIds.forEach((id, index) => {
      const x = index * (NODE_WIDTH + SPACING_X);
      const y = depth * (NODE_HEIGHT + SPACING_Y);
      positions.set(id, { id, x, y });
      maxWidth = Math.max(maxWidth, x + NODE_WIDTH);
    });
  }

  const edges: EdgeLayout[] = [];
  for (const module of modules) {
    const to = positions.get(module.id);
    if (!to) continue;
    for (const dependencyId of module.dependsOn) {
      const from = positions.get(dependencyId);
      if (!from) continue;
      edges.push({
        id: `${dependencyId}->${module.id}`,
        x1: from.x + NODE_WIDTH / 2,
        y1: from.y + NODE_HEIGHT,
        x2: to.x + NODE_WIDTH / 2,
        y2: to.y,
      });
    }
  }

  const maxDepth = layers.size > 0 ? Math.max(...layers.keys()) : 0;
  return {
    nodes: [...positions.values()],
    edges,
    width: maxWidth,
    height: (maxDepth + 1) * (NODE_HEIGHT + SPACING_Y) - SPACING_Y,
  };
}
