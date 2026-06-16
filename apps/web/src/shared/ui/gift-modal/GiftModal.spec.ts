import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GiftModal from './GiftModal.vue'
import type { CelebrationEvent } from '@/shared/lib/useProgressCelebration'

vi.mock('@/shared/lib/confetti', () => ({
  fireConfetti: vi.fn(),
  fireFireworks: vi.fn(),
}))
import { fireConfetti } from '@/shared/lib/confetti'
const mockConfetti = vi.mocked(fireConfetti)

const firstTask: CelebrationEvent = {
  kind: 'first-task',
  level: 1,
  themes: ['dark', 'high-contrast-dark'],
  nextGift: 2,
}
const giftLevel: CelebrationEvent = {
  kind: 'level-up',
  level: 2,
  themes: ['lavender', 'lavender-dark'],
  nextGift: 3,
}
const plainLevel: CelebrationEvent = { kind: 'level-up', level: 7, themes: [], nextGift: 8 }
const maxed: CelebrationEvent = {
  kind: 'level-up',
  level: 50,
  themes: ['cyberpunk'],
  nextGift: null,
}

function setMotion(reduced: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches: reduced, media: query, addEventListener() {}, removeEventListener() {} }) as never
}

beforeEach(() => {
  vi.clearAllMocks()
  setMotion(false)
})

describe('GiftModal', () => {
  it('renders nothing without an event', () => {
    const wrapper = mount(GiftModal, { props: { event: null }, attachTo: document.body })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('celebrates the first task and fires confetti', () => {
    const wrapper = mount(GiftModal, { props: { event: firstTask }, attachTo: document.body })
    expect(document.body.textContent).toContain('Первое дело сделано!')
    expect(mockConfetti).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('names the unlocked theme on a gift level-up', () => {
    const wrapper = mount(GiftModal, { props: { event: giftLevel }, attachTo: document.body })
    expect(document.body.textContent).toContain('Уровень 2!')
    expect(document.body.textContent).toContain('Лаванда')
    expect(document.body.textContent).toContain('До следующего подарка: 1')
    wrapper.unmount()
  })

  it('shows a motivational level-up without a theme', () => {
    const wrapper = mount(GiftModal, { props: { event: plainLevel }, attachTo: document.body })
    expect(document.body.textContent).toContain('Уровень 7!')
    expect(document.body.textContent).toContain('До следующего подарка: 1')
    wrapper.unmount()
  })

  it('shows the maxed message after the final gift', () => {
    const wrapper = mount(GiftModal, { props: { event: maxed }, attachTo: document.body })
    expect(document.body.textContent).toContain('собрал их все')
    wrapper.unmount()
  })

  it('emits dismiss when the CTA is clicked', async () => {
    const wrapper = mount(GiftModal, { props: { event: firstTask }, attachTo: document.body })
    // Teleported to body — query the document, not the wrapper root.
    const cta = document.body.querySelector('[data-test="gift-cta"]') as HTMLElement
    cta.click()
    expect(wrapper.emitted('dismiss')).toBeTruthy()
    wrapper.unmount()
  })

  it('skips confetti when reduced motion is requested', () => {
    setMotion(true)
    const wrapper = mount(GiftModal, { props: { event: firstTask }, attachTo: document.body })
    expect(mockConfetti).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
