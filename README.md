# Omaha: Survive the Landing

A browser-based first-person survival prototype inspired by the Normandy landings.

## Play
https://derrickwbrownYMCA.github.io/omaha-survive-the-landing/

Enable GitHub Pages at Settings → Pages → Deploy from a branch → main / (root) if it isn't live yet.

## Current build: v4.2
- New soldiers. The cartoon figure is replaced by an adult-proportioned body, painted by body part (skin, olive jacket, wool trousers, canvas leggings, boots) and equipped in code: M1 helmet, haversack with blanket roll and entrenching tool, shoulder straps, inflatable life belt, cartridge belt with pouches, canteen, and an M1 Garand without a scope.
- New movement: jog, sprint, walk and a crouched run; men behind cover crouch properly, some with rifles up; the engineer kneels at the wire; the fallen lie face down. Each soldier is one draw call.

### From v4.1
- Weapon choice on the start screen, with a drawn picture of each: M1 Garand (8-round clip, hardest hitting), M1 Carbine (15 rounds, quick, less punch), BAR (20 rounds, automatic, slows you down) and Thompson (30 rounds, automatic, short range only). The choice is remembered and can be changed with each new soldier, not mid-run.

### From v4.0
- Aim down the sights: hold the right mouse button (or press Q; AIM on mobile) for a narrower view through M1-style iron sights. A diamond marks the nearest gun slit ahead and turns green while that gun is suppressed. Movement and mouse speed slow while aiming.
- Limited ammunition: an eight-round clip plus 72 rounds in reserve, shown at the bottom of the screen with two grenades. Walking over a fallen soldier picks up two clips. Grenades are kept for the bunker.

### From v3.9
- Aerial view: the AERIAL VIEW button or V freezes the game and lifts the camera above you, so you can see where the steel obstacles are and plan a route. A yellow ring marks your position.
- Smoke is now soft and rises instead of faceted blobs that fell back down. Men in the landing craft stand on the deck and move with it.

### From v3.8
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

Controls: WASD movement, mouse look, left-click or F fire, right-click or Q aim, G grenade, V aerial view, Shift sprint, C crouch, E assist, R bandage, Esc pause.
Use TEST AUDIO if sound isn't playing. Chrome requires a user click to start audio.

The game depends on Three.js from an external CDN.

## Testing status
- v3.8 was syntax-checked and run in a browser through a scripted test hook (`window.__omaha`). A scripted run completed the whole sequence: reached the wall and was stopped by it, suppressed the gun, the wire blew after 17 s of covering fire, climbed through the gap, threw the grenade, got the end screen, and restarted with the wall and wire restored.
- The crossing difficulty from v3.7 is unchanged (scripted cover-using bot reached the wall 3 times in 8).
- v4.2 was syntax-checked, viewed in still screenshots (boat, surf, beach, seawall) and run once by script from boat to silenced bunker with no errors. Not verified: how the soldiers look in motion, and frame rate with sixty of them (each is about 14,800 triangles).
- Not verified: hands-on play, aiming by mouse, the mobile FIRE button, how the new sections look in motion, frame rate.

## Credits
- Soldier body and animations: "Universal Animation Library" (Standard) by Quaternius, CC0 — https://opengameart.org/content/universal-animation-library . Trimmed to the 14 clips the game uses.
- Machine gun: "Light Machine Gun" by KuraiWolf, CC-BY 4.0 — https://opengameart.org/content/light-machine-gun
- Distant explosion: "Big low frequency explosion boom" by Hansjörg Malthaner (Varkalandar), CC-BY 4.0 — https://opengameart.org/content/big-low-frequency-explosion-boom
- Engine: "Engine-loop heavy vehicle/tank" by Nayckron, CC-BY 3.0 — https://opengameart.org/content/engine-loop-heavy-vehicletank
- Metal impacts by BMacZero, cannon fire by Thimras, water waves by transitking (all CC0, OpenGameArt); "War sounds" by Dragout (CC0, Wikimedia Commons).
