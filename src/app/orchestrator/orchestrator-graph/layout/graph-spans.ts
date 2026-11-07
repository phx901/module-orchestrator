import { Module, ModuleId } from '../../../module/module';

/** Inclusive range of grid columns. */
export interface Span {
  start: number;
  end: number;
}

type Spans = Map<ModuleId, Span>;

const FALLBACK_SPAN: Span = { start: 0, end: 0 };

export function computeSpans(layers: Module[][]): Spans {
  const spans: Spans = new Map();
  layers.forEach((layer) => assignLayerSpans(layer, spans));
  widenRootsOverDependents(layers.flat(), spans);
  return spans;
}

export function spanOrFallback(spans: Spans, id: ModuleId): Span {
  return spans.get(id) ?? FALLBACK_SPAN;
}

function assignLayerSpans(layer: Module[], spans: Spans): void {
  const occupiedColumns = new Set<number>();
  const spanningModules = layer.filter((module) => hasSeveralDependencies(module, spans));
  const singleColumnModules = layer.filter((module) => !hasSeveralDependencies(module, spans));

  spanningModules.forEach((module) => assignSpanOverDependencies(module, spans, occupiedColumns));
  singleColumnModules.forEach((module) => assignFirstFreeColumn(module, spans, occupiedColumns));
}

function hasSeveralDependencies(module: Module, spans: Spans): boolean {
  return spansOfDependencies(module, spans).length >= 2;
}

function assignSpanOverDependencies(module: Module, spans: Spans, occupiedColumns: Set<number>): void {
  assignSpan(module, unionOf(spansOfDependencies(module, spans)), spans, occupiedColumns);
}

function assignFirstFreeColumn(module: Module, spans: Spans, occupiedColumns: Set<number>): void {
  const preferredColumn = spansOfDependencies(module, spans)[0]?.start ?? 0;
  const column = firstFreeColumnFrom(preferredColumn, occupiedColumns);
  assignSpan(module, { start: column, end: column }, spans, occupiedColumns);
}

function assignSpan(module: Module, span: Span, spans: Spans, occupiedColumns: Set<number>): void {
  spans.set(module.id, span);
  occupyColumns(span, occupiedColumns);
}

function occupyColumns(span: Span, occupiedColumns: Set<number>): void {
  for (let column = span.start; column <= span.end; column++) occupiedColumns.add(column);
}

function firstFreeColumnFrom(column: number, occupiedColumns: Set<number>): number {
  return occupiedColumns.has(column) ? firstFreeColumnFrom(column + 1, occupiedColumns) : column;
}

function widenRootsOverDependents(modules: Module[], spans: Spans): void {
  const roots = modules.filter((module) => module.dependsOn.length === 0);
  for (const root of roots) {
    const widened = spanOverDependents(root, modules, spans);
    if (widened && !overlapsOtherRoot(widened, root, roots, spans)) {
      spans.set(root.id, widened);
    }
  }
}

function spanOverDependents(root: Module, modules: Module[], spans: Spans): Span | undefined {
  const dependentSpans = modules
    .filter((module) => module.dependsOn.includes(root.id))
    .flatMap((module) => spans.get(module.id) ?? []);
  return dependentSpans.length >= 2 ? unionOf(dependentSpans) : undefined;
}

function overlapsOtherRoot(span: Span, root: Module, roots: Module[], spans: Spans): boolean {
  return roots
    .filter((other) => other !== root)
    .some((other) => overlaps(spans.get(other.id), span));
}

function spansOfDependencies(module: Module, spans: Spans): Span[] {
  return module.dependsOn.flatMap((id) => spans.get(id) ?? []);
}

function unionOf(spans: Span[]): Span {
  return {
    start: Math.min(...spans.map((span) => span.start)),
    end: Math.max(...spans.map((span) => span.end)),
  };
}

function overlaps(a: Span | undefined, b: Span): boolean {
  return !!a && a.start <= b.end && a.end >= b.start;
}
