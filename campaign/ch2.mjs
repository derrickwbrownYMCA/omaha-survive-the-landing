export default function scene(s) {
  const companion = s.companion === 'Bell' ? 'Bell' : 'Ellis';
  const route = s.route;

  if (s.node === 'start') {
    return {
      title: '2: The Long Road',
      place: 'The flooded lane',
      objective: 'Find a way across the washed-out crossing.',
      body: `${companion} crouches beside you at the broken bridge. The stream has swallowed the road where the crossing used to be; muddy water tugs at loose branches below. The direct path is gone. A longer road bends inland through the fields, while a narrow footpath climbs the opposite bank. “We can stay together and take the long way,” ${companion} says, “or split up and meet beyond the crossing.” Their eyes stay on yours, waiting for your call.`,
      art: `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#95b7c2"/><stop offset="1" stop-color="#e8c99b"/></linearGradient><linearGradient id="river" x2="0" y2="1"><stop stop-color="#789da0"/><stop offset="1" stop-color="#3d6567"/></linearGradient></defs><rect width="800" height="360" fill="url(#sky)"/><circle cx="654" cy="74" r="37" fill="#f4d79d" opacity=".8"/><path d="M0 178 Q130 115 254 170 T500 150 T800 175 V360 H0Z" fill="#667b59"/><path d="M0 215 Q120 180 239 220 L316 360 H0Z" fill="#907c5b"/><path d="M800 208 Q690 170 584 218 L499 360 H800Z" fill="#8b7856"/><path d="M0 250 Q170 208 300 255 Q390 284 493 246 Q645 203 800 255 L800 360 H0Z" fill="url(#river)"/><path d="M15 241 L284 232 M515 225 L782 244" stroke="#655b4d" stroke-width="13"/><path d="M288 231 L346 250 M505 227 L468 248" stroke="#554b40" stroke-width="9"/><path d="M315 251 L356 257 M468 251 L497 238" stroke="#d8c8a7" stroke-width="4" opacity=".7"/><path d="M580 225 Q631 157 701 173 Q750 181 786 218" fill="none" stroke="#b3a078" stroke-width="12" stroke-dasharray="7 8"/><path d="M41 200 l34 -37 43 22 35 -31 42 24" fill="none" stroke="#40533f" stroke-width="7"/><g fill="#35443b"><circle cx="107" cy="141" r="21"/><path d="M91 161h32l9 44h-50z"/><circle cx="146" cy="157" r="17"/><path d="M132 174h28l8 34h-42z"/></g><path d="M82 207h68M124 209h52" stroke="#554638" stroke-width="5"/><path d="M354 210q20 -17 38 0v36h-38z" fill="#586c4e"/><circle cx="373" cy="199" r="11" fill="#d1a77e"/><path d="M349 192q24 -20 47 0" fill="#4b5141"/>`,
      actions: [
        { label: `Take the longer road together with ${companion}`, to: 'long-road', set: { route: 'together' } },
        { label: `Split up and rendezvous beyond the crossing`, to: 'split-path', set: { route: 'split' } },
      ],
    };
  }

  if (s.node === 'long-road') {
    return {
      title: '2: The Long Road',
      place: 'The inland bend',
      objective: 'Keep moving with your companion.',
      body: `You and ${companion} follow the broad track inland, around the flooded valley. It takes longer, but neither of you has to guess whether the other made it across. At the rise beyond the bend, ${companion} glances back at the broken crossing, then gives you a quiet, relieved nod. “Together, then.”`,
      art: `<defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="#9bbdc4"/><stop offset="1" stop-color="#efd0a0"/></linearGradient></defs><rect width="800" height="360" fill="url(#s)"/><path d="M0 204Q130 132 282 188T540 170T800 192V360H0Z" fill="#637a56"/><path d="M0 275Q180 228 325 276T800 242V360H0Z" fill="#73855b"/><path d="M0 360Q176 290 345 314Q500 335 800 213" fill="none" stroke="#c5ad7c" stroke-width="56"/><path d="M0 360Q176 290 345 314Q500 335 800 213" fill="none" stroke="#e0cb9c" stroke-width="3" stroke-dasharray="12 12"/><path d="M500 224Q565 190 606 220L630 360H414Z" fill="#506448"/><g fill="#37463b"><circle cx="388" cy="235" r="17"/><path d="M374 251h28l8 49h-44z"/><circle cx="430" cy="244" r="14"/><path d="M418 258h25l9 40h-38z"/></g><path d="M353 311h106" stroke="#52483a" stroke-width="7"/><g fill="#40553d"><circle cx="130" cy="184" r="26"/><circle cx="175" cy="193" r="19"/><circle cx="696" cy="174" r="31"/></g>`,
      actions: [{ label: 'Continue along the road', to: '@next', set: { route: 'together', helped: true } }],
    };
  }

  if (s.node === 'split-path') {
    return {
      title: '2: The Long Road',
      place: 'The far bank',
      objective: 'Find your companion at the rendezvous.',
      body: `You take the narrow path while ${companion} circles inland. For a while, all you hear is water and the wind in the grass. Then ${companion} appears on the far bank, breathless but safe. They reach out a hand to steady you over the last slick stones. “I knew you’d find it,” they say, searching your face for the same reassurance you were looking for in theirs.`,
      art: `<defs><linearGradient id="d" x2="0" y2="1"><stop stop-color="#8eacb5"/><stop offset="1" stop-color="#e6c796"/></linearGradient></defs><rect width="800" height="360" fill="url(#d)"/><path d="M0 191Q110 149 253 182T540 170T800 184V360H0Z" fill="#586f50"/><path d="M0 250Q210 201 330 243Q420 278 523 231T800 246V360H0Z" fill="#769093"/><path d="M0 360Q121 280 253 297Q337 309 429 360Z" fill="#917c59"/><path d="M800 360Q667 266 550 289Q500 300 443 360Z" fill="#96815d"/><path d="M204 299Q284 277 350 303Q402 325 458 295" fill="none" stroke="#d7c49a" stroke-width="11" stroke-dasharray="9 8"/><g fill="#39473d"><circle cx="543" cy="228" r="19"/><path d="M526 246h34l10 56h-54z"/><circle cx="492" cy="242" r="16"/><path d="M478 258h29l8 48h-45z"/></g><path d="M520 301l-17 21M558 301l15 20M478 304l-12 17" stroke="#403e37" stroke-width="7"/><path d="M80 220l68 -30 56 19" fill="none" stroke="#4a6043" stroke-width="9"/><circle cx="135" cy="185" r="26" fill="#40543f"/>`,
      actions: [{ label: 'Set off together', to: '@next', set: { route: 'split', helped: true } }],
    };
  }

  return {
    title: '2: The Long Road',
    place: 'Beyond the crossing',
    objective: 'Continue the journey.',
    body: `You and ${companion} leave the washed-out crossing behind. Whatever the route cost, you have found one another again, and the road ahead is still open.`,
    art: `<rect width="800" height="360" fill="#a7c0c0"/><path d="M0 205Q150 125 310 185T800 168V360H0Z" fill="#687d58"/><path d="M0 360Q300 275 800 213" fill="none" stroke="#c7b182" stroke-width="48"/><path d="M360 360L425 210" stroke="#e6d3a5" stroke-width="3" stroke-dasharray="10 12"/>`,
    actions: [{ label: 'Continue', to: '@next', set: { route: route || 'together' } }],
  };
}
