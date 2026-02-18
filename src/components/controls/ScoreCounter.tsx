type ScoreCounterProps = {
  score: number;
};

export default function ScoreCounter({ score }: ScoreCounterProps) {
  return (
    <div className="flex w-full">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 w-full">
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Score
        </div>
        <div className="mt-1 text-2xl font-semibold text-white/90">{score}</div>
      </div>
    </div>
  );
}
