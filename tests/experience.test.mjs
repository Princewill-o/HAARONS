import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getJourneyState } from '../public/journey-model.mjs';

test('bottle opens, presses and releases mist at the middle of the story', () => {
 const start = getJourneyState(0);
 assert.equal(start.capLift, 0);
 assert.equal(start.press, 0);
 assert.equal(start.spray, 0);
 const opening = getJourneyState(0.38);
 assert.equal(opening.capLift, 1);
 const middle = getJourneyState(0.49);
 assert.ok(middle.press > 0.5);
 assert.ok(middle.spray > 0);
 assert.ok(getJourneyState(0.62).reveal > 0.95);
});
test('reverse scrolling restores the closed bottle and no mist', () => {
 getJourneyState(0.8);
 assert.deepEqual(getJourneyState(0), getJourneyState(-1));
 assert.equal(getJourneyState(0).capLift, 0);
});
test('the cap clears the shoulder before the camera enters the liquid', () => {
 const arrival = getJourneyState(0);
 const opening = getJourneyState(.19);
 const neck = getJourneyState(.35);
 const entry = getJourneyState(.535);
 assert.ok(opening.capLift > 0);
 assert.ok(neck.distance < opening.distance && opening.distance < arrival.distance);
 assert.ok(neck.elevation > opening.elevation);
 assert.equal(neck.inside, 0);
 assert.equal(entry.inside, 1);
 assert.equal(entry.dissolve, 1);
 assert.ok(getJourneyState(.8).macroProgress > getJourneyState(.6).macroProgress);
 assert.equal(getJourneyState(.98).inside, 0);
 assert.deepEqual(getJourneyState(.535), entry);
});
test('out-of-range and invalid input produce finite, bounded motion', () => {
 for (const progress of [-10, 0, 0.3, 0.5, 1, 10, NaN, Infinity]) {
  const state = getJourneyState(progress);
  for (const value of Object.values(state)) assert.ok(Number.isFinite(value));
  for (const key of ['capLift', 'press', 'spray', 'reveal']) assert.ok(state[key] >= 0 && state[key] <= 1);
 }
});
test('reduced motion keeps the label upright and reveals all information', () => {
 for (const progress of [0, 0.5, 1]) {
  const state = getJourneyState(progress, true);
  assert.equal(state.rotation, 0);
  assert.equal(state.capLift, 0);
  assert.equal(state.press, 0);
  assert.equal(state.spray, 0);
  assert.equal(state.reveal, 1);
  assert.equal(state.inside, 0);
  assert.equal(state.dissolve, 0);
  assert.equal(state.distance, 10.2);
 }
});
