import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SoftNote from './SoftNote.vue'

describe('SoftNote', () => {
  it('renders slot content', () => {
    const wrapper = mount(SoftNote, { slots: { default: 'Не спеши.' } })
    expect(wrapper.text()).toContain('Не спеши.')
  })

  it('applies sage tone by default', () => {
    const wrapper = mount(SoftNote, { slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('bg-sage-tint')
  })

  it('applies apricot tone', () => {
    const wrapper = mount(SoftNote, {
      props: { tone: 'apricot' },
      slots: { default: 'x' },
    })
    expect(wrapper.classes()).toContain('bg-apricot-tint')
  })

  it('matches snapshot', () => {
    const wrapper = mount(SoftNote, { slots: { default: 'Каждый день — новый старт.' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
