import test from 'node:test';
import assert from 'node:assert/strict';
import rally from '../campaign/rally.mjs';
import chapter1 from '../campaign/ch1.mjs';
import chapter2 from '../campaign/ch2.mjs';
import chapter3 from '../campaign/ch3.mjs';
import { advance, fresh } from '../campaign/state.mjs';

const chapters = [rally, chapter1, chapter2, chapter3];

function explore(scene, initialState, chapterName) {
  const pending = [initialState];
  const visited = new Set();
  let reachedNext = 0;

  while (pending.length) {
    const state = pending.pop();
    const key = JSON.stringify(state);
    if (visited.has(key)) continue;
    visited.add(key);
    assert.ok(visited.size < 300, `${chapterName} should have a finite, bounded state graph`);

    const view = scene(state);
    assert.equal(typeof view.title, 'string', `${chapterName}/${state.node} title`);
    assert.equal(typeof view.place, 'string', `${chapterName}/${state.node} place`);
    assert.ok(view.art.trim(), `${chapterName}/${state.node} has artwork`);
    assert.match(view.art, /<(?:rect|path|circle|g|defs|ellipse|polygon|line|polyline)\b/i,
      `${chapterName}/${state.node} artwork contains SVG markup`);
    assert.ok(Array.isArray(view.actions), `${chapterName}/${state.node} has actions`);

    for (const action of view.actions) {
      assert.equal(typeof action.label, 'string', `${chapterName}/${state.node} action label`);
      assert.ok(action.label.trim(), `${chapterName}/${state.node} action is labeled`);
      assert.equal(typeof action.to, 'string', `${chapterName}/${state.node} action target`);
      if (action.to === '@next') {
        reachedNext++;
        const next = advance(state, action);
        assert.equal(next.chapter, state.chapter + 1, `${chapterName} @next advances one chapter`);
        assert.equal(next.node, 'start', `${chapterName} @next resets the node`);
        for (const [fact, value] of Object.entries(state)) {
          if (fact !== 'chapter' && fact !== 'node' && !(fact in (action.set || {}))) {
            assert.deepEqual(next[fact], value, `${chapterName} retains ${fact}`);
          }
        }
      } else {
        const next = advance(state, action);
        assert.equal(next.chapter, state.chapter, `${chapterName} local action stays in chapter`);
        assert.equal(next.node, action.to, `${chapterName} follows its local target`);
        pending.push(next);
      }
    }

    if (chapterName === 'Chapter 3' && state.node === 'roll') {
      const complete = view.actions.some(action => action.to === 'complete');
      assert.equal(complete, Boolean(state.rollCall?.Ellis && state.rollCall?.Bell && state.rollCall?.Lane),
        'roll completion is offered if and only if all three names are checked');
      if (!state.laneFound) assert.ok(!state.rollCall?.Lane, 'Lane cannot be checked before being found');
    }
  }

  assert.ok(reachedNext > 0, `${chapterName} has a reachable chapter-completion action`);
  return visited;
}

function choose(scene, state, target, context) {
  const action = scene(state).actions.find(item => item.to === target);
  assert.ok(action, `${context}: expected action to ${target}`);
  return advance(state, action);
}

test('campaign chapter graphs are complete, finite, and preserve state', () => {
  const initial = fresh();
  for (const [index, scene] of chapters.entries()) {
    const chapter = index;
    explore(scene, { ...initial, chapter, node: 'start' }, `Chapter ${chapter}`);
  }
});

