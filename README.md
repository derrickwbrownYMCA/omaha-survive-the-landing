# Omaha: Survive the Landing

A browser-based first-person survival prototype inspired by the Normandy landings.

## Play
https://derrickwbrownYMCA.github.io/omaha-survive-the-landing/

Enable GitHub Pages at Settings → Pages → Deploy from a branch → main / (root) if it isn't live yet.

## Current build: v3.8
- The seawall is now the halfway point, not the end. There are no enemy soldiers in the game: the player suppresses and silences guns.
- Rifle: left-click or F (FIRE on mobile). Eight rounds, then an automatic reload. Rounds on a bunker's firing slit make that gun stop for a few seconds; firing also draws its attention. You cannot shoot from deep water.
- At the seawall you are safe crouched and exposed standing. An engineer crawls a Bangalore torpedo up to the wire; covering fire on the nearby guns makes him about three times faster. If he is hit, another man takes over.
- When the wire blows, a gap opens in the wall. Climb the bluff, get to the side of the bunker, and throw a grenade (G, or FIRE when close). The gun goes silent and the run ends.
- Soldiers now carry kit built in code: a rounded steel-helmet shell, a field pack with bedroll, and a wood-and-dark-metal rifle. The corner panel follows the new stages, and bunkers are solid.
- Deadlier machine guns: they pick you out more often, stay on you longer, and hit harder. Walking upright across the beach usually gets you killed; moving between obstacles and going when a gun changes belts is the way through.
- Soldiers reworked: period colours (olive helmet, tan jacket, brown trousers), a face, smaller hands and head, matte materials, slight height variation, and a lower crouch when taking cover.
- Recorded sound for machine-gun bursts, shell bursts, distant booms, rounds striking steel, surf, the boat engine and a distant battle bed. Near misses and sand/water impacts are still synthesized.
- Sixty animated soldier figures (run, crouch, stand, fall) replace the box figures; distant background figures are unchanged.
- Directed landing: shells land near the boat on the run-in, the ramp drops into machine-gun fire and the front ranks fall, and you go under as you leave the boat.
- End screen states how many men fell around you, with what happened to Company A, 116th Infantry on this sector.
- From v3.5: six machine-gun positions with fields of fire and belt changes, cover that only works close behind an obstacle, casualties, deep water, a seawall, and knockdown/concussion effects.
- Target population: 100 soldiers.

Controls: WASD movement, mouse look, left-click or F fire, G grenade, Shift sprint, C crouch, E assist, R bandage, Esc pause.
Use TEST AUDIO if sound isn't playing. Chrome requires a user click to start audio.

The game depends on Three.js from an external CDN.

## Testing status
- v3.8 was syntax-checked and run in a browser through a scripted test hook (`window.__omaha`). A scripted run completed the whole sequence: reached the wall and was stopped by it, suppressed the gun, the wire blew after 17 s of covering fire, climbed through the gap, threw the grenade, got the end screen, and restarted with the wall and wire restored.
- The crossing difficulty from v3.7 is unchanged (scripted cover-using bot reached the wall 3 times in 8).
- Not verified: hands-on play, aiming by mouse, the mobile FIRE button, how the new sections look in motion, frame rate.

## Credits
- Soldier model: "Character Soldier" by Quaternius (CC0), via Poly Pizza.
- Machine gun: "Light Machine Gun" by KuraiWolf, CC-BY 4.0 — https://opengameart.org/content/light-machine-gun
- Distant explosion: "Big low frequency explosion boom" by Hansjörg Malthaner (Varkalandar), CC-BY 4.0 — https://opengameart.org/content/big-low-frequency-explosion-boom
- Engine: "Engine-loop heavy vehicle/tank" by Nayckron, CC-BY 3.0 — https://opengameart.org/content/engine-loop-heavy-vehicletank
- Metal impacts by BMacZero, cannon fire by Thimras, water waves by transitking (all CC0, OpenGameArt); "War sounds" by Dragout (CC0, Wikimedia Commons).
