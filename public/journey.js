import { getJourneyState } from './journey-model.mjs';

const journey = document.querySelector('.scent-journey');
if (journey) {
 const stage = journey.querySelector('.journey-stage');
 const bottle = journey.querySelector('.travelling-bottle');
 const chapters = [...journey.querySelectorAll('.journey-chapter')];
 const links = [...journey.querySelectorAll('.journey-rail a')];
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile = window.matchMedia('(max-width: 720px)');
 const replay = journey.querySelector('.spray-replay');
 let frame = 0, active = true, replayTimer, bottle3D;
 import('./bottle-3d.js').then(({createBottle3D}) => {
  bottle3D = createBottle3D(bottle, journey, motion);
  schedule();
 }).catch(() => { bottle.dataset.renderer = 'fallback'; });
 let top = 0, distance = 1;
 const particles = journey.querySelector('.mist-particles');
 // A bounded number of composited particles; nothing new is allocated on scroll.
 for (let i = 0; i < 36; i++) {
  const particle = document.createElement('i');
  const angle = ((i * 137.508) % 64 - 32) * Math.PI / 180;
  const reach = 120 + ((i * 67) % 420);
  particle.style.setProperty('--dx', `${Math.cos(angle) * reach}px`);
  particle.style.setProperty('--dy', `${Math.sin(angle) * reach}px`);
  particle.style.setProperty('--delay', `${(i % 9) * 0.045}s`);
  particle.style.setProperty('--size', `${2 + i % 4}px`);
  particles.append(particle);
 }
 function measure() {
  top = journey.getBoundingClientRect().top + window.scrollY;
  distance = Math.max(1, journey.offsetHeight - window.innerHeight);
  schedule();
 }
 function paint() {
  frame = 0;
  const p = Math.max(0, Math.min(1, (window.scrollY - top) / distance));
  const state = getJourneyState(p, motion.matches);
  const x = mobile.matches ? 50 : motion.matches ? 69 : state.x;
  bottle.style.setProperty('--bottle-x', `${x}%`);
  stage.style.setProperty('--lens-x', `${x}%`);
  bottle3D?.update(state, p);
  bottle.style.setProperty('--rotation', `${state.rotation}deg`);
  bottle.style.setProperty('--scale', state.scale);
  bottle.style.setProperty('--cap-lift', `${state.capLift * -165}px`);
  bottle.style.setProperty('--cap-turn', `${state.capLift * -18}deg`);
  bottle.style.setProperty('--cap-opacity', 1 - state.capLift * 0.65);
  bottle.style.setProperty('--press', `${state.press * 9}px`);
  stage.style.setProperty('--mist', state.spray);
  stage.style.setProperty('--dinner', state.dinner);
  stage.style.setProperty('--plum', state.plum);
  stage.style.setProperty('--reveal', state.reveal);
  stage.classList.toggle('is-spraying', state.spray > 0.02 && !motion.matches);
  journey.classList.toggle('notes-released', state.reveal > 0.08 || motion.matches);
  journey.classList.toggle('motion-reduced', motion.matches);
  const current = Math.min(chapters.length - 1, Math.round(p * (chapters.length - 1)));
  chapters.forEach((chapter, i) => chapter.classList.toggle('is-current', i === current));
  links.forEach((link, i) => {
   if (i === current) link.setAttribute('aria-current', 'step');
   else link.removeAttribute('aria-current');
  });
  journey.querySelector('.journey-count').textContent = `0${current + 1} / 05`;
  journey.querySelector('.journey-progress').style.transform = `scaleX(${p})`;
 }
 function schedule() { if (!frame && active) frame = requestAnimationFrame(paint); }
 // Stop doing work once the bottle has left its story container.
 const observer = new IntersectionObserver(([entry]) => {
  active = entry.isIntersecting;
  if (active) measure();
 }, {rootMargin:'100px'});
 observer.observe(journey);
 window.addEventListener('scroll', schedule, {passive:true});
 let previousWidth = window.innerWidth;
 window.addEventListener('resize', () => {
  // Mobile browser chrome changes height without changing composition.
  if (mobile.matches && previousWidth === window.innerWidth) return;
  previousWidth = window.innerWidth;
  measure();
 }, {passive:true});
 window.addEventListener('orientationchange', () => requestAnimationFrame(measure));
 window.addEventListener('pageshow', measure);
 motion.addEventListener('change', measure);
 mobile.addEventListener('change', measure);
 replay.addEventListener('click', () => {
  if (motion.matches) return;
  bottle3D?.replay();
  clearTimeout(replayTimer);
  stage.classList.remove('replay-spray');
  void stage.offsetWidth;
  stage.classList.add('replay-spray');
  replayTimer = setTimeout(() => stage.classList.remove('replay-spray'), 1800);
 });
 document.documentElement.classList.add('journey-ready');
 measure();
}

