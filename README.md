# Omaha: Survive the Landing

A browser-based first-person survival prototype inspired by the Normandy landings.

## Play
https://derrickwbrownYMCA.github.io/omaha-survive-the-landing/

Enable GitHub Pages at Settings → Pages → Deploy from a branch → main / (root) if it isn't live yet.

## Current build: v3.5
- Six machine-gun positions on the bluff, each with its own field of fire. They fire bursts, walk their fire, pause, and go quiet for several seconds to change belts. Tracers travel from the gun to the impact point; rounds kick up sand or water.
- Beach obstacles stop fire only for someone close behind them. Crouching makes you a smaller target.
- Soldiers and background figures are hit by gunfire and shell bursts, fall, and stay down; others go to ground when fire lands near them.
- The landing craft now drives in under fire, and the ramp drops into a burst.
- Deep water off the ramp: wading is slow and drains stamina; running out of stamina means going under.
- A seawall at the base of the bluffs where survivors gather.
- Near shell bursts knock you down, blur vision, and dull hearing. Suppression and wounds narrow vision; a leg wound causes a limp.
- Gun reports come from each gun's direction with a speed-of-sound delay. Ambient un-located gunfire is quieter and rarer.
- Target population: 100 soldiers. Audio is browser-generated, not recorded samples.

Controls: WASD movement, mouse look, Shift sprint, C crouch, E assist, R bandage, Esc pause.
Use TEST AUDIO if sound isn't playing. Chrome requires a user click to start audio.

The game depends on Three.js from an external CDN.

## Testing status
- v3.5 was syntax-checked and run in a browser through a scripted test hook (`window.__omaha`, which can step the simulation and hold keys). Scripted runs covered the boat run-in, wading ashore, crossing the beach upright, zigzag sprinting and crouched, and a shell burst next to the player.
- Not verified: how it feels in real-time hands-on play, frame rate on real hardware, how the audio actually sounds, and mobile.
- Difficulty is a first pass. In scripted runs most crossings survived with 75–100 health; it likely needs tuning after real play.
