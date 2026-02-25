import type React from "react";
import { useCallback, useRef } from "react";
import type { Body, Vec2 } from "./types";
import { clamp } from "./math";
import { DRAG_MAX_RELEASE_SPEED, DRAG_VELOCITY_SMOOTHING } from "./constants";

export function useDragging(args: {
  bodiesRef: React.RefObject<Body[]>;
  setBodies: React.Dispatch<React.SetStateAction<Body[]>>;
}) {
  const { bodiesRef, setBodies } = args;

  const draggingRef = useRef<{
    id: string;
    offset: Vec2;
    lastPos: Vec2;
    lastT: number;
    releaseVel: Vec2;
  } | null>(null);

  const onBodyPointerDown = useCallback(
    (id: string, at: Vec2) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const b = bodiesRef.current.find((x) => x.id === id);
      if (!b) return;
      if (b.destroyed) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      draggingRef.current = {
        id,
        offset: { x: b.pos.x - at.x, y: b.pos.y - at.y },
        lastPos: { x: b.pos.x, y: b.pos.y },
        lastT: performance.now(),
        releaseVel: { ...b.vel },
      };

      const next = bodiesRef.current.map((x) =>
        x.id === id ? { ...x, vel: { x: 0, y: 0 } } : x,
      );
      bodiesRef.current = next;
      setBodies(next);
    },
    [bodiesRef, setBodies],
  );

  const onPlayfieldPointerMove = useCallback(
    (at: Vec2) => {
      const d = draggingRef.current;
      if (!d) return;

      const now = performance.now();
      const nx = at.x + d.offset.x;
      const ny = at.y + d.offset.y;

      const dt = Math.max(0.001, (now - d.lastT) / 1000);
      const instVx = (nx - d.lastPos.x) / dt;
      const instVy = (ny - d.lastPos.y) / dt;

      d.releaseVel.x =
        d.releaseVel.x + (instVx - d.releaseVel.x) * DRAG_VELOCITY_SMOOTHING;
      d.releaseVel.y =
        d.releaseVel.y + (instVy - d.releaseVel.y) * DRAG_VELOCITY_SMOOTHING;

      d.lastPos = { x: nx, y: ny };
      d.lastT = now;

      const next = bodiesRef.current.map((b) => {
        if (b.id !== d.id) return b;
        if (b.destroyed) return b;
        return { ...b, pos: { x: nx, y: ny }, vel: { x: 0, y: 0 } };
      });

      bodiesRef.current = next;
      setBodies(next);
    },
    [bodiesRef, setBodies],
  );

  const onPlayfieldPointerUp = useCallback(() => {
    const d = draggingRef.current;
    if (!d) return;

    const vx = clamp(
      d.releaseVel.x,
      -DRAG_MAX_RELEASE_SPEED,
      DRAG_MAX_RELEASE_SPEED,
    );
    const vy = clamp(
      d.releaseVel.y,
      -DRAG_MAX_RELEASE_SPEED,
      DRAG_MAX_RELEASE_SPEED,
    );

    const next = bodiesRef.current.map((b) => {
      if (b.id !== d.id) return b;
      if (b.destroyed) return b;
      return { ...b, vel: { x: vx, y: vy } };
    });

    draggingRef.current = null;
    bodiesRef.current = next;
    setBodies(next);
  }, [bodiesRef, setBodies]);

  const clearDraggingIf = useCallback((idSet: Set<string>) => {
    if (draggingRef.current && idSet.has(draggingRef.current.id)) {
      draggingRef.current = null;
    }
  }, []);

  const draggingId = draggingRef.current?.id ?? null;

  return {
    draggingRef,
    draggingId,
    onBodyPointerDown,
    onPlayfieldPointerMove,
    onPlayfieldPointerUp,
    clearDraggingIf,
  };
}
