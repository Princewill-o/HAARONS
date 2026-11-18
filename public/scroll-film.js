import { getFilmTime } from './journey-model.mjs';

export function createScrollFilm(video, stage, motion, onFallback) {
 let progress = 0;
 let requestedFrame = -1;
 let enabled = false;
 let failed = false;

 function seek() {
  if (!enabled || !Number.isFinite(video.duration) || video.seeking || document.hidden) return;
  const time = getFilmTime(progress, video.duration);
  const frame = Math.floor(time * 24);
  if (frame === requestedFrame) return;

  requestedFrame = frame;
  // Seek just past the sample boundary, so timestamps round to the same frame
  // in both directions. Keep one request in flight during fast scrolling.
  const sampleTime = (frame + .12) / 24;
  if (Math.abs(video.currentTime - sampleTime) > .01) video.currentTime = sampleTime;
 }

 function showFrame() {
  if (enabled && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.seeking) {
   stage.classList.add('film-visible');
  }
 }

 function onFrame() {
  seek();
  showFrame();
 }

 function syncPreference() {
  enabled = !motion.matches && !failed;
  if (!enabled) {
   stage.classList.remove('film-visible');
   video.removeAttribute('src');
   requestedFrame = -1;
   // Reset the media pipeline when switching to the still presentation.
   if (video.currentSrc) video.load();
   return;
  }
  if (!video.hasAttribute('src')) video.src = video.dataset.src;
  onFrame();
 }

 video.addEventListener('loadedmetadata', seek);
 video.addEventListener('loadeddata', onFrame);
 video.addEventListener('seeked', onFrame);
 document.addEventListener('visibilitychange', onFrame);
 motion.addEventListener('change', syncPreference);
 video.addEventListener('error', () => {
  if (!enabled) return;
  failed = true;
  syncPreference();
  onFallback();
 });
 syncPreference();

 return {
  update(nextProgress) {
   progress = nextProgress;
   seek();
  },
  get enabled() { return enabled; }
 };
}
