import { useEffect, useRef } from "react";

export function useRafLoop(onFrame: (t: number, dt: number) => void) {
  const rafIdRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);

  useEffect(() => {
    function tick(t: number) {
      const last = lastTRef.current ?? t;
      const dt = Math.min(0.05, (t - last) / 1000);
      lastTRef.current = t;

      onFrame(t, dt);

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTRef.current = null;
    };
  }, [onFrame]);
}
