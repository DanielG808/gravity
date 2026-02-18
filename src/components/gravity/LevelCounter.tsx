type LevelCounterProps = {
  lvl: number | null;
  prog: number | null;
  goal: number | null;
  levelPct: number | null;
  levelMaxActiveBodies: number | undefined;
};

export default function LevelCounter({
  lvl,
  prog,
  goal,
  levelPct,
  levelMaxActiveBodies,
}: LevelCounterProps) {
  const pct = levelPct ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Level
        </div>
        <div className="text-xs font-mono text-white/80">
          {lvl != null ? `Lv ${lvl}` : "—"}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/45 font-mono">
        <span>{prog != null ? prog : "—"}</span>
        <span>{goal != null ? goal : "—"}</span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full transition-[width] duration-150 bg-cyan-300/70"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-2 text-[10px] text-white/45 font-mono">
        Max active bodies:{" "}
        {typeof levelMaxActiveBodies === "number" ? levelMaxActiveBodies : "—"}
      </div>
    </div>
  );
}
