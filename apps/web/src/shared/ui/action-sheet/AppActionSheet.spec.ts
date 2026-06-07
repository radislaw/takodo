import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppActionSheet from './AppActionSheet.vue'

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  document.body.style.overflow = ''
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.style.overflow = ''
})

function findDialog() {
  return document.querySelector('[role="dialog"]')
}

describe('AppActionSheet', () => {
  it('renders dialog when open=true', () => {
    wrapper = mount(AppActionSheet, { props: { open: true }, attachTo: document.body })
    expect(findDialog()).not.toBeNull()
  })

  it('does not render dialog when open=false', () => {
    wrapper = mount(AppActionSheet, { props: { open: false }, attachTo: document.body })
    expect(findDialog()).toBeNull()
  })

  it('renders title when provided', () => {
    wrapper = mount(AppActionSheet, {
      props: { open: true, title: 'Test title' },
      attachTo: document.body,
    })
    expect(document.body.textContent).toContain('Test title')
  })

  it('emits close on backdrop click', async () => {
    wrapper = mount(AppActionSheet, { props: { open: true }, attachTo: document.body })
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    backdrop.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close on Esc key', async () => {
    wrapper = mount(AppActionSheet, { props: { open: true }, attachTo: document.body })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('locks body scroll when open', () => {
    wrapper = mount(AppActionSheet, { props: { open: true }, attachTo: document.body })
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('unlocks body scroll when closed', async () => {
    wrapper = mount(AppActionSheet, { props: { open: true }, attachTo: document.body })
    await wrapper.setProps({ open: false })
    expect(document.body.style.overflow).toBe('')
  })

  it('unlocks body scroll on unmount', () => {
    wrapper = mount(AppActionSheet, { props: { open: true }, attachTo: document.body })
    wrapper.unmount()
    wrapper = null
    expect(document.body.style.overflow).toBe('')
  })
})
