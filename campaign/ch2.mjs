export default function scene(s) {
  const companion = s.companion === 'Bell' ? 'Bell' : 'Ellis';
  const route = s.route;

  if (s.node === 'start') {
    return {
      title: '2: The Long Road',
      place: 'The flooded lane',
      objective: 'Choose how you and your companion will cross the washed-out route.',
      body: `At the broken bridge, muddy water races through the gap in the road. A broad track winds inland around the flooded valley; a narrow path climbs the opposite bank. ${companion} studies both routes, then looks to you. “Together on the long road, or split up and meet beyond the crossing?”`,
      art: `<defs><linearGradient id="cross-sky" x2="0" y2="1"><stop stop-color="#95b7c2"/><stop offset="1" stop-color="#e8c99b"/></linearGradient><linearGradient id="cross-water" x2="0" y2="1"><stop stop-color="#789da0"/><stop offset="1" stop-color="#3d6567"/></linearGradient></defs><rect width="800" height="360" fill="url(#cross-sky)"/><circle cx="654" cy="74" r="37" fill="#f4d79d"/><path d="M0 178Q130 115 254 170T500 150T800 175V360H0Z" fill="#667b59"/><path d="M0 215Q120 180 239 220L316 360H0ZM800 208Q690 170 584 218L499 360H800Z" fill="#907c5b"/><path d="M0 250Q170 208 300 255Q390 284 493 246Q645 203 800 255V360H0Z" fill="url(#cross-water)"/><path d="M15 241L284 232M515 225L782 244" stroke="#655b4d" stroke-width="13"/><path d="M288 231l58 19m159-23l-37 21" stroke="#554b40" stroke-width="9"/><path d="M580 225Q631 157 701 173Q750 181 786 218" fill="none" stroke="#b3a078" stroke-width="12" stroke-dasharray="7 8"/><path d="M41 200l34-37 43 22 35-31 42 24" fill="none" stroke="#40533f" stroke-width="7"/><g fill="#35443b"><circle cx="107" cy="141" r="21"/><path d="M91 161h32l9 44H82z"/><circle cx="146" cy="157" r="17"/><path d="M132 174h28l8 34h-42z"/></g><path d="M354 210q20-17 38 0v36h-38z" fill="#586c4e"/><circle cx="373" cy="199" r="11" fill="#d1a77e"/><path d="M349 192q24-20 47 0" fill="#4b5141"/>`,
      actions: [
        { label: `Take the longer road together with ${companion}`, to: 'long-road', set: { route: 'together' } },
        { label: 'Split up and rendezvous beyond the crossing', to: 'split-path', set: { route: 'split' } },
      ],
    };
  }

  if (s.node === 'long-road') {
    return {
      title: '2: The Long Road',
      place: 'The inland switchback',
      objective: 'Follow the track around the flooded valley.',
      body: `You and ${companion} take the wide track uphill. From the first switchback, the broken bridge looks smaller, but the far bank is still a long way off. ${companion} keeps pace beside you, pointing out the pale track as it curves behind a stand of pines.`,
      art: `<defs><linearGradient id="switch-sky" x2="0" y2="1"><stop stop-color="#9bbdc4"/><stop offset="1" stop-color="#efd0a0"/></linearGradient></defs><rect width="800" height="360" fill="url(#switch-sky)"/><path d="M0 190Q170 112 315 177T580 147T800 174V360H0Z" fill="#607650"/><path d="M0 261Q190 208 354 259T800 229V360H0Z" fill="#7e8a5d"/><path d="M0 360Q133 302 266 321Q372 338 427 289Q467 254 540 254Q632 253 800 211" fill="none" stroke="#b6a071" stroke-width="43"/><path d="M0 360Q133 302 266 321Q372 338 427 289Q467 254 540 254Q632 253 800 211" fill="none" stroke="#e2cda0" stroke-width="3" stroke-dasharray="11 12"/><path d="M117 227l22-92 28 92zm90-19 27-111 35 111zm479 21 30-112 36 112z" fill="#374b3f"/><g fill="#39463a"><circle cx="387" cy="249" r="14"/><path d="M376 263h23l8 41h-39z"/><circle cx="424" cy="254" r="12"/><path d="M414 266h21l7 36h-34z"/></g><circle cx="724" cy="67" r="27" fill="#f6dca7"/>`,
      actions: [{ label: 'Climb to the pine-covered rise', to: 'ridge' }],
    };
  }

  if (s.node === 'ridge') {
    return {
      title: '2: The Long Road',
      place: 'The pine-covered rise',
      objective: 'Cross the ridge and find the old stone marker.',
      body: `The track narrows between wind-bent pines. At the crest, you and ${companion} pause beside an old stone marker; the valley stream glints far below. ${companion} brushes grit from its face, then follows a faint cart track down the other side.`,
      art: `<defs><linearGradient id="ridge-sky" x2="0" y2="1"><stop stop-color="#87aebc"/><stop offset="1" stop-color="#ead4aa"/></linearGradient></defs><rect width="800" height="360" fill="url(#ridge-sky)"/><circle cx="148" cy="76" r="30" fill="#f2d99f"/><path d="M0 243L148 135l100 94 135-150 136 157 99-94 182 115V360H0Z" fill="#536b58"/><path d="M0 283Q160 238 290 269T535 245T800 281V360H0Z" fill="#78865e"/><path d="M0 360Q199 325 337 306Q450 291 558 316Q664 341 800 291" fill="none" stroke="#b59e70" stroke-width="38"/><path d="M0 360Q199 325 337 306Q450 291 558 316Q664 341 800 291" fill="none" stroke="#dfc998" stroke-width="3" stroke-dasharray="9 11"/><path d="M373 198h57v92h-57z" fill="#877d68"/><path d="M365 198l37-20 37 20z" fill="#655f53"/><path d="M388 224h27" stroke="#c7b991" stroke-width="4"/><g fill="#2f463d"><path d="M82 229l43-151 45 151zM148 244l50-176 51 176zM596 231l43-150 44 150zM655 253l54-183 55 183z"/></g>`,
      actions: [{ label: 'Follow the cart track down the far side', to: 'orchard' }],
    };
  }

  if (s.node === 'orchard') {
    return {
      title: '2: The Long Road',
      place: 'The far-bank orchard',
      objective: 'Reach the crossing beyond the orchard.',
      body: `Beyond the ridge, the road slips into a neglected orchard. You and ${companion} pass beneath low branches heavy with rain; the flooded stream is now behind the trees. At the far gate, ${companion} glances back at the long route and gives you a tired, companionable smile.`,
      art: `<defs><linearGradient id="orchard-sky" x2="0" y2="1"><stop stop-color="#a2c3bf"/><stop offset="1" stop-color="#e6cd9f"/></linearGradient></defs><rect width="800" height="360" fill="url(#orchard-sky)"/><path d="M0 193Q170 143 321 188T590 171T800 196V360H0Z" fill="#687952"/><path d="M0 270Q189 224 359 267T800 241V360H0Z" fill="#879064"/><path d="M0 360Q176 316 319 327Q443 336 558 286Q680 234 800 249" fill="none" stroke="#b39b70" stroke-width="43"/><g fill="#455b43"><path d="M67 227v-74h13v74zM38 166q4-58 38-50 37-11 45 42-31 36-83 8z"/><path d="M205 238v-87h14v87zM170 168q2-55 42-57 42 9 41 57-40 29-83 0z"/><path d="M630 221v-78h14v78zM594 158q8-50 43-49 38 8 42 51-42 30-85-2z"/><path d="M727 235v-88h14v88zM691 164q7-59 47-57 42 10 44 56-42 34-91 1z"/></g><g fill="#d99f72"><circle cx="62" cy="152" r="6"/><circle cx="103" cy="139" r="6"/><circle cx="191" cy="150" r="6"/><circle cx="235" cy="143" r="6"/><circle cx="617" cy="142" r="6"/><circle cx="661" cy="135" r="6"/></g><path d="M755 232v-93m-14 15h28m-28 18h28" stroke="#584f40" stroke-width="7"/>`,
      actions: [{ label: `Walk with ${companion} through the gate`, to: 'reunited' }],
    };
  }

  if (s.node === 'split-path') {
    return {
      title: '2: The Long Road',
      place: 'The narrow bank path',
      objective: 'Follow the footpath to the agreed meeting place.',
      body: `You and ${companion} part with a clear meeting point: the old gate on the far bank. You pick your way along the narrow bank path alone. A few times, you stop to scan the opposite slope for movement; the water keeps the two routes apart.`,
      art: `<defs><linearGradient id="bank-sky" x2="0" y2="1"><stop stop-color="#91b3bd"/><stop offset="1" stop-color="#e7c99c"/></linearGradient></defs><rect width="800" height="360" fill="url(#bank-sky)"/><path d="M0 192Q115 145 250 180T518 165T800 191V360H0Z" fill="#586f50"/><path d="M0 248Q210 207 330 242Q438 270 522 228T800 247V360H0Z" fill="#789295"/><path d="M0 360Q121 280 253 297Q337 309 429 360Z" fill="#917c59"/><path d="M800 360Q667 266 550 289Q500 300 443 360Z" fill="#96815d"/><path d="M62 360Q129 312 207 305Q263 300 311 314" fill="none" stroke="#d7c49a" stroke-width="13" stroke-dasharray="10 8"/><path d="M204 299Q284 277 350 303Q402 325 458 295" fill="none" stroke="#d7c49a" stroke-width="8" stroke-dasharray="7 9"/><path d="M722 251v-77m-13 13h26m-26 17h26" stroke="#544d40" stroke-width="7"/><g fill="#39473d"><circle cx="543" cy="228" r="19"/><path d="M526 246h34l10 56h-54z"/><circle cx="492" cy="242" r="16"/><path d="M478 258h29l8 48h-45z"/></g><path d="M80 220l68-30 56 19" fill="none" stroke="#4a6043" stroke-width="9"/><circle cx="135" cy="185" r="26" fill="#40543f"/>`,
      actions: [{ label: 'Continue along the bank to the old gate', to: 'meeting-place' }],
    };
  }

  if (s.node === 'meeting-place') {
    return {
      title: '2: The Long Road',
      place: 'The old gate',
      objective: 'Signal your companion, then watch the far slope for their answer.',
      body: `You reach the agreed gate first. Across the stream, the far slope is quiet. You need ${companion} to know you made it safely; the old gate stands clear against the open field.`,
      art: `<defs><linearGradient id="gate-sky" x2="0" y2="1"><stop stop-color="#a7c2bf"/><stop offset="1" stop-color="#f0d6a8"/></linearGradient></defs><rect width="800" height="360" fill="url(#gate-sky)"/><circle cx="675" cy="78" r="32" fill="#f7dfa9"/><path d="M0 187Q164 142 312 186T565 167T800 185V360H0Z" fill="#72805a"/><path d="M0 239Q172 214 318 240T573 223T800 245V360H0Z" fill="#7d9991"/><path d="M0 360Q188 300 337 316Q455 330 590 360Z" fill="#9a855d"/><path d="M614 215v-101m-22 17h44m-44 21h44m-44 21h44m-44 21h44" stroke="#625843" stroke-width="8"/><path d="M593 116h43" stroke="#423e34" stroke-width="11"/><path d="M131 360Q189 317 276 315" fill="none" stroke="#d8c69a" stroke-width="10" stroke-dasharray="9 9"/><path d="M219 259l20-45 21 45m-48-20h55" fill="none" stroke="#f1ead5" stroke-width="7"/>`,
      actions: [
        { label: 'Raise a clear signal toward the far bank', to: 'signal' },
        { label: 'Climb a little higher for a better view', to: 'lookout' },
      ],
    };
  }

  if (s.node === 'signal') {
    return {
      title: '2: The Long Road',
      place: 'Beside the old gate',
      objective: 'Wait for a sign that your companion has seen you.',
      body: `You step into the open and raise both arms, holding the signal long enough to be seen across the water. Wind tugs at your sleeves. Then, on the far slope, ${companion} appears between the trees and lifts a hand in reply. You answer with a wave and wait as they make their way toward the gate.`,
      art: `<defs><linearGradient id="signal-sky" x2="0" y2="1"><stop stop-color="#98bac4"/><stop offset="1" stop-color="#f2d6a5"/></linearGradient></defs><rect width="800" height="360" fill="url(#signal-sky)"/><path d="M0 190Q170 133 332 178T590 161T800 190V360H0Z" fill="#647650"/><path d="M0 251Q160 212 335 247T800 230V360H0Z" fill="#789398"/><path d="M0 360Q181 316 359 321Q474 325 574 360Z" fill="#9a835c"/><path d="M680 228v-97m-18 15h36m-36 21h36m-36 21h36" stroke="#5b513d" stroke-width="7"/><g fill="#40523f"><circle cx="295" cy="173" r="17"/><path d="M282 189h26l8 62h-42z"/><path d="M284 204l-26-35m48 35 28-34" stroke="#d2b08a" stroke-width="8"/></g><g fill="#40513d"><circle cx="612" cy="204" r="13"/><path d="M601 217h23l7 43h-37z"/><path d="M608 225l-14-20m22 18 16-22" stroke="#d4b18c" stroke-width="6"/></g><path d="M271 142l-18-17m49 16 19-18" stroke="#f7f0d8" stroke-width="4"/><path d="M133 352Q203 318 251 315" fill="none" stroke="#ddc99b" stroke-width="9" stroke-dasharray="9 9"/>`,
      actions: [{ label: `Wait by the gate for ${companion} to reach you`, to: 'reunited' }],
    };
  }

  if (s.node === 'lookout') {
    return {
      title: '2: The Long Road',
      place: 'The rise above the gate',
      objective: 'Search the far slope for your companion.',
      body: `You climb the low rise and look past the gate, searching the far bank from end to end. At first, nothing moves but the grass. Then ${companion} emerges from the trees and gives the agreed wave. Relief loosens the knot in your chest; you signal back and head down to meet.`,
      art: `<defs><linearGradient id="look-sky" x2="0" y2="1"><stop stop-color="#8eacba"/><stop offset="1" stop-color="#e9d0a7"/></linearGradient></defs><rect width="800" height="360" fill="url(#look-sky)"/><circle cx="177" cy="73" r="28" fill="#f2d8a4"/><path d="M0 194L143 118l96 61 123-94 125 93 114-65 199 88V360H0Z" fill="#5b7155"/><path d="M0 249Q183 219 338 246T800 231V360H0Z" fill="#79908b"/><path d="M0 360Q210 301 357 315T800 360Z" fill="#94805e"/><path d="M511 224v-70m-14 12h28m-28 18h28m-28 17h28" stroke="#5b513d" stroke-width="6"/><g fill="#3f5140"><circle cx="525" cy="207" r="14"/><path d="M514 220h22l7 42h-36z"/><path d="M517 228l-18-18m25 17 18-19" stroke="#d5b08c" stroke-width="6"/></g><path d="M83 360Q165 320 245 310" fill="none" stroke="#ddc89b" stroke-width="10"/><path d="M674 226v-67m-11 12h22m-22 18h22" stroke="#504936" stroke-width="6"/>`,
      actions: [{ label: 'Go down to meet at the gate', to: 'reunited' }],
    };
  }

  if (s.node === 'reunited') {
    return {
      title: '2: The Long Road',
      place: 'Beyond the crossing',
      objective: 'Continue the journey together.',
      body: route === 'split'
        ? `${companion} reaches you at the gate, and you share a quick, relieved smile. Neither of you had to wonder for long: the signal and the answering wave brought you together again. Side by side, you leave the flooded crossing behind.`
        : `You and ${companion} pass through the far-bank gate together. The long road took patience, but you saw every mile of it side by side. ${companion} gives your shoulder a grateful nudge as the track opens ahead.`,
      art: `<defs><linearGradient id="reunion-sky" x2="0" y2="1"><stop stop-color="#a6c6c3"/><stop offset="1" stop-color="#f0d8ad"/></linearGradient></defs><rect width="800" height="360" fill="url(#reunion-sky)"/><path d="M0 189Q177 134 332 180T587 163T800 190V360H0Z" fill="#637752"/><path d="M0 247Q190 213 356 249T800 229V360H0Z" fill="#7a8e67"/><path d="M0 360Q194 322 354 325Q498 326 800 239" fill="none" stroke="#c2aa78" stroke-width="46"/><path d="M0 360Q194 322 354 325Q498 326 800 239" fill="none" stroke="#e4d2a7" stroke-width="3" stroke-dasharray="10 11"/><path d="M592 231v-89m-18 15h36m-36 20h36m-36 20h36" stroke="#645943" stroke-width="7"/><g fill="#3d4e40"><circle cx="381" cy="244" r="15"/><path d="M369 259h24l8 47h-40z"/><circle cx="421" cy="248" r="14"/><path d="M410 262h23l8 44h-39z"/></g><circle cx="716" cy="72" r="30" fill="#f4dba8"/>`,
      actions: [{ label: 'Set out together', to: '@next' }],
    };
  }

  return {
    title: '2: The Long Road',
    place: 'Beyond the crossing',
    objective: 'Continue the journey.',
    body: `You and ${companion} leave the washed-out crossing behind. Whatever the route cost, you have found one another again, and the road ahead is still open.`,
    art: `<defs><linearGradient id="beyond-sky" x2="0" y2="1"><stop stop-color="#a7c0c0"/><stop offset="1" stop-color="#e7d1a8"/></linearGradient></defs><rect width="800" height="360" fill="url(#beyond-sky)"/><path d="M0 205Q150 125 310 185T800 168V360H0Z" fill="#687d58"/><path d="M0 360Q300 275 800 213" fill="none" stroke="#c7b182" stroke-width="48"/><path d="M360 360L425 210" stroke="#e6d3a5" stroke-width="3" stroke-dasharray="10 12"/>`,
    actions: [{ label: 'Continue', to: '@next' }],
  };
}
