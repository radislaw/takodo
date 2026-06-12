import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RewardBurst from './RewardBurst.vue'
const EPIC_PRAISE = [
  '21 день! Привычка сложилась!',
  'Три недели подряд — это уже ты!',
  '21 день! Мозг запомнил дорогу!',
]

vi.mock('@/shared/lib/confetti', () => ({
  fireConfetti: vi.fn(),
  fireFireworks: vi.fn(),
}))

import { fireConfetti, fireFireworks } from '@/shared/lib/confetti'

const mockFireConfetti = vi.mocked(fireConfetti)
const mockFireFireworks = vi.mocked(fireFireworks)

function motionAllowed() {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

function motionReduced() {
  window.matchMedia = (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  vi.useFakeTimers()
  mockFireConfetti.mockClear()
  mockFireFireworks.mockClear()
  motionAllowed()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
})

function findStatus() {
  return document.querySelector('[role="status"]')
}

describe('RewardBurst', () => {
  it('renders praise text when show=true', () => {
    wrapper = mount(RewardBurst, { props: { show: true }, attachTo: document.body })
    expect(findStatus()).not.toBeNull()
  })

  it('does not render when show=false', () => {
    wrapper = mount(RewardBurst, { props: { show: false }, attachTo: document.body })
    expect(findStatus()).toBeNull()
  })

  it('emits close after ~1800ms', async () => {
    wrapper = mount(RewardBurst, { props: { show: true }, attachTo: document.body })
    vi.advanceTimersByTime(1800)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('calls confetti seam when show=true and no reduced-motion', () => {
    wrapper = mount(RewardBurst, { props: { show: true }, attachTo: document.body })
    expect(mockFireConfetti).toHaveBeenCalledOnce()
    expect(mockFireFireworks).toHaveBeenCalledOnce()
  })

  it('does NOT call confetti seam when prefers-reduced-motion', () => {
    motionReduced()
    wrapper = mount(RewardBurst, { props: { show: true }, attachTo: document.body })
    expect(mockFireConfetti).not.toHaveBeenCalled()
    expect(mockFireFireworks).not.toHaveBeenCalled()
  })

  it('epic shows praise from the epic pool', async () => {
    wrapper = mount(RewardBurst, { props: { show: true, epic: true }, attachTo: document.body })
    await wrapper.vm.$nextTick()
    const text = findStatus()?.textContent ?? ''
    expect(EPIC_PRAISE.some((p) => text.includes(p))).toBe(true)
  })

  it('epic fires double fireworks', () => {
    wrapper = mount(RewardBurst, { props: { show: true, epic: true }, attachTo: document.body })
    expect(mockFireFireworks).toHaveBeenCalledTimes(2)
  })

  it('extends the celebration when epic escalates while visible', async () => {
    wrapper = mount(RewardBurst, { props: { show: true, epic: false }, attachTo: document.body })
    vi.advanceTimersByTime(1000)
    await wrapper.setProps({ epic: true })
    vi.advanceTimersByTime(1799)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeFalsy()
    vi.advanceTimersByTime(801)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('fires epic fireworks when escalating while visible', async () => {
    wrapper = mount(RewardBurst, { props: { show: true, epic: false }, attachTo: document.body })
    expect(mockFireFireworks).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ epic: true })
    expect(mockFireFireworks).toHaveBeenCalledTimes(3)
  })

  it('switches praise to the epic pool when escalating', async () => {
    wrapper = mount(RewardBurst, { props: { show: true, epic: false }, attachTo: document.body })
    await wrapper.setProps({ epic: true })
    await wrapper.vm.$nextTick()
    const text = findStatus()?.textContent ?? ''
    expect(EPIC_PRAISE.some((p) => text.includes(p))).toBe(true)
  })

  it('epic stays longer before close (~2600ms)', async () => {
    wrapper = mount(RewardBurst, { props: { show: true, epic: true }, attachTo: document.body })
    vi.advanceTimersByTime(1800)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeFalsy()
    vi.advanceTimersByTime(800)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
