import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { i18n } from '@/app/i18n'
import LoginPage from './LoginPage.vue'

const mockLogin = vi.fn().mockResolvedValue(undefined)
const mockSignup = vi.fn().mockResolvedValue(undefined)
const mockStartOAuth = vi.fn()
const mockReplace = vi.fn()
const routePath = ref('/login')
const routeQuery = ref<Record<string, string>>({})

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useRoute: () => ({
    get path() {
      return routePath.value
    },
    get query() {
      return routeQuery.value
    },
  }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('@/shared/api', () => ({
  useLogin: () => ({ mutateAsync: mockLogin, isLoading: ref(false) }),
  useSignup: () => ({ mutateAsync: mockSignup, isLoading: ref(false) }),
  useOAuthStart: () => ({ mutate: mockStartOAuth, isLoading: ref(false) }),
}))

function mountPage() {
  return mount(LoginPage, { global: { plugins: [i18n], stubs: { AppLogoMark: true } } })
}

beforeEach(() => {
  vi.clearAllMocks()
  routePath.value = '/login'
  routeQuery.value = {}
  setLocale('ru')
})

// i18n.global.locale is a ref at runtime but typed as the literal in build mode.
function setLocale(value: string): void {
  ;(i18n.global.locale as unknown as { value: string }).value = value
}

describe('LoginPage', () => {
  it('renders the login title', () => {
    expect(mountPage().find('h1').text()).toContain('С возвращением')
  })

  it('logs in and redirects to the target on valid input', async () => {
    routeQuery.value = { redirect: '/tasks' }
    const wrapper = mountPage()
    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    expect(mockLogin).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' })
    await Promise.resolve()
    expect(mockReplace).toHaveBeenCalledWith('/tasks')
  })

  it('blocks submit and shows an error on an invalid email', async () => {
    const wrapper = mountPage()
    await wrapper.find('input[type="email"]').setValue('not-an-email')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    expect(mockLogin).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('опечаткой')
  })

  it('uses new-password autocomplete in signup mode', () => {
    routePath.value = '/signup'
    const wrapper = mountPage()
    expect(wrapper.find('input[type="password"]').attributes('autocomplete')).toBe('new-password')
    expect(wrapper.find('h1').text()).toContain('Создать аккаунт')
  })

  it('shows the Yandex button for ru locale', () => {
    const text = mountPage().text()
    expect(text).toContain('Яндекс')
    expect(text).toContain('Google')
  })

  it('hides the Yandex button for non-Yandex locales', () => {
    setLocale('en')
    const text = mountPage().text()
    expect(text).not.toContain('Яндекс')
  })

  it('starts the OAuth flow when a provider button is clicked', async () => {
    const wrapper = mountPage()
    const googleBtn = wrapper.find('button[type="button"]')
    await googleBtn.trigger('click')
    expect(mockStartOAuth).toHaveBeenCalledWith('google')
  })
})
