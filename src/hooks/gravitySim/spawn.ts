import type { Body, Pointer, Vec2 } from "./types";
import { clamp, massToRadius, rand, uid } from "./math";
import { randColor } from "./colors";
import {
  SHIP_RADIUS,
  SPAWN_BASE_INTERVAL_MS,
  SPAWN_BASE_MEAN_MASS,
  SPAWN_INTERVAL_DECAY_PER_S,
  SPAWN_MASS_JITTER,
  SPAWN_MASS_PER_S,
  SPAWN_MAX_MASS,
  SPAWN_MIN_INTERVAL_MS,
  SPAWN_PADDING,
  SPAWN_SHIP_SAFE_PAD,
  SPAWN_TRIES,
} from "./constants";

export function activeBodiesCount(list: Body[]) {
  let n = 0;
  for (let i = 0; i < list.length; i++) if (!list[i].destroyed) n++;
  return n;
}

export function computeSpawnIntervalMs(elapsedS: number) {
  const interval =
    SPAWN_BASE_INTERVAL_MS * Math.pow(SPAWN_INTERVAL_DECAY_PER_S, elapsedS);
  return clamp(interval, SPAWN_MIN_INTERVAL_MS, SPAWN_BASE_INTERVAL_MS);
}

export function computeSpawnMass(elapsedS: number) {
  const mean = SPAWN_BASE_MEAN_MASS + elapsedS * SPAWN_MASS_PER_S;
  const jittered = mean * rand(1 - SPAWN_MASS_JITTER, 1 + SPAWN_MASS_JITTER);
  return clamp(Math.round(jittered), 1, SPAWN_MAX_MASS);
}

export function findSafeSpawnPos(args: {
  bounds: { w: number; h: number };
  bodies: Body[];
  radius: number;
  ship: { x: number; y: number; active: boolean };
}) {
  const { bounds, bodies, radius, ship } = args;
  const w = bounds.w;
  const h = bounds.h;

  const minX = radius;
  const maxX = w - radius;
  const minY = radius;
  const maxY = h - radius;

  if (w <= radius * 2 + 2 || h <= radius * 2 + 2) return null;

  const shipSafeR = ship.active
    ? radius + SHIP_RADIUS + SPAWN_SHIP_SAFE_PAD
    : 0;

  const okAt = (x: number, y: number) => {
    if (ship.active) {
      const dxs = x - ship.x;
      const dys = y - ship.y;
      if (dxs * dxs + dys * dys <= shipSafeR * shipSafeR) return false;
    }

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.destroyed) continue;
      const rr = radius + b.radius + SPAWN_PADDING;
      const dx = x - b.pos.x;
      const dy = y - b.pos.y;
      if (dx * dx + dy * dy <= rr * rr) return false;
    }

    return true;
  };

  for (let i = 0; i < SPAWN_TRIES; i++) {
    const x = rand(minX, Math.max(minX, maxX));
    const y = rand(minY, Math.max(minY, maxY));
    if (okAt(x, y)) return { x, y };
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const ringMax = Math.max(w, h);

  for (let ring = 24; ring <= ringMax; ring += 24) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const x = clamp(cx + Math.cos(a) * ring, minX, maxX);
      const y = clamp(cy + Math.sin(a) * ring, minY, maxY);
      if (okAt(x, y)) return { x, y };
    }
  }

  return null;
}

export function spawnOne(args: {
  now: number;
  elapsedS: number;
  bounds: { w: number; h: number };
  bodies: Body[];
  pointer: Pointer;
  shipAlive: boolean;
}) {
  const { elapsedS, bounds, bodies, pointer, shipAlive } = args;

  const mass = computeSpawnMass(elapsedS);
  const radius = massToRadius(mass);

  const ship = {
    x: pointer.x,
    y: pointer.y,
    active: pointer.inside && shipAlive,
  };

  const pos = findSafeSpawnPos({ bounds, bodies, radius, ship });
  if (!pos) return null;

  const vx = rand(-160, 160);
  const vy = rand(-160, 160);

  const newBody: Body = {
    id: uid(),
    pos,
    vel: { x: vx, y: vy },
    mass,
    radius,
    color: randColor(),
  };

  return newBody;
}
