const audioCtx = () => {
  if (!AudioSystem._ctx) {
    AudioSystem._ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return AudioSystem._ctx
}

export class AudioSystem {
  static _ctx = null
  static _musicGain = null
  static _sfxGain = null
  static _currentMusic = null
  static musicVolume = 0.3
  static sfxVolume = 0.5

  static init() {
    const ctx = audioCtx()
    AudioSystem._musicGain = ctx.createGain()
    AudioSystem._musicGain.gain.value = AudioSystem.musicVolume
    AudioSystem._musicGain.connect(ctx.destination)

    AudioSystem._sfxGain = ctx.createGain()
    AudioSystem._sfxGain.gain.value = AudioSystem.sfxVolume
    AudioSystem._sfxGain.connect(ctx.destination)
  }

  static resume() {
    const ctx = audioCtx()
    if (ctx.state === 'suspended') ctx.resume()
  }

  static setMusicVolume(vol) {
    AudioSystem.musicVolume = vol
    if (AudioSystem._musicGain) {
      AudioSystem._musicGain.gain.value = vol
    }
  }

  static setSfxVolume(vol) {
    AudioSystem.sfxVolume = vol
    if (AudioSystem._sfxGain) {
      AudioSystem._sfxGain.gain.value = vol
    }
  }

  static setMasterVolume(vol) {
    AudioSystem.setMusicVolume(vol * 0.6)
    AudioSystem.setSfxVolume(vol)
  }

  static _playTone(freq, duration, type = 'square', gainVal = 0.3, destination = null) {
    const ctx = audioCtx()
    const dest = destination || AudioSystem._sfxGain || ctx.destination
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(gainVal, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  static _playNotes(notes, type = 'square', gainVal = 0.2) {
    const ctx = audioCtx()
    let time = ctx.currentTime
    notes.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(gainVal, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
      osc.connect(gain)
      gain.connect(AudioSystem._sfxGain || ctx.destination)
      osc.start(time)
      osc.stop(time + dur)
      time += dur * 0.9
    })
  }

  // Sound effects
  static playThrow() {
    AudioSystem._playTone(600, 0.08, 'square', 0.2)
    setTimeout(() => AudioSystem._playTone(900, 0.06, 'square', 0.15), 40)
  }

  static playBounce() {
    AudioSystem._playTone(400, 0.1, 'square', 0.25)
  }

  static playRicochet() {
    AudioSystem._playTone(800, 0.06, 'square', 0.2)
    setTimeout(() => AudioSystem._playTone(1200, 0.08, 'square', 0.15), 30)
  }

  static playEnemyHit() {
    AudioSystem._playTone(150, 0.15, 'square', 0.3)
  }

  static playEnemyDefeated() {
    AudioSystem._playNotes([
      [523, 0.1], [659, 0.1], [784, 0.15]
    ])
  }

  static playBossHit() {
    AudioSystem._playTone(80, 0.2, 'sawtooth', 0.3)
    setTimeout(() => AudioSystem._playTone(60, 0.15, 'square', 0.2), 50)
  }

  static playHealthLost() {
    AudioSystem._playNotes([
      [400, 0.15], [300, 0.15], [200, 0.2]
    ], 'sawtooth', 0.25)
  }

  static playCombo() {
    AudioSystem._playTone(1047, 0.08, 'square', 0.15)
  }

  static playTrustTheProcess() {
    AudioSystem._playNotes([
      [262, 0.12], [330, 0.12], [392, 0.12], [523, 0.12],
      [659, 0.12], [784, 0.15], [1047, 0.25]
    ], 'square', 0.25)
  }

  static playLevelComplete() {
    AudioSystem._playNotes([
      [523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.2],
      [784, 0.1], [1047, 0.3]
    ], 'square', 0.2)
  }

  static playGameOver() {
    AudioSystem._playNotes([
      [400, 0.3], [350, 0.3], [300, 0.3], [200, 0.5]
    ], 'sawtooth', 0.25)
  }

  static playChargeReady() {
    AudioSystem._playTone(1200, 0.1, 'sine', 0.15)
  }

  static playMaxProcess() {
    AudioSystem._playTone(200, 0.15, 'sawtooth', 0.3)
    setTimeout(() => AudioSystem._playTone(400, 0.15, 'square', 0.25), 80)
    setTimeout(() => AudioSystem._playTone(800, 0.2, 'square', 0.2), 160)
  }

  static playPause() {
    // Classic NES-style pause: double "do-do, do-do"
    const ctx = audioCtx()
    const dest = AudioSystem._sfxGain || ctx.destination
    const notes = [
      [660, 0.06], [0, 0.04], [660, 0.06], [0, 0.08],
      [660, 0.06], [0, 0.04], [660, 0.06]
    ]
    let time = ctx.currentTime
    notes.forEach(([freq, dur]) => {
      if (freq === 0) { time += dur; return }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.2, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(time)
      osc.stop(time + dur)
      time += dur
    })
  }

  static playMenuSelect() {
    AudioSystem._playTone(800, 0.06, 'square', 0.15)
  }

  static playMenuConfirm() {
    AudioSystem._playNotes([
      [600, 0.08], [800, 0.1]
    ], 'square', 0.2)
  }

  static playCorrectAnswer() {
    AudioSystem._playNotes([
      [523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.1], [1319, 0.15]
    ])
  }

  static playWrongAnswer() {
    AudioSystem._playNotes([
      [300, 0.15], [200, 0.2]
    ], 'sawtooth', 0.3)
  }

  static playBossIntro() {
    AudioSystem._playTone(60, 0.5, 'sawtooth', 0.3)
    setTimeout(() => AudioSystem._playTone(50, 0.3, 'square', 0.25), 300)
    setTimeout(() => AudioSystem._playTone(80, 0.1, 'square', 0.4), 600)
  }

  // Music system — simple looping chiptune patterns
  static stopMusic() {
    if (AudioSystem._currentMusic) {
      AudioSystem._currentMusic.stop = true
    }
  }

  static playMenuMusic() {
    AudioSystem.stopMusic()
    const music = { stop: false }
    AudioSystem._currentMusic = music

    const melody = [
      [392, 0.25], [440, 0.25], [523, 0.25], [440, 0.25],
      [392, 0.25], [330, 0.25], [392, 0.5],
      [330, 0.25], [294, 0.25], [330, 0.25], [392, 0.25],
      [440, 0.25], [523, 0.5], [440, 0.5]
    ]

    const playLoop = () => {
      if (music.stop) return
      const ctx = audioCtx()
      let time = ctx.currentTime
      melody.forEach(([freq, dur]) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.08, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.9)
        osc.connect(gain)
        gain.connect(AudioSystem._musicGain || ctx.destination)
        osc.start(time)
        osc.stop(time + dur)
        time += dur
      })
      const totalDur = melody.reduce((s, [, d]) => s + d, 0) * 1000
      setTimeout(() => playLoop(), totalDur)
    }
    playLoop()
  }

  static playLevel1Music() {
    AudioSystem.stopMusic()
    const music = { stop: false }
    AudioSystem._currentMusic = music

    const bassline = [
      [131, 0.2], [165, 0.2], [196, 0.2], [165, 0.2],
      [147, 0.2], [175, 0.2], [196, 0.2], [175, 0.2],
      [131, 0.2], [165, 0.2], [196, 0.2], [262, 0.2],
      [196, 0.2], [165, 0.2], [131, 0.4]
    ]

    const playLoop = () => {
      if (music.stop) return
      const ctx = audioCtx()
      let time = ctx.currentTime
      bassline.forEach(([freq, dur]) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.1, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.85)
        osc.connect(gain)
        gain.connect(AudioSystem._musicGain || ctx.destination)
        osc.start(time)
        osc.stop(time + dur)
        time += dur
      })
      const totalDur = bassline.reduce((s, [, d]) => s + d, 0) * 1000
      setTimeout(() => playLoop(), totalDur)
    }
    playLoop()
  }
}
