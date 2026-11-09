import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ThemeToggle from './ThemeToggle.vue'

function mountToggle(theme: string) {
  return mount(ThemeToggle, { props: { theme } })
}

describe('ThemeToggle', () => {
  it('shows a moon and offers dark on a light theme', () => {
    const wrapper = mountToggle('light')
    const btn = wrapper.find('[data-test="theme-toggle"]')
    expect(btn.attributes('aria-pressed')).toBe('false')
    expect(btn.attributes('aria-label')).toBe('Включить тёмную тему')
  })

  it('shows a sun and offers light on a dark theme', () => {
    const wrapper = mountToggle('dark')
    const btn = wrapper.find('[data-test="theme-toggle"]')
    expect(btn.attributes('aria-pressed')).toBe('true')
    expect(btn.attributes('aria-label')).toBe('Включить светлую тему')
  })

  it('emits the paired theme on click', async () => {
    const wrapper = mountToggle('ocean')
    await wrapper.find('[data-test="theme-toggle"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['ocean-dark'])
  })

  it('pairs special dark-only themes down to light', async () => {
    const wrapper = mountToggle('amoled')
    await wrapper.find('[data-test="theme-toggle"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['light'])
  })
})
