import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ProfileSurvey from './ProfileSurvey.vue'

const mockUpdateProfile = vi.fn()
const profileData = ref<Record<string, unknown>>({
  name: '',
  theme: 'light',
  notifMorning: true,
  notifEvening: true,
})

vi.mock('@/shared/api', () => ({
  useProfile: () => ({ data: profileData }),
  useUpdateProfile: () => ({ mutate: mockUpdateProfile }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  profileData.value = { name: '', theme: 'light', notifMorning: true, notifEvening: true }
})

function mountSurvey() {
  return mount(ProfileSurvey)
}

describe('ProfileSurvey', () => {
  it('renders all survey fields', () => {
    const w = mountSurvey()
    expect(w.find('[data-test="survey-gender"]').exists()).toBe(true)
    expect(w.find('[data-test="survey-birth-year"]').exists()).toBe(true)
    expect(w.find('[data-test="survey-city"]').exists()).toBe(true)
    expect(w.find('[data-test="survey-adhd"]').exists()).toBe(true)
  })

  it('saves gender on change', async () => {
    const w = mountSurvey()
    await w.find('[data-test="survey-gender"]').setValue('female')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ gender: 'female' })
  })

  it('saves adhd status on change', async () => {
    const w = mountSurvey()
    await w.find('[data-test="survey-adhd"]').setValue('diagnosed')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ adhdStatus: 'diagnosed' })
  })

  it('saves city on change', async () => {
    const w = mountSurvey()
    const input = w.find('[data-test="survey-city"]')
    await input.setValue('Москва')
    await input.trigger('change')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ city: 'Москва' })
  })

  it('saves a valid birth year', async () => {
    const w = mountSurvey()
    const input = w.find('[data-test="survey-birth-year"]')
    await input.setValue('1995')
    await input.trigger('change')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ birthYear: 1995 })
  })

  it('does not save an out-of-range birth year', async () => {
    const w = mountSurvey()
    const input = w.find('[data-test="survey-birth-year"]')
    await input.setValue('1800')
    await input.trigger('change')
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('prefills from existing profile values', () => {
    profileData.value = { ...profileData.value, gender: 'male', city: 'Питер' }
    const w = mountSurvey()
    expect((w.find('[data-test="survey-gender"]').element as HTMLSelectElement).value).toBe('male')
    expect((w.find('[data-test="survey-city"]').element as HTMLInputElement).value).toBe('Питер')
  })
})
