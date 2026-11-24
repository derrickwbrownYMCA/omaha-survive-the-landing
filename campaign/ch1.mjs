const villageArt = `
<defs><linearGradient id="vsky" x2="0" y2="1"><stop stop-color="#83c2d1"/><stop offset="1" stop-color="#f3d8a5"/></linearGradient></defs>
<rect width="800" height="360" fill="url(#vsky)"/><circle cx="670" cy="68" r="34" fill="#ffe6a0"/>
<path d="M0 210Q150 130 300 204T600 188T800 175V360H0Z" fill="#829a73"/><path d="M0 258Q200 205 400 250T800 228V360H0Z" fill="#718554"/>
<path d="M0 325Q180 280 360 320T800 300" fill="none" stroke="#d3bd8b" stroke-width="28"/>
<g transform="translate(120 148)"><path d="M0 58 55 14 110 58v70H0Z" fill="#dfcaa4" stroke="#5c5547" stroke-width="3"/><path d="m-8 58 63-52 63 52" fill="#805b43" stroke="#554737" stroke-width="5"/><rect x="44" y="86" width="22" height="42" fill="#674f3d"/></g>
<g transform="translate(530 135)"><path d="M0 62 52 18 104 62v80H0Z" fill="#ddd6c4" stroke="#575650" stroke-width="3"/><path d="m-8 62 60-52 60 52" fill="#765447" stroke="#51433c" stroke-width="5"/><path d="M52 10v-34m-10 12h20" stroke="#51433c" stroke-width="5"/></g>
<path d="M350 360v-90m-18 22h36m-18-22-24-23m24 23 24-23" stroke="#654f38" stroke-width="7"/><path d="M0 345q45-24 90 0t90 0t90 0t90 0t90 0t90 0t90 0t90 0" fill="none" stroke="#496448" stroke-width="5"/>`;

const farmArt = `
<defs><linearGradient id="fsky" x2="0" y2="1"><stop stop-color="#96c7d0"/><stop offset="1" stop-color="#f4ddaa"/></linearGradient></defs><rect width="800" height="360" fill="url(#fsky)"/><circle cx="645" cy="76" r="38" fill="#ffe5a0"/><path d="M0 200Q160 150 340 198T800 182V360H0Z" fill="#87986b"/><path d="M0 250Q180 210 360 242T800 225V360H0Z" fill="#9a9a5c"/><path d="M0 284h800" stroke="#d4bd7d" stroke-width="5"/><path d="M115 360 180 220m95 140 16-140m110 140-38-140m170 140-73-140m190 140-110-140" stroke="#b9ae6d" stroke-width="4"/><path d="M150 205 305 105 460 205v130H150Z" fill="#d6c19a" stroke="#5b5142" stroke-width="4"/><path d="m128 209 177-120 177 120" fill="#76533e" stroke="#4e4035" stroke-width="7"/><rect x="264" y="242" width="73" height="93" fill="#6a503c"/><path d="M280 242v93m40-93v93" stroke="#b08b5e" stroke-width="4"/><rect x="180" y="230" width="42" height="38" fill="#a7c5c2" stroke="#655b4b" stroke-width="3"/><path d="M0 338h800" stroke="#5e7148" stroke-width="8"/>`;

const churchArt = `
<defs><linearGradient id="csky" x2="0" y2="1"><stop stop-color="#88b7cc"/><stop offset="1" stop-color="#e9d5b6"/></linearGradient></defs><rect width="800" height="360" fill="url(#csky)"/><circle cx="660" cy="70" r="32" fill="#f8e3ad"/><path d="M0 225Q160 165 330 220T800 185V360H0Z" fill="#73876d"/><path d="M0 277Q180 235 380 267T800 240V360H0Z" fill="#5e7759"/><path d="M300 360 350 215h150l58 145" fill="#c9b993"/><path d="M323 200 422 122 520 200v145H323Z" fill="#d9d4c5" stroke="#55564f" stroke-width="4"/><path d="m306 201 116-95 116 95" fill="#674c43" stroke="#493b38" stroke-width="6"/><path d="M422 108V32m-18 25h36" stroke="#493b38" stroke-width="7"/><path d="M395 252a27 27 0 0 1 54 0v93h-54Z" fill="#765f4b"/><path d="M360 220h26v36h-26Zm72-2h25v36h-25Zm65 2h26v36h-26Z" fill="#83aeb5" stroke="#655d53" stroke-width="3"/><g fill="#344f42"><path d="M72 288v-96l-39 57h25l-30 39Zm670 12v-100l-40 58h26l-30 42Z"/></g>`;

