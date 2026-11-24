export default function scene(s) {
  const companion = s.companion === 'Bell' ? 'Bell' : 'Ellis';
  const other = companion === 'Bell' ? 'Ellis' : 'Bell';
  const helped = Boolean(s.helped);
  const checked = s.rollCall || {};
  const together = s.route === 'together';

  const scenes = {
    start: {
      title: 'Roll Call',
      place: 'The schoolhouse',
      objective: 'Find Lane and account for everyone before the morning fog closes over the road.',
      body: `${together ? `The longer road cost you the morning. ${other} has already lit the stove when you and ${companion} push open the schoolhouse door together.` : `Fresh from the rendezvous, you and ${companion} beat the rain to the schoolhouse. Just as you hang up your coats, ${other} arrives from the village.`} ${helped ? 'The soldier you helped with his blanket roll has reached shelter too, and leaves it folded by the door.' : 'The soldier’s blanket roll rests by the door, damp from the walk.'} The bell gives one thin note. A slate lists Ellis, Bell, and Lane. Lane is still missing; the orchard path vanishes into the mist.`,
      art: `<rect width="800" height="360" fill="#b8c7c2"/><path d="M0 218Q160 168 310 214T800 202V360H0Z" fill="#718b79"/><path d="M80 190L400 52 720 190Z" fill="#6b4d43"/><path d="M125 178V326H675V178L400 62Z" fill="#c5a779" stroke="#4a443b" stroke-width="7"/><path d="M353 326V229Q400 186 447 229V326Z" fill="#43534d"/><rect x="180" y="212" width="82" height="69" fill="#a9c7c0" stroke="#554c42" stroke-width="6"/><path d="M221 212V281M180 246H262" stroke="#554c42" stroke-width="5"/><rect x="540" y="212" width="82" height="69" fill="#a9c7c0" stroke="#554c42" stroke-width="6"/><path d="M581 212V281M540 246H622" stroke="#554c42" stroke-width="5"/><path d="M389 20V66M372 20H406" stroke="#51463c" stroke-width="6"/><circle cx="400" cy="16" r="9" fill="#bd9d62"/><path d="M0 330H800" stroke="#485c4f" stroke-width="9"/><path d="M80 344Q180 316 300 344M520 344Q640 314 760 344" fill="none" stroke="#d7c39a" stroke-width="8"/>`,
      actions: [
        { label: 'Follow the orchard path and call Lane’s name', to: 'orchard' },
        { label: 'Check the schoolhouse and gather the roll', to: 'roll' },
      ],
    },
    orchard: {
      title: 'A Voice in the Mist',
      place: 'The orchard path',
      objective: 'Bring Lane back safely.',
      body: 'Beyond the fence, the path disappears between wind-bent apple trees. You call once, then listen. A reply comes from a shallow drainage hollow: Lane is cold and shaken, but unhurt. They had slipped off the muddy track and could not find the gate. You offer an arm and walk together toward the schoolhouse.',
      art: `<rect width="800" height="360" fill="#b7c5bc"/><path d="M0 240Q150 192 300 236T800 220V360H0Z" fill="#647e68"/><path d="M0 306Q210 264 400 306T800 292V360H0Z" fill="#836f52"/><path d="M60 310Q170 235 268 310M520 304Q600 216 742 302" fill="none" stroke="#d6bd87" stroke-width="18"/><path d="M130 220V78M220 232V100M620 230V70M704 232V105" stroke="#634a39" stroke-width="18"/><circle cx="130" cy="92" r="56" fill="#627b61"/><circle cx="219" cy="112" r="58" fill="#708767"/><circle cx="621" cy="87" r="64" fill="#627b61"/><circle cx="704" cy="112" r="56" fill="#71866a"/><circle cx="105" cy="112" r="8" fill="#b56a4c"/><circle cx="242" cy="91" r="8" fill="#b56a4c"/><circle cx="643" cy="104" r="8" fill="#b56a4c"/><path d="M387 282V232M376 245L398 245" stroke="#394d48" stroke-width="7"/><circle cx="387" cy="222" r="12" fill="#c8a47b"/><path d="M387 239L375 274H399Z" fill="#7f5348"/><path d="M0 62Q180 20 360 62T800 52M0 112Q180 70 360 112T800 102" fill="none" stroke="#edf0e8" stroke-width="12" opacity=".6"/>`,
      actions: [{ label: 'Walk Lane back to the schoolhouse', to: 'roll', set: { laneFound: true } }],
    },
    roll: {
      title: 'Names on the Slate',
      place: 'The schoolhouse',
      objective: 'Check the roll and choose how to reunite the group.',
      body: `The slate has three separate lines, each waiting for a check. ${checked.Ellis ? 'Ellis is checked present.' : 'Ellis has not answered yet.'} ${checked.Bell ? 'Bell is checked present.' : 'Bell has not answered yet.'} ${checked.Lane ? 'Lane is checked present.' : s.laneFound ? 'Lane has returned and is ready to answer.' : 'Lane is still missing beyond the orchard.'} ${helped ? 'The soldier’s blanket lies drying near the stove; the kindness you showed him brought him here safely.' : 'The soldier has settled by the stove with his blanket roll.'} Mark each name yourself; no one is counted by assumption.`,
      art: `<rect width="800" height="360" fill="#aabbb5"/><path d="M0 248Q180 188 350 238T800 216V360H0Z" fill="#667e6d"/><path d="M145 218L400 68 656 218Z" fill="#594a42"/><rect x="193" y="205" width="414" height="125" fill="#b89d76" stroke="#514840" stroke-width="7"/><rect x="310" y="220" width="180" height="95" fill="#d4c9a8" stroke="#514840" stroke-width="5"/><path d="M337 248H462M337 271H446M337 294H458" stroke="#536454" stroke-width="5"/>${['Ellis','Bell','Lane'].map((n,i)=>checked[n]?`<path d="M322 ${244+i*23}l5 5 9-10" fill="none" stroke="#526b50" stroke-width="4"/>`:'').join('')}<rect x="90" y="218" width="68" height="84" fill="#9fbab4" stroke="#514840" stroke-width="6"/><rect x="650" y="218" width="68" height="84" fill="#9fbab4" stroke="#514840" stroke-width="6"/><path d="M0 330H800" stroke="#465c4e" stroke-width="10"/><circle cx="566" cy="169" r="16" fill="#caa47e"/><path d="M550 188H582L592 224H542Z" fill="#75534a"/>`,
      actions: [
        ...(!checked.Ellis ? [{ label: 'Call Ellis and check the name', to: 'roll', set: { rollCall: { ...checked, Ellis: true } } }] : []),
        ...(!checked.Bell ? [{ label: 'Call Bell and check the name', to: 'roll', set: { rollCall: { ...checked, Bell: true } } }] : []),
        ...(s.laneFound && !checked.Lane ? [{ label: 'Hear Lane answer and check the name', to: 'roll', set: { rollCall: { ...checked, Lane: true } } }] : []),
        ...(!s.laneFound ? [{ label: 'Go out together and find Lane', to: 'orchard' }] : []),
        ...(checked.Ellis && checked.Bell && checked.Lane ? [{ label: 'Close the completed roll call', to: 'complete' }] : []),
      ],
    },
    complete: {
      title: 'Roll Call Complete',
      place: 'The schoolhouse',
      objective: 'Everyone is accounted for.',
      art: `<rect width="800" height="360" fill="#d3c5a0"/><path d="M0 260Q170 220 350 254T800 242V360H0Z" fill="#958465"/><path d="M145 215L400 66 655 215Z" fill="#54483f"/><rect x="186" y="207" width="428" height="127" fill="#b99b70" stroke="#51483f" stroke-width="7"/><rect x="319" y="235" width="162" height="99" fill="#47564a" stroke="#51483f" stroke-width="5"/><path d="M275 323V255M400 323V244M525 323V255" stroke="#394943" stroke-width="8"/><circle cx="275" cy="245" r="16" fill="#cba77f"/><circle cx="400" cy="234" r="16" fill="#cba77f"/><circle cx="525" cy="245" r="16" fill="#cba77f"/><path d="M256 264H294L304 320H246ZM381 253H419L429 320H371ZM506 264H544L554 320H496Z" fill="#765449"/>`,
      body: `The slate now bears three clear checks: Ellis, Bell, and Lane. ${together ? `${companion} sets two muddy boots by the stove. The long way round felt shorter with someone to talk to.` : `${companion} taps the mark you used to find one another beyond the crossing. “Next time, we walk together.”`} ${helped ? 'The soldier you helped has found shelter with his blanket.' : 'The soldier is safe beside his blanket roll.'} Each person is accounted for; the schoolhouse holds everyone until the weather clears.`,
      actions: [{ label: 'Continue', to: '@next' }],
    },
  };
  return { ...scenes[s.node || 'start'] || scenes.start };
}
