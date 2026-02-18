type GravityMeterProps = {
  gravityStrength: number;
  gravityPct: number;
  gravityMin: number;
  gravityMax: number;
};

export default function GravityMeter({
  gravityStrength,
  gravityPct,
  gravityMin,
  gravityMax,
}: GravityMeterProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Gravity Strength
        </div>
        <div className="text-xs font-mono text-white/80">
          {gravityStrength.toFixed(2)}x
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full transition-[width] duration-300 bg-cyan-300/70"
          style={{ width: `${gravityPct * 100}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-white/40 font-mono">
        <span>{gravityMin.toFixed(2)}</span>
        <span>{gravityMax.toFixed(2)}</span>
      </div>
    </div>
  );
}
