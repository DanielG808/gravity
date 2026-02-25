import { rand } from "./math";

export function randColor() {
  const roll = Math.random();

  if (roll < 0.22) {
    const light = Math.floor(rand(86, 97));
    const sat = Math.floor(rand(0, 12));
    return `hsl(0 ${sat}% ${light}%)`;
  }

  if (roll < 0.34) {
    const hue = Math.floor(rand(180, 270));
    const sat = Math.floor(rand(65, 90));
    const light = Math.floor(rand(55, 72));
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  const hue = Math.floor(rand(0, 360));
  const sat = Math.floor(rand(55, 95));
  const light = Math.floor(rand(48, 72));
  return `hsl(${hue} ${sat}% ${light}%)`;
}
