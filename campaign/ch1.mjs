const villageArt = `
<defs>
  <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#8dc7d4"/><stop offset="1" stop-color="#f3d5a2"/></linearGradient>
  <linearGradient id="field" x2="0" y2="1"><stop stop-color="#a7b979"/><stop offset="1" stop-color="#667d57"/></linearGradient>
</defs>
<rect width="800" height="360" fill="url(#sky)"/>
<circle cx="658" cy="76" r="34" fill="#ffe6a0"/>
<path d="M0 202 Q125 126 258 194 T520 181 T800 167 V360 H0Z" fill="#819d78"/>
<path d="M0 240 Q145 185 314 232 T620 218 T800 231 V360 H0Z" fill="url(#field)"/>
<path d="M0 304 Q202 268 403 304 T800 284 V360 H0Z" fill="#c7b27b"/>
<path d="M362 360 Q398 302 450 274 Q491 246 528 210" fill="none" stroke="#e6d6ae" stroke-width="25"/>
<g transform="translate(120 137)"><path d="M0 57 60 12 120 57v76H0Z" fill="#e4d2ad" stroke="#655b4a" stroke-width="3"/><path d="m-8 58 68-54 68 54" fill="#765843" stroke="#554737" stroke-width="5"/><rect x="48" y="87" width="24" height="46" fill="#735842"/><rect x="15" y="73" width="19" height="20" fill="#82999a"/><rect x="86" y="73" width="19" height="20" fill="#82999a"/><path d="M60 4v-16" stroke="#554737" stroke-width="3"/></g>
<g transform="translate(555 134)"><path d="M0 62 56 14 112 62v84H0Z" fill="#ddd5c1" stroke="#5d5b55" stroke-width="3"/><path d="m-9 63 65-57 65 57" fill="#765447" stroke="#51433c" stroke-width="5"/><path d="M56 6v-37m-11 13h22" stroke="#51433c" stroke-width="5"/><rect x="46" y="97" width="21" height="49" fill="#695849"/><path d="M21 78h15v25H21Zm56 0h15v25H77Z" fill="#77929a"/></g>
<g fill="#526c4b"><path d="M72 229v-64l-25 35h16l-22 29Zm48 17v-78l-31 45h20l-25 33Zm618-23v-72l-27 42h18l-23 30Z"/></g>
<path d="M0 338q60-18 120 0t120 0t120 0t120 0t120 0t120 0t120 0" fill="none" stroke="#4e6849" stroke-width="5"/>`;

const scenes = {
  start: {
    title: 'The Missing Three', place: 'Alder Hollow',
    objective: 'Find out where the others went.',
    body: 'A pale morning settles over the village. Three friends were meant to meet here, but only two familiar places offer any sign of them: the farmhouse at the edge of the fields and the little church above the lane. Visit both; whoever you find first will come with you. The third, Lane, has not been seen.',
    actions: [{ label: 'Visit the farmhouse', to: 'farm' }, { label: 'Visit the church', to: 'church' }]
  },
  farm: {
    title: 'The Farmhouse', place: 'Alder Hollow · North fields',
    objective: 'Check the farmhouse, then visit the church.', art: villageArt,
    body: 'Ellis steps out onto the farmhouse stoop, brushing dust from a sleeve. “I was waiting for everyone. Lane came through before dawn and said they were heading ahead, toward the old crossing.” Ellis looks down the lane, then back to you. “Let’s find Bell before we follow.”',
    actions: [{ label: 'Go to the church', to: 'church-after-farm', set: { companion: 'Ellis', route: 'farm-first', helped: true } }]
  },
  church: {
    title: 'The Church', place: 'Alder Hollow · Hill lane',
    objective: 'Check the church, then visit the farmhouse.', art: villageArt,
    body: 'Bell is waiting beside the church gate, watching the quiet road. “Lane came by before sunrise,” Bell says. “They went ahead toward the old crossing. I thought the rest of you were right behind.” Bell offers to join you, but first you both agree to check the farmhouse.',
    actions: [{ label: 'Go to the farmhouse', to: 'farm-after-church', set: { companion: 'Bell', route: 'church-first', helped: true } }]
  },
  'church-after-farm': {
    title: 'The Church', place: 'Alder Hollow · Hill lane',
    objective: 'Learn where Lane went.', art: villageArt,
    body: 'Bell joins you at the gate. Ellis explains what they heard: Lane went ahead toward the old crossing before dawn. Bell nods, more relieved than surprised. “Then we should catch up, together.” The three of you set out along the village lane.',
    actions: [{ label: 'Follow Lane’s trail', to: 'lane-ahead' }]
  },
  'farm-after-church': {
    title: 'The Farmhouse', place: 'Alder Hollow · North fields',
    objective: 'Learn where Lane went.', art: villageArt,
    body: 'Ellis meets you on the farmhouse step. Bell tells them Lane went ahead toward the old crossing before dawn. “That sounds like Lane,” Ellis says, joining you. With both friends together, you turn toward the road out of the village.',
    actions: [{ label: 'Follow Lane’s trail', to: 'lane-ahead' }]
  },
  'lane-ahead': {
    title: 'Lane Went Ahead', place: 'Alder Hollow · The old crossing road',
    objective: 'Continue beyond the village.', art: villageArt,
    body: 'At the edge of Alder Hollow, fresh footprints leave the main road and continue toward the old crossing. Lane is already ahead. With Ellis or Bell beside you, the village falls quiet behind; the search has become a journey.',
    actions: [{ label: 'Continue the journey', to: '@next', set: { helped: true } }]
  }
};

export default function scene(s) {
  const node = typeof s?.node === 'string' ? s.node : 'start';
  return scenes[node] || scenes.start;
}
