import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyWave } from './continuity.mjs';

const signal = 10, actor = {}, other = {};
function trace(peak, extra = []) {
  const reply = {signal, start:10.65, actor:1, posed:null, angle:0};
  globalThis.window = {__omaha:{soldiers:[{},actor,other]}, waveCast:[{},actor], waveTrace:[
    {time:10.1,replies:[reply]},
    {time:11.35,replies:[{...reply,posed:10.7,angle:peak},...extra]}
  ]};
}
test('an event flag without visible neck rotation is not a response', () => {
  trace(0); assert.throws(() => verifyWave(signal));
});
test('only the delayed pose of the observed neighbor counts', () => {
  trace(.35); assert.equal(verifyWave(signal).angle,.35);
  trace(.35,[{actor:2,signal,start:10.7,posed:10.8,angle:.3}]);
  assert.throws(() => verifyWave(signal));
});
