import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import EveningJournal from './EveningJournal.vue'

const dailyData = ref<{ note?: string } | undefined>({ note: '' })
const mockLogDone = vi.fn().mockResolvedValue({ id: 'e1', taskId: 't1', isMIT: false, order: 0 })
const mockSaveNote = vi.fn().mockResolvedValue(undefined)

vi.mock('@/shared/api', () => ({
  useDailyToday: () => ({ data: dailyData }),
  useLogDoneTask: () => ({ mutateAsync: mockLogDone, isLoading: ref(false) }),
  useUpdateDailyNote: () => ({ mutateAsync: mockSaveNote }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  dailyData.value = { note: '' }
})

describe('EveningJournal', () => {
  it('renders the done-log input and the note textarea', () => {
    const w = mount(EveningJournal)
    expect(w.find('[data-test="evening-done-input"]').exists()).toBe(true)
    expect(w.find('[data-test="evening-note"]').exists()).toBe(true)
  })

  it('disables the log button when the input is empty', () => {
    const w = mount(EveningJournal)
    expect(w.find('[data-test="evening-done-submit"]').attributes('disabled')).toBeDefined()
  })

  it('logs an already-done task and clears the input', async () => {
    const w = mount(EveningJournal)
    await w.find('[data-test="evening-done-input"] input').setValue('Помыл посуду')
    await w.find('[data-test="evening-done-submit"]').trigger('click')
    expect(mockLogDone).toHaveBeenCalledWith('Помыл посуду')
    await w.vm.$nextTick()
    expect(
      (w.find('[data-test="evening-done-input"] input').element as HTMLInputElement).value,
    ).toBe('')
  })

  it('does not log a blank title', async () => {
    const w = mount(EveningJournal)
    await w.find('[data-test="evening-done-input"] input').setValue('   ')
    await w.find('[data-test="evening-done-submit"]').trigger('click')
    expect(mockLogDone).not.toHaveBeenCalled()
  })

  it('seeds the note from the loaded daily list', () => {
    dailyData.value = { note: 'Был хороший день' }
    const w = mount(EveningJournal)
    expect((w.find('[data-test="evening-note"]').element as HTMLTextAreaElement).value).toBe(
      'Был хороший день',
    )
  })

  it('saves the note on blur when it changed', async () => {
    const w = mount(EveningJournal)
    await w.find('[data-test="evening-note"]').setValue('Сегодня гулял')
    await w.find('[data-test="evening-note"]').trigger('blur')
    expect(mockSaveNote).toHaveBeenCalledWith('Сегодня гулял')
  })

  it('does not save the note on blur when unchanged', async () => {
    dailyData.value = { note: 'без изменений' }
    const w = mount(EveningJournal)
    await w.find('[data-test="evening-note"]').trigger('blur')
    expect(mockSaveNote).not.toHaveBeenCalled()
  })
})
