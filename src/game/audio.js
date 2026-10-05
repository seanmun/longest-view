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

function noise({ dur = 0.15, vol = 1, freq = 3000, at = 0 }) {
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
  src.connect(filter).connect(gain).connect(sfxBus)
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
  complete: () => {
    notes([523, 523, 523, 659, 784, 659, 784, 1047], { step: 0.16, dur: 0.22 })
    notes([131, 131, 131, 165, 196, 165, 196, 262], { type: 'triangle', step: 0.16, dur: 0.22, vol: 0.9 })
  },
}

// Looping arena chiptune: Am - F - C - G, bass on eighths, arpeggio on sixteenths
const BPM = 124
const SIXTEENTH = 60 / BPM / 4
const CHORDS = [
  [110, 220, 262, 330], // Am
  [87, 175, 220, 262], // F
  [131, 262, 330, 392], // C
  [98, 196, 247, 294], // G
]
const ARP = [1, 2, 3, 2, 1, 3, 2, 3]
let musicTimer = null
let nextNoteTime = 0
let step = 0

function scheduleMusic() {
  while (nextNoteTime < ctx.currentTime + 0.25) {
    const chord = CHORDS[Math.floor(step / 16) % CHORDS.length]
    const at = nextNoteTime - ctx.currentTime
    if (step % 2 === 0) {
      const octave = step % 4 === 0 ? 1 : 2
      tone({ freq: chord[0] * octave, type: 'triangle', dur: SIXTEENTH * 1.8, vol: 0.9, at, bus: musicBus })
    }
    tone({ freq: chord[ARP[step % ARP.length]] * 2, type: 'square', dur: SIXTEENTH * 0.8, vol: 0.25, at, bus: musicBus })
    nextNoteTime += SIXTEENTH
    step++
  }
}

export function startMusic() {
  if (!ctx || musicTimer) return
  nextNoteTime = ctx.currentTime + 0.1
  step = 0
  musicTimer = setInterval(scheduleMusic, 50)
}

export function stopMusic() {
  clearInterval(musicTimer)
  musicTimer = null
}
