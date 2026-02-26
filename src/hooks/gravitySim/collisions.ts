// src/hooks/gravitySim/collisions.ts
import type { Body } from "./types";
import {
  COLLISION_PASSES,
  POS_CORRECTION,
  RESTITUTION,
  SLOP,
} from "./constants";

function resolvePair(a: Body, b: Body) {
  let dx = b.pos.x - a.pos.x;
  let dy = b.pos.y - a.pos.y;

  const minDist = a.radius + b.radius;
  let dist2 = dx * dx + dy * dy;

  if (dist2 === 0) {
    dx = 1;
    dy = 0;
    dist2 = 1;
  }

  if (dist2 >= minDist * minDist) return false;

  const dist = Math.sqrt(dist2);
  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = minDist - dist;

  const invA = a.mass > 0 ? 1 / a.mass : 0;
  const invB = b.mass > 0 ? 1 / b.mass : 0;
  const invSum = invA + invB;

  if (invSum > 0) {
    const correction = (Math.max(0, overlap - SLOP) * POS_CORRECTION) / invSum;
    const cx = nx * correction;
    const cy = ny * correction;

    a.pos.x -= cx * invA;
    a.pos.y -= cy * invA;
    b.pos.x += cx * invB;
    b.pos.y += cy * invB;
  }

  const rvx = b.vel.x - a.vel.x;
  const rvy = b.vel.y - a.vel.y;
  const velAlongNormal = rvx * nx + rvy * ny;

  if (velAlongNormal > 0 && overlap < 0.25) return true;

  const j = (-(1 + RESTITUTION) * velAlongNormal) / (invSum || 1);
  const ix = j * nx;
  const iy = j * ny;

  a.vel.x -= ix * invA;
  a.vel.y -= iy * invA;
  b.vel.x += ix * invB;
  b.vel.y += iy * invB;

  return true;
}

export function solveCollisions(bodies: Body[]) {
  for (let pass = 0; pass < COLLISION_PASSES; pass++) {
    let any = false;

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        if (resolvePair(bodies[i], bodies[j])) any = true;
      }
    }

    if (!any) break;
  }
}
