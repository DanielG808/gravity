import type { BodyState } from "@/src/lib/gravity/types";

export type GravityParams = {
  damping: number;
  g: number;
  softening: number;
  maxSpeed: number;
};

export type Point = { x: number; y: number };

export function stepGravity(
  body: BodyState,
  target: Point,
  dt: number,
  p: GravityParams,
) {
  const dx = target.x - body.x;
  const dy = target.y - body.y;

  const distSq = dx * dx + dy * dy + p.softening * p.softening;
  const dist = Math.sqrt(distSq);

  const accel = (p.g * body.mass) / distSq;

  body.vx += (dx / dist) * accel * dt;
  body.vy += (dy / dist) * accel * dt;

  const speed = Math.hypot(body.vx, body.vy);
  if (speed > p.maxSpeed) {
    const s = p.maxSpeed / speed;
    body.vx *= s;
    body.vy *= s;
  }

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  body.vx *= p.damping;
  body.vy *= p.damping;
}
