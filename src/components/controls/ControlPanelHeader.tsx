type ControlPanelHeaderProps = {
  paused: boolean;
  gameOver: boolean;
};

export default function ControlPanelHeader({
  paused,
  gameOver,
}: ControlPanelHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Gravity Lab
        </div>
        <div className="text-lg font-semibold text-white/90">Control Panel</div>
      </div>

      <div
        className={[
          "text-xs px-2 py-1 rounded-md border",
          gameOver
            ? "border-rose-300/30 text-rose-200/90 bg-rose-400/10"
            : paused
              ? "border-amber-300/30 text-amber-200/90 bg-amber-400/10"
              : "border-emerald-300/25 text-emerald-200/90 bg-emerald-400/10",
        ].join(" ")}
      >
        {gameOver ? "Game Over" : paused ? "Paused" : "Running"}
      </div>
    </div>
  );
}
