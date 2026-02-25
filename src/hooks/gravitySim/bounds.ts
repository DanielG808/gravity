// src/hooks/gravitySim/bounds.ts
import type { Body } from "./types";
import { ELASTICITY, STOP_VEL, WALL_EPS } from "./constants";

export function collideWithBounds(b: Body, bounds: { w: number; h: number }) {
  const w = bounds.w;
  const h = bounds.h;
  if (w <= 0 || h <= 0) return;

  const r = b.radius;

  const minX = r;
  const maxX = w - r;
  const minY = r;
  const maxY = h - r;

  if (b.pos.x < minX) {
    b.pos.x = minX + WALL_EPS;
    if (b.vel.x < 0) b.vel.x = -b.vel.x * ELASTICITY;
    if (Math.abs(b.vel.x) < STOP_VEL) b.vel.x = 0;
  } else if (b.pos.x > maxX) {
    b.pos.x = maxX - WALL_EPS;
    if (b.vel.x > 0) b.vel.x = -b.vel.x * ELASTICITY;
    if (Math.abs(b.vel.x) < STOP_VEL) b.vel.x = 0;
  }

  if (b.pos.y < minY) {
    b.pos.y = minY + WALL_EPS;
    if (b.vel.y < 0) b.vel.y = -b.vel.y * ELASTICITY;
    if (Math.abs(b.vel.y) < STOP_VEL) b.vel.y = 0;
  } else if (b.pos.y > maxY) {
    b.pos.y = maxY - WALL_EPS;
    if (b.vel.y > 0) b.vel.y = -b.vel.y * ELASTICITY;
    if (Math.abs(b.vel.y) < STOP_VEL) b.vel.y = 0;
  }
}
