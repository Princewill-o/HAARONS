// Pure, reversible scroll choreography. No timers or accumulated state.
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const between = (p, a, b) => ease((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;

// Each row frames a shot at a position in the story, so reverse scroll retraces it.
// Progress, screen X, roll, yaw, camera distance, focal height, elevation
const shots = [
 [0,    69, -6, -.20, 10.2, .16, .04],
 [.10,  69, -6, -.20, 10.2, .16, .04],
 [.19,  43, -2,  .04,  8.4, .67, .12],
 [.26,  34,  2,  .19,  5.2, 1.09, .27],
 [.35,  31,  3,  .10,  2.9, 1.27, .56],
 [.43,  30,  0, -.14,  4.9, 1.21, .19],
 [.50,  29, -2, -.24,  4.1, 1.14, .22],
 [.535, 30,  0, -.14,  1.4, 1.23, .86],
 [.65,  54,  0,  .05,  1.4, 1.23, .86],
 [.75,  67,  0,  .05,  1.4, 1.23, .86],
 [.88,  70,  0, -.24,  1.4, 1.23, .86],
 [.98,  70,  0, -.17, 10.2, .16, .04],
 [1,    70,  0, -.17, 10.2, .16, .04]
];

export function getJourneyState(progress, reducedMotion = false) {
 const p = clamp(Number.isFinite(progress) ? progress : 0);
 const index = Math.max(1, shots.findIndex(shot => shot[0] >= p));
 const a = shots[index - 1], b = shots[index];
 const t = between(p, a[0], b[0]);
 const shot = (column, still) => reducedMotion ? still : lerp(a[column], b[column], t);
 const inside = !reducedMotion && p >= .535 && p < .89;
 const dissolve = Math.max(
  between(p, .520, .535) * (1 - between(p, .535, .548)),
  between(p, .875, .89) * (1 - between(p, .89, .906))
 );
 return {
  x:shot(1, 69),
  rotation:shot(2, 0),
  yaw:shot(3, -.15),
  distance:shot(4, 10.2),
  focus:shot(5, .16),
  elevation:shot(6, 0),
  scale:1,
  capLift:reducedMotion ? 0 : between(p,.10,.24) * (1 - between(p,.89,.97)),
  press:reducedMotion ? 0 : between(p,0.425,0.475) * (1 - between(p,0.50,0.55)),
  spray:reducedMotion ? 0 : between(p,.465,.49) * (1 - between(p,.503,.535)),
  reveal:reducedMotion ? 1 : between(p,0.43,0.53),
  dinner:between(p,0.1,0.2) * (1 - between(p,0.29,0.39)),
  plum:.38 * between(p,0.34,0.49) * (1 - between(p,0.78,0.95)),
  inside:Number(inside),
  macroProgress:reducedMotion ? 0 : clamp((p - .535) / (.89 - .535)),
  dissolve:reducedMotion ? 0 : dissolve,
 };
}
