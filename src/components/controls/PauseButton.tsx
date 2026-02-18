import Button from "../ui/Button";

type PauseButtonProps = {
  paused: boolean;
  gameOver: boolean;
  onTogglePause: () => void;
};

export default function PauseButton({
  paused,
  gameOver,
  onTogglePause,
}: PauseButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onTogglePause}
        disabled={gameOver}
        className={[
          "w-full rounded-lg px-3 py-2 text-sm font-medium border transition",
          gameOver
            ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
            : paused
              ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
              : "border-amber-300/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15",
        ].join(" ")}
      >
        {paused ? "Resume" : "Pause"}
      </Button>
    </div>
  );
}
