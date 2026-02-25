"use client";

import type { PointerEvent, RefObject } from "react";
import { useCallback, useMemo, useState } from "react";

export type PlayfieldPointer = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  inside: boolean;
};

type BoundsRef = { current: { w: number; h: number } };

type UsePlayfieldPointerArgs = {
  ref: RefObject<HTMLElement | null>;
  boundsRef: BoundsRef;
  blocked: boolean;

  onPointerChange: (p: { x: number; y: number; inside: boolean }) => void;

  onPlayfieldPointerDown: (at: {
    x: number;
    y: number;
  }) => (e: PointerEvent) => void;
  onPlayfieldPointerMove: (at: { x: number; y: number }) => void;
  onPlayfieldPointerUp: () => void;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function toPointer(
  x: number,
  y: number,
  inside: boolean,
  w: number,
  h: number,
): PlayfieldPointer {
  const nx = w > 0 ? clamp((x / w) * 2 - 1, -1, 1) : 0;
  const ny = h > 0 ? clamp((y / h) * 2 - 1, -1, 1) : 0;
  return { x, y, nx, ny, inside };
}

export function usePlayfieldPointer({
  ref,
  boundsRef,
  blocked,
  onPointerChange,
  onPlayfieldPointerDown,
  onPlayfieldPointerMove,
  onPlayfieldPointerUp,
}: UsePlayfieldPointerArgs) {
  const [pointer, setPointer] = useState<PlayfieldPointer>({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    inside: false,
  });

  const toLocal = useCallback(
    (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return { x, y, w: r.width, h: r.height };
    },
    [ref],
  );

  const applyPointer = useCallback(
    (p: { x: number; y: number; inside: boolean }) => {
      const { w, h } = boundsRef.current;
      const next = toPointer(p.x, p.y, p.inside, w, h);
      setPointer(next);
      onPointerChange({ x: next.x, y: next.y, inside: next.inside });
    },
    [boundsRef, onPointerChange],
  );

  const handlers = useMemo(
    () => ({
      onPointerDown: (e: PointerEvent) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
        onPlayfieldPointerDown({ x: p.x, y: p.y })(e);
      },
      onPointerMove: (e: PointerEvent) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
        onPlayfieldPointerMove({ x: p.x, y: p.y });
      },
      onPointerEnter: (e: PointerEvent) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
      },
      onPointerLeave: () => {
        applyPointer({ x: 0, y: 0, inside: false });
      },
      onPointerUp: () => {
        if (blocked) return;
        onPlayfieldPointerUp();
      },
      onPointerCancel: () => {
        if (blocked) return;
        onPlayfieldPointerUp();
      },
    }),
    [
      blocked,
      toLocal,
      applyPointer,
      onPlayfieldPointerDown,
      onPlayfieldPointerMove,
      onPlayfieldPointerUp,
    ],
  );

  return { pointer, toLocal, applyPointer, handlers };
}
