import { Module, ModuleId } from '../../../module/module';
import { createArrow } from './graph-arrow';
import { NODE_HEIGHT, NODE_WIDTH, SPACING_X, SPACING_Y } from './graph-constants';
import { groupIntoLayers } from './graph-layers';
import { EdgeLayout, GraphLayout, NodeLayout } from './graph-layout';
import { computeSpans, Span, spanOrFallback } from './graph-spans';

type NodesById = Map<ModuleId, NodeLayout>;

export function computeGraphLayout(modules: Module[]): GraphLayout {
  const layers = groupIntoLayers(modules);
  const nodes = createNodes(layers);
  const nodesById: NodesById = new Map(nodes.map((node) => [node.id, node]));
  return {
    nodes,
    edges: createEdges(modules, nodesById),
    width: Math.max(0, ...nodes.map((node) => node.x + node.width)),
    height: layers.length * (NODE_HEIGHT + SPACING_Y) - SPACING_Y,
  };
}

function createNodes(layers: Module[][]): NodeLayout[] {
  const spans = computeSpans(layers);
  return layers.flatMap((layer, layerIndex) =>
    layer.map((module) => createNode(module.id, spanOrFallback(spans, module.id), layerIndex)),
  );
}

function createNode(id: ModuleId, span: Span, layerIndex: number): NodeLayout {
  const columns = span.end - span.start + 1;
  return {
    id,
    x: span.start * (NODE_WIDTH + SPACING_X),
    y: layerIndex * (NODE_HEIGHT + SPACING_Y),
    width: columns * NODE_WIDTH + (columns - 1) * SPACING_X,
  };
}

function createEdges(modules: Module[], nodesById: NodesById): EdgeLayout[] {
  return modules.flatMap((module) => createEdgesInto(module, nodesById));
}

function createEdgesInto(module: Module, nodesById: NodesById): EdgeLayout[] {
  const to = nodesById.get(module.id);
  if (!to) return [];

  return module.dependsOn.flatMap((dependencyId) => {
    const from = nodesById.get(dependencyId);
    return from ? [{ id: `${dependencyId}->${module.id}`, ...createArrow(from, to) }] : [];
  });
}
