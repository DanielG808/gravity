export type Vec2 = { x: number; y: number };

export type PointerState = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  inside: boolean;
};

export type BodyState = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  r: number;
};
