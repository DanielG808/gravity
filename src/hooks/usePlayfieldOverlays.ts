import { useCallback, useEffect, useRef, useState } from "react";

type UsePlayfieldOverlaysArgs = {
  ready: boolean;
  gameOver: boolean;
  onStart: () => void;
  gameOverDelayMs?: number;
};

export function usePlayfieldOverlays({
  ready,
  gameOver,
  onStart,
  gameOverDelayMs = 1000,
}: UsePlayfieldOverlaysArgs) {
  const hasStartedRef = useRef(false);

  const [showStart, setShowStart] = useState(false);

  const [showGameOver, setShowGameOver] = useState(false);
  const gameOverTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameOverTimeoutRef.current != null) {
      window.clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }

    if (!gameOver) {
      setShowGameOver(false);
      return;
    }

    setShowGameOver(false);
    gameOverTimeoutRef.current = window.setTimeout(() => {
      setShowGameOver(true);
      gameOverTimeoutRef.current = null;
    }, gameOverDelayMs);

    return () => {
      if (gameOverTimeoutRef.current != null) {
        window.clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
    };
  }, [gameOver, gameOverDelayMs]);

  useEffect(() => {
    const shouldShow = ready && !gameOver && !hasStartedRef.current;
    setShowStart(shouldShow);
  }, [ready, gameOver]);

  const handleStart = useCallback(() => {
    hasStartedRef.current = true;
    setShowStart(false);
    onStart();
  }, [onStart]);

  const blocked = gameOver || showStart;

  return {
    showStart,
    handleStart,
    showGameOver,
    blocked,
    hasStartedRef,
  };
}
