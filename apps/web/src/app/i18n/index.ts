import { createI18n } from 'vue-i18n'
import ru from '@/locales/ru.json'
import { ruPlural } from './plural'

export type MessageSchema = typeof ru

declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}

export const i18n = createI18n<[MessageSchema], 'ru'>({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages: { ru },
  pluralRules: { ru: ruPlural },
  datetimeFormats: {
    ru: {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
    },
  },
  numberFormats: {
    ru: {
      decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 },
    },
  },
})

export function setLocale(locale: 'ru') {
  document.documentElement.lang = locale
}

setLocale('ru')
