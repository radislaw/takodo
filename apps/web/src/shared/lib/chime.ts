let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playNote(audioCtx: AudioContext, frequency: number, startTime: number, duration: number) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.frequency.value = frequency
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.18, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function playChime(): void {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const now = audioCtx.currentTime
  playNote(audioCtx, 880, now, 0.15)
  playNote(audioCtx, 1318, now + 0.18, 0.18)
}
