type GameOverScreenProps = {
  gameOver: boolean;
  showGameOver: boolean;
  onRestart: () => void;
};

export default function GameOverScreen({
  gameOver,
  showGameOver,
  onRestart,
}: GameOverScreenProps) {
  return gameOver ? (
    <div
      className={[
        "absolute inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm",
        "transition-opacity duration-1000 ease-out",
        showGameOver
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="text-center px-6">
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Status
        </div>
        <div className="mt-2 text-4xl font-semibold text-white/95">
          Game Over
        </div>
        <div className="mt-3 text-sm text-white/70">
          Your ship has been destroyed.
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 transition"
        >
          Restart
        </button>
      </div>
    </div>
  ) : null;
}
