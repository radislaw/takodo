import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import BrainDumpBar from './BrainDumpBar.vue'

describe('BrainDumpBar', () => {
  it('emits submit with trimmed title on Enter', async () => {
    const wrapper = mount(BrainDumpBar)
    const input = wrapper.find('input')
    await input.setValue('  Купить коробки  ')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('submit')?.[0]).toEqual(['Купить коробки'])
  })

  it('clears the input after submit', async () => {
    const wrapper = mount(BrainDumpBar)
    const input = wrapper.find('input')
    await input.setValue('Задача')
    await input.trigger('keydown.enter')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('does not emit when input is empty or whitespace', async () => {
    const wrapper = mount(BrainDumpBar)
    const input = wrapper.find('input')
    await input.trigger('keydown.enter')
    await input.setValue('   ')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('disables the input when disabled prop is set', () => {
    const wrapper = mount(BrainDumpBar, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('matches snapshot', () => {
    const wrapper = mount(BrainDumpBar)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
