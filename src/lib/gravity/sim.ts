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

  body.velocityX += (dx / dist) * accel * dt;
  body.velocityY += (dy / dist) * accel * dt;

  const speed = Math.hypot(body.velocityX, body.velocityY);
  if (speed > p.maxSpeed) {
    const s = p.maxSpeed / speed;
    body.velocityX *= s;
    body.velocityY *= s;
  }

  body.x += body.velocityX * dt;
  body.y += body.velocityY * dt;

  body.velocityX *= p.damping;
  body.velocityY *= p.damping;
}
