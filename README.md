# Omaha: Survive the Landing

A browser-based first-person survival prototype inspired by the Normandy landings.

## Play
https://derrickwbrownYMCA.github.io/omaha-survive-the-landing/

Enable GitHub Pages at Settings → Pages → Deploy from a branch → main / (root) if it isn't live yet.

## Landing-party animation
The first ten seconds follow two men at the gunwale: one steadies himself on the rail, they exchange a look and a nod, and their shoulder blanket and netted helmet stay with them onto the beach. A nearby soldier can turn and acknowledge a wave a moment later. These beats don't need captions or audio; soldier speech is **off by default** (`?voice=1` opts in).

The third-person soldier leans into motion, settles after a sprint and shifts weight when crouching or getting up. Both hands follow the carried prop; the support hand can leave it to signal or brace. These are display poses only: movement speed, aim and weapon behavior are unchanged.

## Soldier realism (v4.5)
Soldier realism, in six self-contained sections near the end of `index.html` (each with its own config constants and switch; `?realism=0` turns all six off):
- **Movement variety** (`SOLDIER_VARIETY`, `?variety=0`): each man has his own pace with slow surges, stride length, step-rate drift, hunch and sway, and every loop starts at his own point in the cycle, so the crowd no longer moves in step.
- **Reactions to fire** (`REACTIONS`, `?reactions=0`): men flinch at near misses, dive flat when there is no steel close by, crawl to the next obstacle and sometimes freeze behind it. Deaths and wounds fall differently (crumple, stagger, drop to the knees, pitch forward; wounded lie on their backs, sit, double over or crawl). Nearby men drag wounded comrades back to cover and kneel by them.
- **Water and sand** (`TERRAIN_GAIT`, `?gait=0`): men wade slowly and lean into the surf with splashes, slow on soft sand and shingle and sometimes stumble or trip. Clip speed now follows ground speed using the stride lengths measured from the animations, so planted feet no longer slide.
- **Appearance** (`APPEARANCE`, `?appearance=0`): per-man helmet angle, uniform shade, skin tone and kit (pack, blanket roll, entrenching tool, life belt, canteen, assault gas-mask bag, bandolier). Cloth goes darker and glossy below the highest water each man has waded through and dries slowly; sand builds up on boots and leggings, and on the front of anyone who has been lying down. One shader patch, still one draw call per man.
- **Distant soldiers** (`LOD_TUNE`, `?lodtune=0`): the low-poly switch distance follows the graphics setting (70/100/120/140 m), with hysteresis so men on the boundary don't flicker, and men far from the camera animate less often. Reactions, falls and appearance apply to the low-poly body too; arm gestures are skipped on it.
- **Voices and gestures** (`VOICES`, `?voices=0`): synthesized shouts (formant synthesis, no recorded speech), heard from where the man is and captioned when he is close: "Move!", "Get down!", "Medic!", "I got you — hang on!". Leaders wave and point forward, frightened men hold their helmets, wounded men raise an arm.

### Third-person view
- On touchscreens, open **Controls**, tap **Third-person view**, then close Controls. On a keyboard, press **T** to switch between first person (still the default) and a view from a few metres behind and above your soldier that follows where you look. Your soldier is the full v4.5 model with its animations (idle, walk, jog, sprint, crouch; rifle raised while aiming or firing) and the same wet-cloth and sand shading.
- Shots go where the crosshair is: a ray from the camera through the crosshair finds what it is on, and the round leaves your muzzle toward that point.
- The camera pulls in rather than clip through or hide behind hedgehogs, crates, the seawall, bunkers or the bluff, and eases back out once clear. Pressed right against something, it moves into your soldier's head and he is not drawn.
- Self-contained section `THIRD_PERSON` near the end of `index.html`. `?tp=0` turns it off (T does nothing). `?view=third` starts in third person. In the console: `__omaha.view('third')` or `__omaha.view('first')`.

### From v4.4
- German defenders. Each of the six bunkers now has a real embrasure with a two-man MG crew behind it (gunner and loader, the soldier model recoloured in field grey). Only heads and shoulders show through the slit, and they duck while rounds are hitting near it. Shoot the gunner and that gun stops: the loader takes it over after 5–8 s, or, if he is down too, a replacement comes up after 14–22 s. Without a loader the gun reloads much more slowly. A red X marks a hit.
- Rounds now leave where you aimed (recoil used to be applied before the shot) and wander a little: least when aiming down the sights, more when suppressed or out of breath.
- Distant soldiers (over 100 m) are drawn with a 192-triangle body instead of the 14,780-triangle one. `?lod=0` turns this off; `?fps=1` shows frame rate, draw calls, triangles and how many soldiers are low-poly.

### From v4.3
- In-engine opening cinematic: the boats' run-in to Dog Green, skippable.

### From v4.2
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
- At the seawall, smoke marks the breach near where you arrive. The objective shows charge progress: the gap opens in about 14 seconds without covering fire, or about 8 with continuous covering fire (game time). If the engineer is hit, the next man keeps his progress; support finishes the job if no local engineer is left.
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

URL switches for testing: `?fps=1` performance readout, `?lod=0` no low-poly bodies, `?realism=0` (or `?variety=0`, `?reactions=0`, `?gait=0`, `?appearance=0`, `?lodtune=0`, `?voices=0`) to turn the v4.5 sections off, `?tp=0` no third-person view, `?view=third` start in third person.

Controls: WASD movement, mouse look, left-click or F fire, right-click or Q aim, G grenade, V aerial view, T third-person view, Shift sprint, C crouch, E assist, R bandage, Esc pause.
Use TEST AUDIO if sound isn't playing. Chrome requires a user click to start audio.

The game depends on Three.js from an external CDN.

## Testing status
- v3.8 was syntax-checked and run in a browser through a scripted test hook (`window.__omaha`). A scripted run completed the whole sequence: reached the wall and was stopped by it, suppressed the gun, the wire blew after 17 s of covering fire, climbed through the gap, threw the grenade, got the end screen, and restarted with the wall and wire restored.
- The crossing difficulty from v3.7 is unchanged (scripted cover-using bot reached the wall 3 times in 8).
- v4.2 was syntax-checked, viewed in still screenshots (boat, surf, beach, seawall) and run once by script from boat to silenced bunker with no errors. Not verified: how the soldiers look in motion, and frame rate with sixty of them (each is about 14,800 triangles).
- v4.5 was checked in headless Chromium (software rendering) through `window.__omaha`: staged screenshots of each behaviour, 60-second battle runs with every section on and with each one switched off in turn, no page errors. Not verified: how it looks in motion on a real GPU, and the synthesized shouts by ear.
- Not verified: hands-on play, aiming by mouse, the mobile FIRE button, how the new sections look in motion, frame rate.

## Credits
- Soldier body and animations: "Universal Animation Library" (Standard) by Quaternius, CC0 — https://opengameart.org/content/universal-animation-library . Trimmed to the 14 clips the game uses.
- Machine gun: "Light Machine Gun" by KuraiWolf, CC-BY 4.0 — https://opengameart.org/content/light-machine-gun
- Distant explosion: "Big low frequency explosion boom" by Hansjörg Malthaner (Varkalandar), CC-BY 4.0 — https://opengameart.org/content/big-low-frequency-explosion-boom
- Engine: "Engine-loop heavy vehicle/tank" by Nayckron, CC-BY 3.0 — https://opengameart.org/content/engine-loop-heavy-vehicletank
- Metal impacts by BMacZero, cannon fire by Thimras, water waves by transitking (all CC0, OpenGameArt); "War sounds" by Dragout (CC0, Wikimedia Commons).
