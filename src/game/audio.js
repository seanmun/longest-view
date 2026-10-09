// Chiptune sound effects and music, synthesized with the Web Audio API (no files).
// Browsers only allow audio after a tap or key press, so the context is created
// on the first one.
import { getState } from './state.js'

const MUTE_KEY = 'longest-view-muted'
const MUSIC_VOLUME = 0.05
const SFX_VOLUME = 0.25

let ctx = null
let master, sfxBus, musicBus
let muted = false
try { muted = localStorage.getItem(MUTE_KEY) === '1' } catch { /* storage blocked */ }

export const isMuted = () => muted

export function setMuted(value) {
  muted = value
  try { localStorage.setItem(MUTE_KEY, value ? '1' : '0') } catch { /* storage blocked */ }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02)
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
    sfxBus = ctx.createGain()
    sfxBus.gain.value = SFX_VOLUME
    sfxBus.connect(master)
    musicBus = ctx.createGain()
    musicBus.gain.value = MUSIC_VOLUME
    musicBus.connect(master)
  }
  if (ctx.state === 'suspended') ctx.resume()
  const s = getState()
  if (!s.intro && !s.complete) startMusic()
}
window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('keydown', unlockAudio)

// One oscillator note with a quick attack and exponential release
function tone({ freq, to = freq, type = 'square', dur = 0.1, vol = 1, at = 0, bus = sfxBus }) {
  if (!ctx) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(bus)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise(opts) {
  noiseOn(sfxBus, opts)
}

function noiseOn(bus, { dur = 0.15, vol = 1, freq = 3000, at = 0 }) {
  if (!ctx) return
  const t = ctx.currentTime + at
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(gain).connect(bus)
  src.start(t)
}

const notes = (list, { type = 'square', step = 0.09, dur = 0.12, vol = 0.8 } = {}) =>
  list.forEach((freq, i) => tone({ freq, type, dur, vol, at: i * step }))

export const sfx = {
  throw: () => tone({ freq: 500, to: 1400, type: 'triangle', dur: 0.12, vol: 0.7 }),
  bounce: () => tone({ freq: 1800, to: 1200, type: 'square', dur: 0.03, vol: 0.15 }),
  pop: () => { noise({ dur: 0.18, vol: 0.9, freq: 2500 }); tone({ freq: 1600, to: 2600, dur: 0.08, vol: 0.4 }) },
  dizzy: () => notes([880, 740, 880, 740, 660], { type: 'triangle', step: 0.07, dur: 0.08, vol: 0.5 }),
  blip: () => tone({ freq: 660, type: 'square', dur: 0.05, vol: 0.4 }),
  good: () => notes([523, 659, 784, 1047], { step: 0.08 }),
  bad: () => tone({ freq: 220, to: 110, type: 'sawtooth', dur: 0.35, vol: 0.5 }),
  page: () => notes([784, 988, 1175, 1568, 1976], { type: 'triangle', step: 0.07, dur: 0.15 }),
  door: () => notes([392, 523, 659, 784, 1047], { step: 0.12, dur: 0.2 }),
  // Badman's weaselly "hehehehe": quick high bleats wobbling down
  giggle: () => [1320, 1240, 1180, 1100, 1040].forEach((f, i) =>
    tone({ freq: f, to: f * 0.85, type: 'triangle', dur: 0.07, vol: 0.6, at: i * 0.085 })),
  complete: () => {
    notes([523, 523, 523, 659, 784, 659, 784, 1047], { step: 0.16, dur: 0.22 })
    notes([131, 131, 131, 165, 196, 165, 196, 262], { type: 'triangle', step: 0.16, dur: 0.22, vol: 0.9 })
  },
}

// Two looping chiptunes. 'calm' while exploring; 'battle' when a fight is on
// (anti-fans at the door, parking-lot brawls, the Radio Monster). Switching
// waits for the next bar so the change lands on the beat.
const TRACKS = {
  calm: {
    bpm: 124,
    // Am - F - C - G
    chords: [[110, 220, 262, 330], [87, 175, 220, 262], [131, 262, 330, 392], [98, 196, 247, 294]],
    arp: [1, 2, 3, 2, 1, 3, 2, 3],
    lead: 'square',
    drums: false,
  },
  battle: {
    bpm: 156,
    // Dm - Bb - Gm - A: darker, with the A major pulling back to Dm
    chords: [[73, 147, 175, 220], [58, 117, 147, 175], [98, 196, 233, 294], [110, 220, 277, 330]],
    arp: [3, 2, 1, 2, 3, 1, 2, 1],
    lead: 'sawtooth',
    drums: true,
  },
}
let musicTimer = null
let nextNoteTime = 0
let step = 0
let track = TRACKS.calm
let wanted = 'calm'

function kick(at) {
  if (!ctx) return
  tone({ freq: 150, to: 45, type: 'sine', dur: 0.14, vol: 1.6, at, bus: musicBus })
}
function snare(at) {
  noiseOn(musicBus, { dur: 0.1, vol: 0.9, freq: 1800, at })
}

function scheduleMusic() {
  while (nextNoteTime < ctx.currentTime + 0.25) {
    // change tracks at the top of a bar so it lands on the beat
    if (track !== TRACKS[wanted] && step % 16 === 0) { track = TRACKS[wanted]; step = 0 }
    const sixteenth = 60 / track.bpm / 4
    const chord = track.chords[Math.floor(step / 16) % track.chords.length]
    const at = nextNoteTime - ctx.currentTime
    if (step % 2 === 0) {
      const octave = step % 4 === 0 ? 1 : 2
      tone({ freq: chord[0] * octave, type: 'triangle', dur: sixteenth * 1.8, vol: 0.9, at, bus: musicBus })
    }
    tone({ freq: chord[track.arp[step % track.arp.length]] * 2, type: track.lead, dur: sixteenth * 0.8, vol: track.drums ? 0.18 : 0.25, at, bus: musicBus })
    if (track.drums) {
      if (step % 4 === 0) kick(at)
      if (step % 8 === 4) snare(at)
      // brass-ish stab on each new chord
      if (step % 16 === 0) chord.slice(1).forEach((f) => tone({ freq: f * 2, type: 'sawtooth', dur: sixteenth * 3, vol: 0.12, at, bus: musicBus }))
    }
    nextNoteTime += sixteenth
    step++
  }
}

// 'calm' or 'battle'
export function setMusicMood(mood) {
  wanted = mood
}

export function startMusic() {
  if (!ctx || musicTimer) return
  nextNoteTime = ctx.currentTime + 0.1
  step = 0
  track = TRACKS[wanted]
  musicTimer = setInterval(scheduleMusic, 50)
}

export function stopMusic() {
  clearInterval(musicTimer)
  musicTimer = null
}
