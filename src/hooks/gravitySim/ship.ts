import { useCallback, useEffect, useRef, useState } from "react";
import type { Vec2 } from "./types";
import { clamp } from "./math";
import { EXPLOSION_DURATION, SHIP_INVULN_MS, SHIP_MAX_HP } from "./constants";

export function useShip() {
  const shipHpRef = useRef<number>(SHIP_MAX_HP);
  const shipInvulnUntilRef = useRef<number>(0);
  const [shipHp, setShipHp] = useState<number>(SHIP_MAX_HP);

  const [shipExplosion, setShipExplosion] = useState<Vec2 | null>(null);
  const explosionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (explosionTimeoutRef.current != null) {
        window.clearTimeout(explosionTimeoutRef.current);
        explosionTimeoutRef.current = null;
      }
    };
  }, []);

  const triggerShipExplosion = useCallback((pos: Vec2) => {
    if (explosionTimeoutRef.current != null) {
      window.clearTimeout(explosionTimeoutRef.current);
      explosionTimeoutRef.current = null;
    }

    setShipExplosion(pos);

    explosionTimeoutRef.current = window.setTimeout(() => {
      setShipExplosion(null);
      explosionTimeoutRef.current = null;
    }, EXPLOSION_DURATION);
  }, []);

  const resetShip = useCallback(() => {
    shipHpRef.current = SHIP_MAX_HP;
    shipInvulnUntilRef.current = 0;
    setShipHp(SHIP_MAX_HP);
    if (explosionTimeoutRef.current != null) {
      window.clearTimeout(explosionTimeoutRef.current);
      explosionTimeoutRef.current = null;
    }
    setShipExplosion(null);
  }, []);

  const applyShipDamage = useCallback((now: number, dmg: number) => {
    if (now < shipInvulnUntilRef.current) return { died: false };

    const prevHp = shipHpRef.current;
    const nextHp = clamp(prevHp - dmg, 0, SHIP_MAX_HP);

    shipHpRef.current = nextHp;
    shipInvulnUntilRef.current = now + SHIP_INVULN_MS;
    setShipHp(nextHp);

    return { died: prevHp > 0 && nextHp === 0 };
  }, []);

  return {
    shipHp,
    shipHpRef,
    shipInvulnUntilRef,
    shipExplosion,
    triggerShipExplosion,
    resetShip,
    applyShipDamage,
  };
}
