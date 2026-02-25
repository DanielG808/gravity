import { useRef, useState, useCallback } from "react";
import {
  FIRE_COOLDOWN_MS,
  SHIP_RADIUS,
  BULLET_RADIUS,
  BULLET_SPEED,
  BULLET_TTL_S,
} from "./constants";
import { uid } from "./math";
import { Pointer, TBullet } from "./types";

export function useBullets(args: {
  pointerRef: React.RefObject<Pointer>;
  readyRef: React.RefObject<boolean>;
  canFireRef: React.RefObject<boolean>;
}) {
  const { pointerRef, readyRef, canFireRef } = args;

  const bulletsRef = useRef<TBullet[]>([]);
  const [bullets, setBullets] = useState<TBullet[]>([]);
  const lastFireAtRef = useRef<number>(0);

  const commitBullets = useCallback((next: TBullet[]) => {
    bulletsRef.current = next;
    setBullets(next);
  }, []);

  const resetBullets = useCallback(() => {
    commitBullets([]);
    lastFireAtRef.current = 0;
  }, [commitBullets]);

  const fireBullet = useCallback(() => {
    if (readyRef.current) return;
    if (!canFireRef.current) return;

    const now = performance.now();
    if (now - lastFireAtRef.current < FIRE_COOLDOWN_MS) return;

    const p = pointerRef.current;
    if (!p?.inside) return;

    lastFireAtRef.current = now;

    const nx = 0;
    const ny = -1;

    const spawnX = p.x;
    const spawnY = p.y + ny * (SHIP_RADIUS + BULLET_RADIUS + 2);

    const bullet: TBullet = {
      id: uid(),
      pos: { x: spawnX, y: spawnY },
      vel: { x: nx * BULLET_SPEED, y: ny * BULLET_SPEED },
      radius: BULLET_RADIUS,
      ttl: BULLET_TTL_S,
    };

    commitBullets([...bulletsRef.current, bullet]);
  }, [pointerRef, readyRef, canFireRef, commitBullets]);

  return { bullets, bulletsRef, fireBullet, resetBullets, commitBullets };
}
