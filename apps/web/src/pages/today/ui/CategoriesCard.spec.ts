import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CategoriesCard from './CategoriesCard.vue'

const counts = [
  { category: 'home', count: 2 },
  { category: 'health', count: 1 },
]

describe('CategoriesCard', () => {
  it('renders a row per category with name and count', () => {
    const wrapper = mount(CategoriesCard, { props: { counts } })
    expect(wrapper.text()).toContain('Дом')
    expect(wrapper.text()).toContain('2 дела')
    expect(wrapper.text()).toContain('Здоровье')
    expect(wrapper.text()).toContain('1 дело')
  })

  it('renders nothing when counts are empty', () => {
    const wrapper = mount(CategoriesCard, { props: { counts: [] } })
    expect(wrapper.find('[data-test="categories-card"]').exists()).toBe(false)
  })

  it('matches snapshot', () => {
    const wrapper = mount(CategoriesCard, { props: { counts } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