const exitArt = `
<defs><linearGradient id="esky" x2="0" y2="1"><stop stop-color="#829eb5"/><stop offset="1" stop-color="#e8cfa4"/></linearGradient></defs><rect width="800" height="360" fill="url(#esky)"/><circle cx="690" cy="68" r="30" fill="#ffe6b0"/><path d="M0 230 135 125l108 90 152-136 147 149 112-83 146 93v122H0Z" fill="#657b70"/><path d="M0 277Q180 240 350 277T800 255V360H0Z" fill="#7e875c"/><path d="M310 360q45-74 92-105t83-106q24 56 68 93t114 118" fill="none" stroke="#c8b389" stroke-width="35"/><path d="M425 254q44-30 88-2" fill="none" stroke="#5d5546" stroke-width="10"/><path d="M455 253v-20m26 18v-22m27 24v-18" stroke="#5d5546" stroke-width="5"/><g fill="#425d48"><path d="M80 300v-95l-38 56h24l-30 39Zm650 0v-95l-38 56h24l-30 39Z"/></g>`;

const scenes = {
  start: {
    title: 'The Missing Three', place: 'Alder Hollow', art: villageArt,
    objective: 'Find out where Lane went and who will join you.',
    body: 'Morning settles over the village. Three friends were meant to meet here, but Lane has already gone ahead. Ellis is at the farmhouse; Bell is at the church. The old hand pump stands beside the green, where years of village talk have gathered.',
    actions: [
      { label: 'Visit the farmhouse', to: 'farm', set: { companion: 'Ellis' } },
      { label: 'Visit the church', to: 'church', set: { companion: 'Bell' } },
      { label: 'Investigate the old pump', to: 'pump' }
    ]
  },
  pump: {
    title: 'The Old Pump', place: 'Alder Hollow · Village green', art: villageArt,
    objective: 'Learn what the village remembers.',
    body: 'A strip of faded blue cloth is caught beneath the pump handle, and a muddy print points toward the old crossing road. Someone says Lane left before dawn. The schoolhouse bell rings once from the far end of the green: the friend you do not meet first has gone there independently, rather than following you.',
    actions: [
      { label: 'Visit the farmhouse', to: 'farm', set: { companion: 'Ellis' } },
      { label: 'Visit the church', to: 'church', set: { companion: 'Bell' } }
    ]
  },
  farm: {
    title: 'The Farmhouse', place: 'Alder Hollow · North fields', art: farmArt,
    objective: 'Find Lane’s trail.',
    body: 'Ellis steps onto the farmhouse stoop. “Lane came through before dawn and said they were heading ahead, toward the old crossing.” Ellis will join you. Bell has set off for the schoolhouse on their own; no one is waiting for you to gather the others.',
    actions: [{ label: 'Head for the village green', to: 'village-exit' }, { label: 'Check the church on the way', to: 'church-after-farm' }]
  },
  church: {
    title: 'The Church', place: 'Alder Hollow · Hill lane', art: churchArt,
    objective: 'Find Lane’s trail.',
    body: 'Bell waits beside the church gate. “Lane came by before sunrise,” Bell says. “They went ahead toward the old crossing.” Bell joins you. Ellis has gone to the schoolhouse independently, not after you.',
    actions: [{ label: 'Head for the village green', to: 'village-exit' }, { label: 'Check the farmhouse on the way', to: 'farm-after-church' }]
  },
  'church-after-farm': {
    title: 'The Church', place: 'Alder Hollow · Hill lane', art: churchArt,
    objective: 'Continue with Ellis.',
    body: 'The churchyard is quiet. Bell has left for the schoolhouse, following their own errand rather than your route. You and Ellis turn back toward the village green and the road beyond.',
    actions: [{ label: 'Leave the village', to: 'village-exit' }]
  },
  'farm-after-church': {
    title: 'The Farmhouse', place: 'Alder Hollow · North fields', art: farmArt,
    objective: 'Continue with Bell.',
    body: 'The farmhouse is quiet now. Ellis has gone to the schoolhouse independently. Bell points out the track leading from the green toward the old crossing, and you head that way together.',
    actions: [{ label: 'Leave the village', to: 'village-exit' }]
  },
  'village-exit': {
    title: 'Lane Went Ahead', place: 'Alder Hollow · The old crossing road', art: exitArt,
    objective: 'Continue beyond the village.',
    body: 'At the village edge, the muddy print from the old pump matches a fresh trail leading toward the crossing. Lane is already ahead. {{companion}} walks beside you as Alder Hollow falls quiet behind.',
    actions: [{ label: 'Continue the journey', to: '@next' }]
  }
};

export default function scene(s) {
  const node = typeof s?.node === 'string' ? s.node : 'start';
  const selected = scenes[node] || scenes.start;
  const companion = s?.companion === 'Ellis' || s?.companion === 'Bell' ? s.companion : 'your friend';
  return selected.body.includes('{{companion}}')
    ? { ...selected, body: selected.body.replace('{{companion}}', companion) }
    : selected;
}
