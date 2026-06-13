import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ProfileFeedback from './ProfileFeedback.vue'

const mockSubmit = vi.fn().mockResolvedValue(undefined)

vi.mock('@/shared/api', () => ({
  useSubmitFeedback: () => ({ mutateAsync: mockSubmit, isLoading: ref(false) }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function mountFeedback() {
  return mount(ProfileFeedback)
}

describe('ProfileFeedback', () => {
  it('renders kind buttons, message and submit', () => {
    const w = mountFeedback()
    expect(w.find('[data-test="feedback-kind-review"]').exists()).toBe(true)
    expect(w.find('[data-test="feedback-kind-wish"]').exists()).toBe(true)
    expect(w.find('[data-test="feedback-kind-support"]').exists()).toBe(true)
    expect(w.find('[data-test="feedback-message"]').exists()).toBe(true)
    expect(w.find('[data-test="feedback-submit"]').exists()).toBe(true)
  })

  it('shows the rating row only for reviews', async () => {
    const w = mountFeedback()
    expect(w.find('[data-test="feedback-rating"]').exists()).toBe(true)
    await w.find('[data-test="feedback-kind-wish"]').trigger('click')
    expect(w.find('[data-test="feedback-rating"]').exists()).toBe(false)
  })

  it('disables submit when the message is empty', () => {
    const w = mountFeedback()
    expect(w.find('[data-test="feedback-submit"]').attributes('disabled')).toBeDefined()
  })

  it('submits a review with the message', async () => {
    const w = mountFeedback()
    await w.find('[data-test="feedback-message"]').setValue('Класс!')
    await w.find('[data-test="feedback-submit"]').trigger('click')
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'review', message: 'Класс!' }),
    )
  })

  it('submits a wish without a rating', async () => {
    const w = mountFeedback()
    await w.find('[data-test="feedback-kind-wish"]').trigger('click')
    await w.find('[data-test="feedback-message"]').setValue('Хочу виджет')
    await w.find('[data-test="feedback-submit"]').trigger('click')
    const arg = mockSubmit.mock.calls[0]?.[0] as Record<string, unknown>
    expect(arg.kind).toBe('wish')
    expect(arg).not.toHaveProperty('rating')
  })

  it('does not submit when the message is blank', async () => {
    const w = mountFeedback()
    await w.find('[data-test="feedback-message"]').setValue('   ')
    await w.find('[data-test="feedback-submit"]').trigger('click')
    expect(mockSubmit).not.toHaveBeenCalled()
  })
})
