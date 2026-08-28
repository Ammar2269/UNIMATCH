/* ---------------------------------------------------------------------------
   "Where in the World Do You Belong?" — a light personality quiz.

   Deliberately separate from the Match Finder: it ignores budget, subject, and
   degree level entirely, and it is not scored against any verified data. It is
   for fun, and the result copy says so.

   How it scores: every answer adds points on three axes —
     buzz    how much city energy and constant activity you want
     charm   pull toward historic streets, cafes, and old architecture
     calm    pull toward nature, quiet, and space
   plus two smaller flavours: sea (coast) and world (international mix).
   Each destination declares where it sits on those axes; the closest one wins.
--------------------------------------------------------------------------- */

const QUIZ_QUESTIONS = [
  { q: 'Where would you rather wake up every morning?', a: [
    { t: 'A lively city with buildings, cafés, and people everywhere', e: '🏙️', s: { buzz: 3, world: 1 } },
    { t: 'A quiet place surrounded by nature', e: '🌿', s: { calm: 3 } },
    { t: 'Somewhere near the sea', e: '🌊', s: { calm: 1, sea: 3 } } ] },

  { q: 'Your ideal weekend looks like:', a: [
    { t: 'Going out, exploring restaurants, shopping, nightlife', e: '🍸', s: { buzz: 3 } },
    { t: 'Hiking, driving somewhere beautiful, being outdoors', e: '🥾', s: { calm: 3 } },
    { t: 'Relaxing somewhere cozy with a few close people', e: '☕', s: { charm: 2, calm: 1 } } ] },

  { q: 'How do you feel about big crowds?', a: [
    { t: 'I love them — they make me feel alive', e: '❤️', s: { buzz: 3 } },
    { t: "I don't mind them, but I need breaks", e: '🙂', s: { charm: 2, calm: 1 } },
    { t: 'I prefer avoiding them', e: '😌', s: { calm: 3 } } ] },

  { q: 'What kind of city attracts you most?', a: [
    { t: 'Modern, huge, and futuristic', e: '🌆', s: { buzz: 3, world: 2 } },
    { t: 'Historic, beautiful, and full of character', e: '🏛️', s: { charm: 3 } },
    { t: 'Small, charming, and surrounded by nature', e: '🌳', s: { calm: 2, charm: 1 } } ] },

  { q: "What's more important to you?", a: [
    { t: 'Having something exciting happening all the time', e: '🎉', s: { buzz: 3 } },
    { t: 'Having both excitement and peace', e: '⚖️', s: { charm: 2, calm: 1, buzz: 1 } },
    { t: 'Having peace and quiet', e: '🌿', s: { calm: 3 } } ] },

  { q: 'Where would you rather spend an evening?', a: [
    { t: 'Walking through a lively city at night', e: '🌃', s: { buzz: 3 } },
    { t: 'Sitting at a beautiful café or bar in a charming neighbourhood', e: '🍷', s: { charm: 3 } },
    { t: 'Sitting outside somewhere quiet looking at the stars', e: '🌌', s: { calm: 3 } } ] },

  { q: 'How close do you want nature to be?', a: [
    { t: 'I want it right outside my door', e: '🌳', s: { calm: 3 } },
    { t: "I'm happy if it's a short trip away", e: '🚗', s: { charm: 2, calm: 1 } },
    { t: "I don't need much nature around me", e: '🌆', s: { buzz: 3 } } ] },

  { q: 'Which atmosphere feels most like "home"?', a: [
    { t: 'Old streets, historic buildings, cafés, and beautiful architecture', e: '🏛️', s: { charm: 3 } },
    { t: 'Creative, artistic, alternative, and slightly unconventional', e: '🎨', s: { buzz: 2, charm: 1, world: 1 } },
    { t: 'Cozy, peaceful, traditional, and close to nature', e: '🌲', s: { calm: 3 } } ] },

  { q: 'What kind of people would you rather be surrounded by?', a: [
    { t: 'International people from all over the world', e: '🌎', s: { world: 3, buzz: 1 } },
    { t: 'A close-knit local community', e: '🤝', s: { calm: 2, charm: 1 } },
    { t: 'A mixture of locals and international people', e: '🧑‍🤝‍🧑', s: { world: 1, charm: 2 } } ] },

  { q: "Imagine money doesn't matter. Where would you choose to live?", a: [
    { t: 'In the heart of a major world city', e: '🏙️', s: { buzz: 3, world: 2 } },
    { t: 'In a beautiful smaller town or city', e: '🏡', s: { charm: 3 } },
    { t: 'Somewhere incredibly beautiful in nature, near the sea or mountains', e: '🌊🌲', s: { calm: 3, sea: 2 } } ] }
];

/* Destinations. `p` is the profile each one represents on the same axes; the
   result is whichever profile sits closest to the answers. Country names match
   the directory exactly so the university list can be looked up. */
