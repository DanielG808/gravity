import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type Bounds = { w: number; h: number };

type UseElementBoundsArgs = {
  ref: React.RefObject<HTMLElement | null>;
  resetNonce?: number;
  onBoundsChange?: (b: Bounds) => void;
};

export function useElementBounds({
  ref,
  resetNonce,
  onBoundsChange,
}: UseElementBoundsArgs) {
  const boundsRef = useRef<Bounds>({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = { w: r.width, h: r.height };
    boundsRef.current = next;
    onBoundsChange?.(next);
  }, [ref, onBoundsChange]);

  useLayoutEffect(() => {
    measure();
  }, [measure, resetNonce]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    const onWin = () => measure();
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [ref, measure]);

  return { boundsRef, measure };
}
