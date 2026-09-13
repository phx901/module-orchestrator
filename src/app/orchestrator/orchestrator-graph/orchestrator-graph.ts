import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModuleDefinition, ModuleId } from '../../module/module-definition';
import { Orchestrator } from '../orchestrator';
import { ModuleCard } from '../../module/module-card/module-card';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 96;
const SPACING_X = 60;
const SPACING_Y = 90;

interface NodeLayout {
  id: ModuleId;
  x: number;
  y: number;
}

interface EdgeLayout {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface GraphLayout {
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  width: number;
  height: number;
}

function computeDepths(defs: ModuleDefinition[]): Map<ModuleId, number> {
  const byId = new Map(defs.map((def) => [def.id, def]));
  const depths = new Map<ModuleId, number>();

  function resolve(id: ModuleId): number {
    const cached = depths.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const dependsOn = byId.get(id)?.dependsOn ?? [];
    const depth = dependsOn.length > 0 ? Math.max(...dependsOn.map(resolve)) + 1 : 0;
    depths.set(id, depth);
    return depth;
  }

  for (const def of defs) {
    resolve(def.id);
  }
  return depths;
}

function computeLayout(defs: ModuleDefinition[]): GraphLayout {
  const depths = computeDepths(defs);
  const layers = new Map<number, ModuleId[]>();
  for (const def of defs) {
    const depth = depths.get(def.id) ?? 0;
    layers.set(depth, [...(layers.get(depth) ?? []), def.id]);
  }

  const positions = new Map<ModuleId, NodeLayout>();
  let maxWidth = 0;
  for (const [depth, ids] of layers) {
    ids.forEach((id, index) => {
      const x = index * (NODE_WIDTH + SPACING_X);
      const y = depth * (NODE_HEIGHT + SPACING_Y);
      positions.set(id, { id, x, y });
      maxWidth = Math.max(maxWidth, x + NODE_WIDTH);
    });
  }

  const edges: EdgeLayout[] = [];
  for (const def of defs) {
    const to = positions.get(def.id);
    if (!to) {
      continue;
    }
    for (const depId of def.dependsOn) {
      const from = positions.get(depId);
      if (!from) {
        continue;
      }
      edges.push({
        id: `${depId}->${def.id}`,
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

@Component({
  selector: 'app-orchestrator-graph',
  imports: [ModuleCard],
  templateUrl: './orchestrator-graph.html',
  styleUrl: './orchestrator-graph.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrchestratorGraph {
  private readonly orchestrator = inject(Orchestrator);

  protected readonly states = this.orchestrator.states;
  protected readonly layout = computed(() => computeLayout(this.orchestrator.defs()));

  protected retry(id: ModuleId): void {
    this.orchestrator.retry(id);
  }
}
