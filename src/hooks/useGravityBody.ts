"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { BodyState } from "@/src/lib/gravity/types";
import { stepGravity } from "@/src/lib/gravity/sim";

type Vec2 = { x: number; y: number };

type SimParams = {
  damping: number;
  g: number;
  softening: number;
  maxSpeed: number;
};

type UseGravityBodyArgs = {
  playfieldRef: React.RefObject<HTMLElement | null>;
  bodyElRef: React.RefObject<HTMLDivElement | null>;
  pointerRef: React.RefObject<Vec2>;
  sim: SimParams;
};

export function useGravityBody({
  playfieldRef,
  bodyElRef,
  pointerRef,
  sim,
}: UseGravityBodyArgs) {
  const bodyRef = useRef<BodyState>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    mass: 1,
  });

  const applyTransform = useCallback(() => {
    const bodyEl = bodyElRef.current;
    if (!bodyEl) return;
    const body = bodyRef.current;
    bodyEl.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
  }, [bodyElRef]);

  const resetToCenter = useCallback(() => {
    const el = playfieldRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const body = bodyRef.current;

    body.x = r.width / 2;
    body.y = r.height / 2;
    body.velocityX = 0;
    body.velocityY = 0;

    applyTransform();
  }, [playfieldRef, applyTransform]);

  useLayoutEffect(() => {
    resetToCenter();
  }, [resetToCenter]);

  const step = useCallback(
    (t: number, dt: number) => {
      const bodyEl = bodyElRef.current;
      if (!bodyEl) return;

      const body = bodyRef.current;
      const p = pointerRef.current;

      stepGravity(body, { x: p.x, y: p.y }, dt, sim);

      bodyEl.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
    },
    [bodyElRef, pointerRef, sim],
  );

  return {
    bodyRef,
    step,
    resetToCenter,
    applyTransform,
  };
}