test('all 16 rally, village, route, and roll-entry combinations preserve continuity through chapter 4', () => {
  let combinations = 0;
  for (const helped of [false, true]) {
    for (const firstVisit of ['farm', 'church']) {
      for (const route of ['together', 'split']) {
        for (const rollEntry of ['orchard', 'roll']) {
          combinations++;
          const companion = firstVisit === 'farm' ? 'Ellis' : 'Bell';
          const other = firstVisit === 'farm' ? 'Bell' : 'Ellis';
          let state = fresh();

          const rallyChoice = rally(state).actions.find(action => action.to === 'tower' && action.set?.helped === helped);
          assert.ok(rallyChoice, `rally offers helped=${helped}`);
          state = advance(state, rallyChoice);
          assert.equal(state.helped, helped, 'rally choice persists the exact help fact');
          state = choose(rally, state, 'look', 'rally downhill return is available');
          state = choose(rally, state, 'tower', 'downhill view returns to rally');
          state = choose(rally, state, '@next', 'rally enters village');
          assert.equal(state.chapter, 1);

          state = choose(chapter1, state, firstVisit, `village first visit ${firstVisit}`);
          assert.equal(state.companion, companion, 'first village visit persists the chosen companion');
          const exit = chapter1(state).actions.find(action => action.to === 'village-exit');
          assert.ok(exit, 'visited location can leave the village');
          state = advance(state, exit);
          state = choose(chapter1, state, '@next', 'village exits into road');
          assert.equal(state.companion, companion, 'companion persists into the road');
          assert.equal(state.helped, helped, 'help fact persists from the rally');

          state = choose(chapter2, state, route === 'together' ? 'long-road' : 'split-path', `${route} route`);
          assert.equal(state.route, route, 'the selected route persists exactly');
          if (route === 'together') {
            state = choose(chapter2, state, 'ridge', 'long road reaches ridge');
            state = choose(chapter2, state, 'orchard', 'ridge reaches far-bank orchard');
            state = choose(chapter2, state, 'reunited', 'orchard reaches reunion');
          } else {
            state = choose(chapter2, state, 'meeting-place', 'split path reaches gate');
            state = choose(chapter2, state, 'signal', 'gate offers the signal');
            state = choose(chapter2, state, 'reunited', 'signal reaches reunion');
          }
          const arrival = chapter2(state);
          assert.match(arrival.body, route === 'together' ? /side by side/i : /signal and the answering wave/i,
            'arrival narration reflects the selected route');
          state = choose(chapter2, state, '@next', 'road enters roll call chapter');

          const opening = chapter3(state).body;
          assert.ok(opening.includes(other), `the other friend ${other} is present in the schoolhouse arrival`);
          assert.match(opening, route === 'together' ? /longer road/i : /rendezvous/i,
            'schoolhouse arrival reflects the selected route');
          state = choose(chapter3, state, rollEntry, `roll entry ${rollEntry}`);
          if (rollEntry === 'orchard') {
            state = choose(chapter3, state, 'roll', 'orchard entry returns to roll call');
          } else {
            state = choose(chapter3, state, 'orchard', 'roll entry allows search for Lane');
            state = choose(chapter3, state, 'roll', 'orchard search returns to roll call');
          }
          assert.equal(state.laneFound, true, 'finding Lane is persisted');
          assert.equal(chapter3(state).actions.some(action => action.set?.rollCall?.Lane), true,
            'Lane can be checked after being found');
          for (const person of ['Ellis', 'Bell', 'Lane']) {
            const check = chapter3(state).actions.find(action => action.set?.rollCall?.[person]);
            assert.ok(check, `${person} can be checked`);
            state = advance(state, check);
          }
          state = choose(chapter3, state, 'complete', 'all names unlock completion');
          state = choose(chapter3, state, '@next', 'completed roll call reaches chapter 4');
          assert.equal(state.chapter, 4, 'campaign progress ends at chapter 4');
          assert.equal(state.companion, companion);
          assert.equal(state.route, route);
          assert.equal(state.helped, helped);
        }
      }
    }
  }
  assert.equal(combinations, 16);
});

test('Chapter 3 roll-call gate stays closed until each person is accounted for', () => {
  let state = { ...fresh(), chapter: 3, node: 'roll', laneFound: false };
  let view = chapter3(state);
  assert.ok(!view.actions.some(action => action.to === 'complete'));
  assert.ok(!view.actions.some(action => action.set?.rollCall?.Lane));

  state = { ...state, laneFound: true };
  for (const name of ['Ellis', 'Bell', 'Lane']) {
    view = chapter3(state);
    assert.ok(!view.actions.some(action => action.to === 'complete'), 'completion stays gated before the final check');
    const check = view.actions.find(action => action.set?.rollCall?.[name]);
    assert.ok(check, `${name} can be checked`);
    const expected = { ...(state.rollCall || {}), [name]: true };
    state = advance(state, check);
    assert.deepEqual(state.rollCall, expected, 'checking one name preserves earlier checks without inventing unchecked names');
  }
  view = chapter3(state);
  assert.ok(view.actions.some(action => action.to === 'complete'));
  const complete = advance(state, view.actions.find(action => action.to === 'complete'));
  assert.equal(chapter3(complete).actions[0].to, '@next');
});