// Two locally compressed, muted videos overlap briefly so a slow decode never
// exposes the final frame. The outgoing video loops until its successor is ready.
const videoDeck = [...document.querySelectorAll('.perfume-backdrop')];
if (videoDeck.length === 2) {
 const sources = ['assets/videos/perfume-0.mp4','assets/videos/perfume-1.mp4','assets/videos/perfume-2.mp4'];
 const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
 let active = videoDeck[0], standby = videoDeck[1], currentIndex = 0, timer = 0, preparing = false;
 const setSource = (video, source) => {
  if (video.dataset.source === source) return;
  video.dataset.source = source;
  video.src = source;
  video.load();
 };
 const play = video => video.play().catch(() => {});
 const prepareNext = () => {
  if (preparing || motionPreference.matches || document.hidden) return;
  preparing = true;
  const nextIndex = (currentIndex + 1) % sources.length;
  setSource(standby, sources[nextIndex]);
  standby.currentTime = 0;
  const switchWhenReady = () => {
   if (motionPreference.matches || document.hidden || standby.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {preparing=false;return;}
   standby.classList.add('is-active');
   play(standby);
   const outgoing = active;
   active = standby; standby = outgoing; currentIndex = nextIndex; preparing = false;
   window.setTimeout(() => {
    outgoing.pause();
    outgoing.classList.remove('is-active');
    const upcoming = sources[(currentIndex + 1) % sources.length];
    setSource(outgoing, upcoming);
    outgoing.currentTime = 0;
   }, 650);
   scheduleNext();
  };
  if (standby.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) switchWhenReady();
  else {
   standby.addEventListener('canplay', switchWhenReady, {once:true});
   standby.addEventListener('error', () => {preparing=false;}, {once:true});
  }
 };
 const scheduleNext = () => {
  window.clearTimeout(timer);
  if (motionPreference.matches || document.hidden) return;
  const remaining = Number.isFinite(active.duration) ? Math.max(300, (active.duration - active.currentTime - .55) * 1000) : 3200;
  timer = window.setTimeout(prepareNext, remaining);
 };
 videoDeck.forEach(video => {
  video.muted = true; video.playsInline = true; video.loop = true;
  video.addEventListener('playing', scheduleNext);
  video.addEventListener('stalled', () => {if(video===active) scheduleNext();});
  video.addEventListener('error', () => {if(video===active) prepareNext();});
 });
 setSource(active, sources[0]);
 play(active);
 active.addEventListener('loadedmetadata', scheduleNext, {once:true});
 document.addEventListener('visibilitychange', () => {
  window.clearTimeout(timer);
  if (document.hidden) videoDeck.forEach(video=>video.pause());
  else {play(active);scheduleNext();}
 });
 motionPreference.addEventListener('change', () => {
  window.clearTimeout(timer);
  if (motionPreference.matches) videoDeck.forEach(video=>video.pause());
  else {play(active);scheduleNext();}
 });
}
