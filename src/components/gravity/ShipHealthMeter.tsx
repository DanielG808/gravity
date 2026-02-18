type ShipHealthMeterProps = {
  pct: number;
  shipHP: number;
  shipMaxHP: number;
  shipInvulnerable: boolean;
};

export default function ShipHealthMeter({
  pct,
  shipHP,
  shipMaxHP,
  shipInvulnerable,
}: ShipHealthMeterProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Ship HP
        </div>

        <div
          className={[
            "text-xs font-mono text-white/80",
            shipInvulnerable ? "text-cyan-200/90" : "",
          ].join(" ")}
        >
          {shipHP} / {shipMaxHP}
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={[
            "h-full transition-[width] duration-150",
            shipInvulnerable ? "bg-cyan-300/70" : "bg-rose-400/80",
          ].join(" ")}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-white/40 font-mono">
        <span>0</span>
        <span>{shipMaxHP}</span>
      </div>
    </div>
  );
}
