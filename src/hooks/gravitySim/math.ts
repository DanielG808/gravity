export function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `b_${Math.random().toString(16).slice(2)}`
  );
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function mag(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function massToRadius(mass: number) {
  const m = Math.max(1, mass);
  return Math.max(4, Math.sqrt(m) * 6);
}
