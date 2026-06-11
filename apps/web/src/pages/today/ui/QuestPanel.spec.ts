import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import QuestPanel from './QuestPanel.vue'

interface QuestItem {
  id: string
  target: number
  progress: number
  done: boolean
  claimed: boolean
  tier?: 'common' | 'rare' | 'epic'
  xp?: number
}

const mockClaim = vi.fn()
const questsData = ref<QuestItem[] | undefined>(undefined)

vi.mock('@/shared/api', () => ({
  useQuests: () => ({ data: questsData }),
  useClaimQuest: () => ({ mutateAsync: mockClaim }),
}))

function quest(overrides: Partial<QuestItem> = {}): QuestItem {
  return { id: 'complete_1', target: 1, progress: 0, done: false, claimed: false, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
  questsData.value = [
    quest({ id: 'complete_1', target: 1 }),
    quest({ id: 'add_3', target: 3, progress: 1 }),
    quest({ id: 'complete_mit', target: 1 }),
  ]
})

describe('QuestPanel', () => {
  it('renders quest titles from i18n', () => {
    const wrapper = mount(QuestPanel)
    expect(wrapper.text()).toContain('Выполни 1 задачу')
    expect(wrapper.text()).toContain('Добавь 3 задачи в список')
    expect(wrapper.text()).toContain('Выполни главную задачу дня')
  })

  it('shows progress for unfinished quests', () => {
    const wrapper = mount(QuestPanel)
    expect(wrapper.text()).toContain('1 из 3')
  })

  it('hides claim button when quest is not done', () => {
    const wrapper = mount(QuestPanel)
    expect(wrapper.find('[data-test="quest-claim"]').exists()).toBe(false)
  })

  it('shows claim button when quest is done and unclaimed', () => {
    questsData.value = [quest({ done: true, progress: 1 })]
    const wrapper = mount(QuestPanel)
    expect(wrapper.find('[data-test="quest-claim"]').exists()).toBe(true)
  })

  it('claims the quest on button click', async () => {
    questsData.value = [quest({ id: 'complete_1', done: true, progress: 1 })]
    mockClaim.mockResolvedValue(quest({ claimed: true, tier: 'common', xp: 10 }))
    const wrapper = mount(QuestPanel)
    await wrapper.find('[data-test="quest-claim"]').trigger('click')
    expect(mockClaim).toHaveBeenCalledWith('complete_1')
  })

  it('shows awarded xp and tier on claimed quest', () => {
    questsData.value = [quest({ done: true, progress: 1, claimed: true, tier: 'epic', xp: 50 })]
    const wrapper = mount(QuestPanel)
    expect(wrapper.text()).toContain('+50 XP')
    expect(wrapper.text()).toContain('Эпик')
    expect(wrapper.find('[data-test="quest-claim"]').exists()).toBe(false)
  })

  it('renders nothing while quests are loading', () => {
    questsData.value = undefined
    const wrapper = mount(QuestPanel)
    expect(wrapper.find('[data-test="quest-panel"]').exists()).toBe(false)
  })
})
