// src/hooks/gravitySim/types.ts
export type Vec2 = { x: number; y: number };

export type Body = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  mass: number;
  radius: number;
  color: string;
  destroyed?: boolean;
  destroyedAt?: number;
};

export type TBullet = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  ttl: number;
};

export type Pointer = {
  x: number;
  y: number;
  inside: boolean;
};

export type SimParams = {
  damping: number;
  g: number;
  softening: number;
  maxSpeed: number;
};

export type UseGravitySimArgs = {
  initialPos: Vec2;
  initialVel?: Vec2;
  sim?: Partial<SimParams>;
};
