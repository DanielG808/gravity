export default function CopyrightStatement() {
  return (
    <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/70 leading-relaxed">
        &copy;{new Date().getFullYear()} Gravity Labs. All rights reserved.
      </div>
    </div>
  );
}
