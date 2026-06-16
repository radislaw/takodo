import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ProfilePage from './ProfilePage.vue'

const mockUpdateProfile = vi.fn()

const rewardsData = ref({
  streak: 0,
  longestStreak: 0,
  shields: 0,
  shieldUsedRecently: false,
  week: [],
  badges: [],
  xp: 0,
  level: 1,
})

vi.mock('@/shared/api', () => ({
  useProfile: () => ({
    data: ref({
      name: '',
      theme: 'light',
      notifMorning: true,
      notifEvening: true,
      language: 'ru',
      timezone: 'Europe/Moscow',
    }),
  }),
  useUpdateProfile: () => ({ mutate: mockUpdateProfile }),
  useRewards: () => ({ data: rewardsData }),
  useNotifications: () => ({
    isSupported: ref(true),
    isBlocked: ref(false),
    isSubscribed: ref(false),
    isRequesting: ref(false),
    requestAndSubscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
  useSubmitFeedback: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isLoading: ref(false),
  }),
}))

function mountPage() {
  return mount(ProfilePage, { shallow: false })
}

function themeButton(wrapper: ReturnType<typeof mountPage>, id: string) {
  return wrapper.find(`[data-test="theme-${id}"]`)
}

beforeEach(() => {
  vi.clearAllMocks()
  rewardsData.value = { ...rewardsData.value, xp: 0, level: 1 }
})

/** Mark the first task as completed so first-task themes unlock. */
function withFirstTask() {
  rewardsData.value = {
    ...rewardsData.value,
    badges: [{ id: 'first_step', earned: true }] as never,
  }
}

describe('ProfilePage theme unlocks', () => {
  it('renders grouped + special + a11y theme buttons (no cloud)', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'light').exists()).toBe(true)
    expect(themeButton(wrapper, 'dark').exists()).toBe(true)
    expect(themeButton(wrapper, 'ocean-dark').exists()).toBe(true)
    expect(themeButton(wrapper, 'amber-dark').exists()).toBe(true)
    expect(themeButton(wrapper, 'cyberpunk').exists()).toBe(true)
    expect(themeButton(wrapper, 'high-contrast').exists()).toBe(true)
    expect(themeButton(wrapper, 'cloud').exists()).toBe(false)
  })

  it('keeps only base themes enabled before the first task', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'light').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'high-contrast').attributes('disabled')).toBeUndefined()
    // dark + high-contrast-dark are first-task gifts — locked until then.
    expect(themeButton(wrapper, 'dark').attributes('disabled')).toBeDefined()
    expect(themeButton(wrapper, 'high-contrast-dark').attributes('disabled')).toBeDefined()
    expect(themeButton(wrapper, 'lavender').attributes('disabled')).toBeDefined()
  })

  it('shows the gift badge on first-task themes before completion', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'dark').find('[data-test="theme-gift"]').exists()).toBe(true)
    expect(
      themeButton(wrapper, 'high-contrast-dark').find('[data-test="theme-gift"]').exists(),
    ).toBe(true)
  })

  it('unlocks dark + high-contrast-dark after the first task', () => {
    withFirstTask()
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'dark').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'high-contrast-dark').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'dark').find('[data-test="theme-gift"]').exists()).toBe(false)
  })

  it('shows lock badge with required level on level-gated theme', () => {
    const wrapper = mountPage()
    const locked = themeButton(wrapper, 'cyberpunk')
    expect(locked.find('[data-test="theme-lock"]').exists()).toBe(true)
    expect(locked.text()).toContain('Ур. 50')
  })

  it('unlocks themes as level rises', async () => {
    rewardsData.value = { ...rewardsData.value, xp: 400, level: 3 }
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'lavender').attributes('disabled')).toBeUndefined() // lvl 2
    expect(themeButton(wrapper, 'eco').attributes('disabled')).toBeUndefined() // lvl 3
    expect(themeButton(wrapper, 'ocean').attributes('disabled')).toBeDefined() // lvl 4
    expect(themeButton(wrapper, 'cyberpunk').attributes('disabled')).toBeDefined() // lvl 50
  })

  it('does not call updateProfile when clicking a locked theme', async () => {
    const wrapper = mountPage()
    await themeButton(wrapper, 'cyberpunk').trigger('click')
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('calls updateProfile when clicking an unlocked theme', async () => {
    const wrapper = mountPage()
    await themeButton(wrapper, 'light').trigger('click')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ theme: 'light' })
  })
})

describe('ProfilePage notifications', () => {
  it('shows notifications section', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-test="notifications-section"]').exists()).toBe(true)
  })

  it('shows enable button when not subscribed', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-test="notif-enable-btn"]').exists()).toBe(true)
  })

  it('hides morning/evening toggles before subscribing', () => {
    const wrapper = mountPage()
    // Before subscription is granted, toggles are not shown
    expect(wrapper.find('[data-test="notif-morning"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="notif-evening"]').exists()).toBe(false)
  })
})
