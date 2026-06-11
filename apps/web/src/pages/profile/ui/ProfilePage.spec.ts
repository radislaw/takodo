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
    data: ref({ name: '', theme: 'light', notifMorning: true, notifEvening: true }),
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

describe('ProfilePage theme unlocks', () => {
  it('renders all theme buttons', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'light').exists()).toBe(true)
    expect(themeButton(wrapper, 'cyberpunk').exists()).toBe(true)
    expect(themeButton(wrapper, 'high-contrast').exists()).toBe(true)
  })

  it('disables locked theme at level 1', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'cyberpunk').attributes('disabled')).toBeDefined()
    expect(themeButton(wrapper, 'lavender').attributes('disabled')).toBeDefined()
  })

  it('keeps base themes enabled at level 1', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'light').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'dark').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'high-contrast').attributes('disabled')).toBeUndefined()
  })

  it('shows lock badge with required level on locked theme', () => {
    const wrapper = mountPage()
    const locked = themeButton(wrapper, 'cyberpunk')
    expect(locked.find('[data-test="theme-lock"]').exists()).toBe(true)
    expect(locked.text()).toContain('Ур. 5')
  })

  it('hides lock badge on unlocked theme', () => {
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'light').find('[data-test="theme-lock"]').exists()).toBe(false)
  })

  it('unlocks themes as level rises', async () => {
    rewardsData.value = { ...rewardsData.value, xp: 400, level: 3 }
    const wrapper = mountPage()
    expect(themeButton(wrapper, 'lavender').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'ocean').attributes('disabled')).toBeUndefined()
    expect(themeButton(wrapper, 'cyberpunk').attributes('disabled')).toBeDefined()
  })

  it('does not call updateProfile when clicking a locked theme', async () => {
    const wrapper = mountPage()
    await themeButton(wrapper, 'cyberpunk').trigger('click')
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('calls updateProfile when clicking an unlocked theme', async () => {
    const wrapper = mountPage()
    await themeButton(wrapper, 'dark').trigger('click')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ theme: 'dark' })
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
