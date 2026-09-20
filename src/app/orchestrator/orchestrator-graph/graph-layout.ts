import { ModuleId } from '../../module/module';

export interface NodeLayout {
  id: ModuleId;
  x: number;
  y: number;
}

export interface EdgeLayout {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GraphLayout {
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  width: number;
  height: number;
}
