// Pure, reversible scroll choreography. No timers or accumulated state.
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const between = (p, a, b) => ease((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
export function getJourneyState(progress, reducedMotion = false) {
 const p = clamp(Number.isFinite(progress) ? progress : 0);
 const points = [
  {p:0, x:69, rotation:-7, scale:1},
  {p:0.25, x:28, rotation:8, scale:0.94},
  {p:0.5, x:29, rotation:-5, scale:0.96},
  {p:0.75, x:71, rotation:6, scale:1.03},
  {p:1, x:70, rotation:0, scale:0.94}
 ];
 const index = Math.min(3, Math.floor(p * 4));
 const a = points[index], b = points[index + 1];
 const t = ease((p - a.p) / (b.p - a.p));
 return {
  x:lerp(a.x,b.x,t),
  rotation:reducedMotion ? 0 : lerp(a.rotation,b.rotation,t),
  scale:reducedMotion ? 1 : lerp(a.scale,b.scale,t),
  capLift:reducedMotion ? 0 : between(p,0.27,0.38) * (1 - between(p,0.82,0.95)),
  press:reducedMotion ? 0 : between(p,0.425,0.475) * (1 - between(p,0.50,0.55)),
  spray:reducedMotion ? 0 : between(p,0.465,0.49) * (1 - between(p,0.59,0.67)),
  reveal:reducedMotion ? 1 : between(p,0.43,0.53),
  dinner:between(p,0.1,0.2) * (1 - between(p,0.29,0.39)),
  plum:between(p,0.34,0.49) * (1 - between(p,0.78,0.95))
 };
}