const QUIZ_DESTINATIONS = [
  { country: 'United Arab Emirates', flag: '🇦🇪', city: 'Dubai & Abu Dhabi',
    p: { buzz: 10, charm: 2, calm: 1, sea: 5, world: 10 },
    blurb: 'Built new, built fast, and built for people from everywhere. Skyline in one direction, desert and Gulf coast in the other, and a student body drawn from well over a hundred countries.' },

  { country: 'Netherlands', flag: '🇳🇱', city: 'Amsterdam, Rotterdam, Utrecht',
    p: { buzz: 8, charm: 8, calm: 3, sea: 4, world: 9 },
    blurb: 'Canal houses and cycle lanes, an unusually international student population, and cities small enough to cross by bike but busy enough to never feel quiet.' },

  { country: 'Japan', flag: '🇯🇵', city: 'Tokyo, Kyoto, Osaka',
    p: { buzz: 10, charm: 7, calm: 3, sea: 4, world: 5 },
    blurb: 'The most concentrated city energy on earth, and an hour on a train from mountains, hot springs, and temple towns that have not changed in centuries.' },

  { country: 'Italy', flag: '🇮🇹', city: 'Bologna, Florence, Rome',
    p: { buzz: 6, charm: 10, calm: 4, sea: 6, world: 5 },
    blurb: 'Where the university was invented, and it shows. Stone arcades, long lunches, and a coastline never far away when the cities get too warm.' },

  { country: 'Portugal', flag: '🇵🇹', city: 'Lisbon, Porto, Coimbra',
    p: { buzz: 6, charm: 9, calm: 5, sea: 10, world: 6 },
    blurb: 'Tiled façades, Atlantic light, and hills that end at the water. Warm, unhurried, and one of the gentler places in Europe to arrive as a newcomer.' },

  { country: 'Czechia', flag: '🇨🇿', city: 'Prague, Brno',
    p: { buzz: 6, charm: 10, calm: 5, sea: 0, world: 6 },
    blurb: 'Gothic spires, cellar bars, and a student city that has been one for seven hundred years. Central Europe at its most atmospheric.' },

  { country: 'Germany', flag: '🇩🇪', city: 'Berlin, Leipzig, Heidelberg',
    p: { buzz: 8, charm: 8, calm: 5, sea: 2, world: 8 },
    blurb: 'Room for whichever version of yourself you are after — Berlin for the creative and unconventional, Heidelberg for the old and beautiful, forest never far from either.' },

  { country: 'Switzerland', flag: '🇨🇭', city: 'Zurich, Lausanne, Geneva',
    p: { buzz: 5, charm: 7, calm: 9, sea: 3, world: 8 },
    blurb: 'Lakes, mountains, and small precise cities. Nature is not a weekend trip here; it is visible from the lecture hall window.' },

  { country: 'Norway', flag: '🇳🇴', city: 'Oslo, Bergen, Tromsø',
    p: { buzz: 3, charm: 6, calm: 10, sea: 8, world: 5 },
    blurb: 'Fjords, forest, and long clear northern light. Cities that stop where the water starts, and quiet as a default rather than a luxury.' },

  { country: 'Finland', flag: '🇫🇮', city: 'Helsinki, Tampere, Turku',
    p: { buzz: 3, charm: 5, calm: 10, sea: 6, world: 5 },
    blurb: 'Lakes, birch forest, saunas, and a culture that treats silence as good manners rather than awkwardness. Space to think.' },

  { country: 'New Zealand', flag: '🇳🇿', city: 'Auckland, Wellington, Dunedin',
    p: { buzz: 4, charm: 5, calm: 10, sea: 9, world: 6 },
    blurb: 'Mountains, coast, and empty road in every direction, with small friendly cities tucked between them. About as far from a crowd as a university can put you.' },

  { country: 'Spain', flag: '🇪🇸', city: 'Barcelona, Valencia, Granada',
    p: { buzz: 8, charm: 9, calm: 3, sea: 9, world: 7 },
    blurb: 'Late dinners, old quarters, and the beach on a weekday afternoon. Loud in the best way, and beautiful almost everywhere you look.' }
];

/* ---------------- scoring ---------------- */

const AXES = ['buzz','charm','calm','sea','world'];

function scoreQuiz(answers){
  const totals = { buzz:0, charm:0, calm:0, sea:0, world:0 };
  answers.forEach((choice, i) => {
    const opt = QUIZ_QUESTIONS[i] && QUIZ_QUESTIONS[i].a[choice];
    if(!opt) return;
    Object.entries(opt.s).forEach(([k,v]) => { totals[k] += v; });
  });

  // normalise each axis to 0-10 so destinations can be compared on one scale
  const max = { buzz:24, charm:22, calm:26, sea:5, world:9 };
  const norm = {};
  AXES.forEach(k => { norm[k] = max[k] ? (totals[k] / max[k]) * 10 : 0; });

  // weighted distance: the three main axes decide, sea and world nudge
  const weight = { buzz:1, charm:1, calm:1, sea:0.55, world:0.55 };
  const ranked = QUIZ_DESTINATIONS.map(d => {
    let sum = 0;
    AXES.forEach(k => { const diff = norm[k] - d.p[k]; sum += weight[k] * diff * diff; });
    return { ...d, distance: Math.sqrt(sum) };
  }).sort((a,b) => a.distance - b.distance);

  return { totals, norm, best: ranked[0], runnersUp: ranked.slice(1,3) };
}
