import { Module, ModuleId } from '../../../module/module';

/**
 * Module, gruppiert in parallele Schichten.
 * Jedes Modul in Schicht i hat alle Abhängigkeiten in Schichten < i.
 */
export type Layers = Module[][];

export interface NodeLayout {
  id: ModuleId;
  x: number;
  y: number;
  width: number;
}

export interface EdgeLayout {
  id: string;
  fill: string;
  outline: string;
}

export interface GraphLayout {
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  width: number;
  height: number;
}
