# Omaha: Survive the Landing

A browser-based first-person survival prototype inspired by the Normandy landings.

## Play
https://derrickwbrownYMCA.github.io/omaha-survive-the-landing/

Enable GitHub Pages at Settings → Pages → Deploy from a branch → main / (root) if it isn't live yet.

## Current build: v3.7
- Deadlier machine guns: they pick you out more often, stay on you longer, and hit harder. Walking upright across the beach usually gets you killed; moving between obstacles and going when a gun changes belts is the way through.
- Soldiers reworked: period colours (olive helmet, tan jacket, brown trousers), a face, smaller hands and head, matte materials, slight height variation, and a lower crouch when taking cover.
- Recorded sound for machine-gun bursts, shell bursts, distant booms, rounds striking steel, surf, the boat engine and a distant battle bed. Near misses and sand/water impacts are still synthesized.
- Sixty animated soldier figures (run, crouch, stand, fall) replace the box figures; distant background figures are unchanged.
- Directed landing: shells land near the boat on the run-in, the ramp drops into machine-gun fire and the front ranks fall, and you go under as you leave the boat.
- End screen states how many men fell around you, with what happened to Company A, 116th Infantry on this sector.
- From v3.5: six machine-gun positions with fields of fire and belt changes, cover that only works close behind an obstacle, casualties, deep water, a seawall, and knockdown/concussion effects.
- Target population: 100 soldiers.

Controls: WASD movement, mouse look, Shift sprint, C crouch, E assist, R bandage, Esc pause.
Use TEST AUDIO if sound isn't playing. Chrome requires a user click to start audio.

The game depends on Three.js from an external CDN.

## Testing status
- v3.7 was syntax-checked and run in a browser through a scripted test hook (`window.__omaha`). In scripted runs at the shipped difficulty, a bot that sprints between obstacles and waits behind them reached the seawall 3 times in 8; walking straight up the beach survived 2 times in 6. Soldier appearance was checked in close-up screenshots.
- Not verified: hands-on play at this difficulty, how the soldiers look in motion, real-time frame rate, and mobile.

## Credits
- Soldier model: "Character Soldier" by Quaternius (CC0), via Poly Pizza.
- Machine gun: "Light Machine Gun" by KuraiWolf, CC-BY 4.0 — https://opengameart.org/content/light-machine-gun
- Distant explosion: "Big low frequency explosion boom" by Hansjörg Malthaner (Varkalandar), CC-BY 4.0 — https://opengameart.org/content/big-low-frequency-explosion-boom
- Engine: "Engine-loop heavy vehicle/tank" by Nayckron, CC-BY 3.0 — https://opengameart.org/content/engine-loop-heavy-vehicletank
- Metal impacts by BMacZero, cannon fire by Thimras, water waves by transitking (all CC0, OpenGameArt); "War sounds" by Dragout (CC0, Wikimedia Commons).
