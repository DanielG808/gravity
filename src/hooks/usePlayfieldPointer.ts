import { useCallback, useEffect, useState } from "react";

export type PlayfieldPointer = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  inside: boolean;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

type Options = {
  clampToBounds?: boolean;
};
export function usePlayfieldPointer<T extends HTMLElement>(
  playfieldRef: React.RefObject<T | null>,
  opts: Options = {},
) {
  const { clampToBounds = true } = opts;

  const [pointer, setPointer] = useState<PlayfieldPointer>({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    inside: false,
  });

  const compute = useCallback(
    (clientX: number, clientY: number) => {
      const el = playfieldRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);

      let x = clientX - r.left;
      let y = clientY - r.top;

      const inside = x >= 0 && x <= w && y >= 0 && y <= h;

      if (clampToBounds) {
        x = clamp(x, 0, w);
        y = clamp(y, 0, h);
      }

      const nx = clamp(x / w, 0, 1);
      const ny = clamp(y / h, 0, 1);

      setPointer({ x, y, nx, ny, inside });
    },
    [playfieldRef, clampToBounds],
  );

  useEffect(() => {
    const el = playfieldRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => compute(e.clientX, e.clientY);
    const onLeave = () =>
      setPointer((p) => ({
        ...p,
        inside: false,
      }));

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [playfieldRef, compute]);

  return pointer;
}
