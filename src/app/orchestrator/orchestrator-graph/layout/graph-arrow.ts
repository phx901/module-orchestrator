import { ARROW_HEAD_HEIGHT, ARROW_HEAD_WIDTH, ARROW_SHAFT_WIDTH, NODE_HEIGHT } from './graph-constants';
import { EdgeLayout, NodeLayout } from './graph-layout';

const BORDER_WIDTH = 1;

interface Point {
  x: number;
  y: number;
}

export function createArrow(from: NodeLayout, to: NodeLayout): Pick<EdgeLayout, 'fill' | 'outline'> {
  const x = arrowX(from, to);
  const sourceBottom = from.y + NODE_HEIGHT;
  return {
    fill: createFillPath(x, sourceBottom, to.y),
    outline: createOpenOutlinePath(x, sourceBottom, to.y),
  };
}

function arrowX(from: NodeLayout, to: NodeLayout): number {
  const sharedStart = Math.max(from.x, to.x);
  const sharedEnd = Math.min(from.x + from.width, to.x + to.width);
  const shareColumns = sharedEnd > sharedStart;
  return shareColumns ? (sharedStart + sharedEnd) / 2 : sourceCenterClampedToTarget(from, to);
}

function sourceCenterClampedToTarget(from: NodeLayout, to: NodeLayout): number {
  const margin = ARROW_HEAD_WIDTH / 2;
  const sourceCenter = from.x + from.width / 2;
  return Math.min(Math.max(sourceCenter, to.x + margin), to.x + to.width - margin);
}

function createFillPath(x: number, sourceBottom: number, targetTop: number): string {
  const startY = sourceBottom - 2 * BORDER_WIDTH;
  const neckY = targetTop + BORDER_WIDTH;
  return toClosedPath(arrowPoints(x, startY, neckY, arrowTipY(targetTop)));
}

function createOpenOutlinePath(x: number, sourceBottom: number, targetTop: number): string {
  const startY = sourceBottom - BORDER_WIDTH;
  const neckY = targetTop + BORDER_WIDTH / 2;
  return toOpenPath(arrowPoints(x, startY, neckY, arrowTipY(targetTop)));
}

function arrowTipY(targetTop: number): number {
  return targetTop + BORDER_WIDTH / 2 + ARROW_HEAD_HEIGHT;
}

function arrowPoints(x: number, startY: number, neckY: number, tipY: number): Point[] {
  const shaftHalf = ARROW_SHAFT_WIDTH / 2;
  const headHalf = ARROW_HEAD_WIDTH / 2;
  return [
    { x: x - shaftHalf, y: startY },
    { x: x - shaftHalf, y: neckY },
    { x: x - headHalf, y: neckY },
    { x, y: tipY },
    { x: x + headHalf, y: neckY },
    { x: x + shaftHalf, y: neckY },
    { x: x + shaftHalf, y: startY },
  ];
}

function toOpenPath(points: Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function toClosedPath(points: Point[]): string {
  return `${toOpenPath(points)} Z`;
}
