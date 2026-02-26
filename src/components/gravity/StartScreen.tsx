import Button from "../ui/Button";

type StartScreenProps = {
  showStart: boolean;
  handleStart: () => void;
};

export default function StartScreen({
  showStart,
  handleStart,
}: StartScreenProps) {
  return showStart ? (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="text-center px-6">
        <div className="text-xs tracking-[0.25em] uppercase text-white/60">
          Status
        </div>
        <div className="mt-2 text-4xl font-semibold text-white/95">Ready</div>
        <div className="mt-3 text-sm text-white/70">
          Move the mouse to navigate and left-click to fire your blaster. Click
          start when ready.
        </div>

        <Button
          type="button"
          onClick={handleStart}
          className="mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 transition"
        >
          Start
        </Button>
      </div>
    </div>
  ) : null;
}
