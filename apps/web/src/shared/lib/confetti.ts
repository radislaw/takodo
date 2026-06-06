import confetti from 'canvas-confetti'

const REWARD_COLORS = ['#FFAB6E', '#FFD1A8', '#A8D5FF', '#B8F0C8', '#FFE08A']

export function fireConfetti(): void {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: REWARD_COLORS,
    disableForReducedMotion: true,
  })
}

export function fireFireworks(): void {
  const duration = 1500
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: REWARD_COLORS,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: REWARD_COLORS,
      disableForReducedMotion: true,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}
