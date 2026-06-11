import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComebackBanner from './ComebackBanner.vue'

function mountBanner() {
  return mount(ComebackBanner)
}

describe('ComebackBanner', () => {
  it('renders the welcome-back title', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('[data-test="comeback-banner"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('С возвращением')
  })

  it('renders an anti-shame message without guilt framing', () => {
    const wrapper = mountBanner()
    expect(wrapper.text()).toContain('Перерывы — это нормально')
  })

  it('hides after dismiss', async () => {
    const wrapper = mountBanner()
    await wrapper.find('[data-test="comeback-dismiss"]').trigger('click')
    expect(wrapper.find('[data-test="comeback-banner"]').exists()).toBe(false)
  })

  it('dismiss button has an accessible label', () => {
    const wrapper = mountBanner()
    const btn = wrapper.find('[data-test="comeback-dismiss"]')
    expect(btn.attributes('aria-label')).toBeTruthy()
  })
})
