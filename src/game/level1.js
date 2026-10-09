// Level 1 cast: where everyone stands. What they ask lives in questions.js
// (`q`). Every question is asked once: right answer and the fan (plus their
// cluster) follows Hinkie; wrong answer and they stay put.
import { COLORS } from './colors.js'

export const TALK_RANGE = 2.6 // m from Hinkie's center to theirs

export const DOOR = { angle: -0.06 } // glass exit doors on the outer wall, just before the finish line
export const DOOR_RANGE = 3.5 // m: close enough to read the door hint
export const ENTER_RANGE = 1.4 // m: walked out through the open doors

// `with: '<id>'` makes a cluster: that person stands beside the fan and is won
// over in the same conversation. `crew` names a cluster in the dialogue box.
// `model: null` (or no model) shows a placeholder until the Meshy model exists.
export const PEOPLE = [
  { id: 'sean', name: 'SEAN', model: 'sean', watch: 'wave', angle: 0.35, r: 29, fan: true, q: 'sean' },
  { id: 'woods', name: 'WOODS', model: 'woods', angle: 1.1, r: 33, color: COLORS.sixersRed, fan: true, q: 'woods' },
  { id: 'pudd', name: 'PUDD', model: 'pudd', with: 'woods', angle: 1.15, r: 34.2, fan: true },
  { id: 'steve', name: 'STEVE', model: 'steve', watch: 'discuss', angle: 2.8, r: 32, fan: true, q: 'steve' },
  { id: 'chav', name: 'CHAV', model: 'chav', watch: 'happy', with: 'steve', angle: 2.835, r: 32.9, fan: true },
  { id: 'kirby', name: 'KIRBY', model: 'kirby', watch: 'wave', angle: 3.7, r: 29, color: COLORS.sixersRed, fan: true, q: 'kirby' },
  // Hinkie's Henchmen: a pack of three, asked the hardest question together
  { id: 'musket', name: 'MUSKET', crew: "HINKIE'S HENCHMEN", model: 'musket', watch: 'wave', angle: 5.5, r: 30, fan: true, q: 'henchmen' },
  // Ian stands with the Henchmen, but whatever Hinkie answers, he loses his
  // faith and runs off to join the anti-fans at the exit (see `defects`)
  { id: 'ian', name: 'IAN', model: 'ian', watch: 'wave', with: 'musket', angle: 5.535, r: 31.1, defects: true },
  { id: 'truant', name: 'TRUANT', model: 'truant', with: 'musket', angle: 5.465, r: 31.1, fan: true, color: COLORS.navy },
]

export const FAN_COUNT = PEOPLE.filter((p) => p.fan).length

// A fan plus everyone standing with them
export const clusterOf = (id) => PEOPLE.filter((p) => p.id === id || p.with === id)

// The mob crowding the glass exit doors, led by Badman (a giggling weasel).
// r / da: radius and angle offset from the door. model: null shows a
// placeholder until that character's Meshy model arrives.
// Rigged mob models share clip names: stomp, stomp2, hit, run. `moods` (optional)
// lists clips a member cycles through while blocking the door; `flee` / `fleeSpeed`
// override how they get away (default: run at 5 m/s).
export const MOB = [
  {
    id: 'badman', name: 'BADMAN', model: 'badman', leader: true, r: 32.7, da: 0, height: 1.9,
    stomp: 'stomp', hitTime: 1.5,
    shouts: ['HEHEHEHEHE!', 'Hehe... JUST WIN GAMES, BRO!', 'HEHEHE! FIRE HIM!'],
  },
  { id: 'pj', name: 'PJ', model: 'pj', r: 33.4, da: -0.05, stomp: 'stomp', hitTime: 2.2, shouts: ['WHAT IS A PING PONG BALL?!'] },
  {
    // Bad knee: taunts and Frankenstein-limps; a hit drops him flat, then he crawls off
    id: 'stine', name: 'STINE', model: 'stine', r: 33.4, da: 0.05, hitTime: 2.9,
    moods: ['taunt', 'limp'], flee: 'crawl', fleeSpeed: 0.8, // matches the crawl clip's pace
    shouts: ['WE WANT WINS!', 'YOU CALL THAT A PLAN?!'],
  },
  {
    id: 'teamike', name: 'TEA MIKE', model: 'teamike', r: 34.8, da: -0.075, hitTime: 2.5,
    moods: ['stomp', 'dance'], shouts: ['BOOOOO!', 'TRUST THE... NO!'],
  },
  {
    id: 'rick', name: 'RICK', model: 'rick', r: 34.8, da: 0.075, hitTime: 2,
    moods: ['stomp', 'tantrum'], shouts: ['ANTI-FAN FOR LIFE!', 'SELL THE TEAM!'],
  },
  {
    // The defector: absent until Ian loses his faith after the Henchmen's question.
    // His model has no stomp/hit clips, so he uses his idle and wave.
    id: 'ian', name: 'IAN', model: 'ian', defector: true, r: 32.2, da: -0.1, hitTime: 1.5,
    stomp: 'happy', hitClip: 'wave', shouts: ['I LOST MY FAITH!', 'NO MORE PROCESS!'],
  },
].map((m) => ({ ...m, angle: DOOR.angle + m.da }))
export const MOB_BARRIER_RADIUS = 2.5 // m around the door, solid until the mob is gone
