// Peripheral positions keep the central destinations clear. No random startup jumps.
export const CLOUDS = [
  [-22, 8, -17, 13, 5, 0.7],
  [17, 11, -24, 12, 4.5, 2.4],
  [-25, 5, 7, 10, 3.5, 4.1],
  [25, 7, 12, 12, 4, 1.5],
  [3, 8, 25, 11, 3.5, 5.2],
  [-4, 9, -25, 10, 4, 3.3],
];

export function advanceCloudTime(time, delta, paused) {
  return paused ? time : time + Math.min(Math.max(delta, 0), 0.05);
}

export function cloudOffset(time, phase) {
  return [Math.sin(time * 0.025 + phase) * 3,
    Math.sin(time * 0.016 + phase) * 0.18,
    Math.cos(time * 0.019 + phase) * 1.1];
}
