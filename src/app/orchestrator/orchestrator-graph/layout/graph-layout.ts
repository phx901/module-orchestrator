import { ModuleId } from '../../../module/module';

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
