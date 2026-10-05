// Level 1 cast: where everyone stands and what they say.
// A wrong answer just gets a reply; you can talk again and pick another.
import { COLORS } from './Placeholders.jsx'

export const TALK_RANGE = 2.6 // m from Hinkie's center to theirs

// Missing pages of the analytics binder. All three open the locker-room door.
export const PAGES = [
  { id: 'page1', angle: (1.5 * Math.PI) / 4, r: 27.6 }, // in front of SECTION 104
  { id: 'page2', angle: 3.05, r: 34.8 }, // by a trash can on the outer wall
  { id: 'page3', angle: 5.0, r: 31 }, // middle of the concourse
]
export const PICKUP_RANGE = 1.2 // m
export const DOOR = { angle: -0.06 } // on the outer wall, just before the finish line
export const DOOR_RANGE = 3.5 // m: close enough to read the door
export const ENTER_RANGE = 1.4 // m: walked into the open doorway

export const PEOPLE = [
  {
    id: 'fan1', name: 'FAN', angle: 0.35, r: 29, fan: true,
    line: 'Hinkie! What is a ping pong ball even FOR?!',
    choices: [
      { label: 'The draft lottery. Lose now, win later.', reply: '...So we lose ON PURPOSE? ...That\'s kind of genius.', win: true },
      { label: 'Trust the Process.', reply: 'I don\'t know what that means, but I\'m putting it on a shirt.', win: true },
      { label: 'No comment.', reply: 'Typical.' },
    ],
    after: 'TRUST THE PROCESS! ...I bought the shirt.',
  },
  {
    id: 'fan2', name: 'FAN', angle: 1.1, r: 33, color: COLORS.sixersRed, fan: true,
    line: 'JUST WIN GAMES, BRO!',
    choices: [
      { label: 'Have you considered a draft pick?', reply: 'I\'ve considered booing you.' },
      { label: 'Winning 30 games gets you nowhere. Stars win rings.', reply: '...Wait. Say that again, slower.', win: true },
    ],
    after: 'Stars win rings. Stars. Win. Rings. I\'m telling my brother.',
  },
  {
    id: 'analyst', name: 'ANALYST', angle: 1.9, r: 30, color: COLORS.cream,
    line: 'Sam! The owner wants to sign a 32-year-old point guard. $18 million a year. He can still play!',
    choices: [
      { label: 'Sign him. The fans will love it.', reply: 'Great. We\'ll win 31 games. Again.' },
      { label: 'Pass. We need the cap space in three years.', reply: 'Daryl Morey just texted you a thumbs-up.', win: true },
    ],
    after: 'I keep re-running your numbers. They keep being right.',
  },
  {
    id: 'fan3', name: 'FAN', angle: 2.8, r: 32, fan: true,
    line: 'My kid asked who our best player is. I said "a future second-round pick."',
    choices: [
      { label: 'Exactly. And he\'ll be great by 2019.', reply: '...2019. Okay. I\'m from Philly. We wait.', win: true },
      { label: 'Have you tried the hot dogs?', reply: 'The hot dogs are the only thing winning here.' },
    ],
    after: 'See you in 2019, Sam.',
  },
  {
    id: 'fan4', name: 'FAN', angle: 3.7, r: 29, color: COLORS.sixersRed, fan: true,
    line: 'I paid $90 for this seat to watch us lose by 40!',
    choices: [
      { label: 'The seats are nice, though.', reply: 'THE SEATS ARE NOT NICE.' },
      { label: 'Every loss buys a better lottery ball.', reply: 'So I\'m basically... an investor?', win: true },
    ],
    after: 'I\'m an investor. I\'m telling my wife I\'m an investor.',
  },
  {
    id: 'drunk', name: 'DRUNK FAN', angle: 4.6, r: 33, height: 1.85, fan: true,
    line: '*hic* Are you... the analytics guy? I HATE math.',
    choices: [
      { label: 'Want to talk spreadsheets?', reply: 'NOOOOOO.' },
      { label: 'Math says you\'ve had six beers.', reply: '...The math checks out. TRUST THE PROCESS!', win: true },
    ],
    after: '*hic* Seven now. Still trusting.',
  },
  {
    id: 'fan5', name: 'FAN', angle: 5.5, r: 30, fan: true,
    line: 'Embiid hasn\'t played in two years. TWO YEARS, Sam!',
    choices: [
      { label: 'He\'s resting.', reply: 'For TWO YEARS?!' },
      { label: 'He\'s worth the wait. Trust me.', reply: 'If he ever plays, I\'m naming my dog Jojo.', win: true },
    ],
    after: 'Jojo. The dog\'s name is going to be Jojo.',
  },
]

export const FAN_COUNT = PEOPLE.filter((p) => p.fan).length

// The mob crowding the locker-room door. Each one is [radius, angle offset from the door].
export const MOB = [
  [34.8, -0.075], [33.4, -0.05], [32.7, 0], [33.4, 0.05], [34.8, 0.075],
].map(([r, da], i) => ({ id: `mob${i}`, r, angle: DOOR.angle + da }))
export const MOB_BARRIER_RADIUS = 2.5 // m around the door, solid until the mob is gone
export const MOB_SHOUTS = ['JUST WIN GAMES BRO!', 'FIRE HIM!', 'WHAT IS A PING PONG BALL', 'WE WANT WINS!', 'BOOOO!']
