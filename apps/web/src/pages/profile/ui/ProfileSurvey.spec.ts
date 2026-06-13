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
    expect(w.find('[data-test="survey-birth-date"]').exists()).toBe(true)
    expect(w.find('[data-test="survey-timezone"]').exists()).toBe(true)
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

  it('saves timezone on change', async () => {
    const w = mountSurvey()
    const input = w.find('[data-test="survey-timezone"]')
    await input.setValue('Europe/Moscow')
    await input.trigger('change')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ timezone: 'Europe/Moscow' })
  })

  it('saves a valid birth date', async () => {
    const w = mountSurvey()
    const input = w.find('[data-test="survey-birth-date"]')
    await input.setValue('1995-06-15')
    await input.trigger('change')
    expect(mockUpdateProfile).toHaveBeenCalledWith({ birthDate: '1995-06-15' })
  })

  it('does not save an empty birth date', async () => {
    const w = mountSurvey()
    const input = w.find('[data-test="survey-birth-date"]')
    await input.setValue('')
    await input.trigger('change')
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('prefills from existing profile values', () => {
    profileData.value = { ...profileData.value, gender: 'male', timezone: 'Europe/Moscow' }
    const w = mountSurvey()
    expect((w.find('[data-test="survey-gender"]').element as HTMLSelectElement).value).toBe('male')
    expect((w.find('[data-test="survey-timezone"]').element as HTMLInputElement).value).toBe(
      'Europe/Moscow',
    )
  })

  it('gender options only contain female and male', () => {
    const w = mountSurvey()
    const select = w.find('[data-test="survey-gender"]')
    const options = select.findAll('option').map((o) => o.attributes('value'))
    expect(options).toContain('female')
    expect(options).toContain('male')
    expect(options).not.toContain('other')
    expect(options).not.toContain('na')
  })
})
