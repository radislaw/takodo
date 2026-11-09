<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLogin, useSignup, useOAuthStart, type OAuthProviderName } from '@/shared/api'
import { AppLogoMark } from '@/shared/ui'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const isSignup = computed(() => route.path === '/signup')

const email = ref('')
const password = ref('')
const name = ref('')
const emailError = ref('')
const passwordError = ref('')

const { mutateAsync: login, isLoading: loginLoading } = useLogin()
const { mutateAsync: signup, isLoading: signupLoading } = useSignup()
const { mutate: startOAuth, isLoading: oauthLoading } = useOAuthStart()

const isLoading = computed(() => loginLoading.value || signupLoading.value || oauthLoading.value)

// Yandex is only shown where it's actually used.
const YANDEX_LOCALES = ['ru', 'kk', 'be', 'uz']
const providers = computed<OAuthProviderName[]>(() => {
  const list: OAuthProviderName[] = ['google', 'apple']
  if (YANDEX_LOCALES.includes(locale.value)) list.splice(1, 0, 'yandex')
  return list
})

function validate(): boolean {
  emailError.value = ''
  passwordError.value = ''
  const value = email.value.trim()
  if (!value) emailError.value = t('auth.errors.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    emailError.value = t('auth.errors.emailInvalid')
  if (!password.value) passwordError.value = t('auth.errors.passwordRequired')
  else if (password.value.length < 8) passwordError.value = t('auth.errors.passwordTooShort')
  return !emailError.value && !passwordError.value
}

async function onSubmit() {
  if (isLoading.value || !validate()) return
  try {
    if (isSignup.value) {
      await signup({
        email: email.value.trim(),
        password: password.value,
        ...(name.value.trim() ? { name: name.value.trim() } : {}),
      })
    } else {
      await login({ email: email.value.trim(), password: password.value })
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/today'
    await router.replace(redirect)
  } catch {
    // Error toast is surfaced by the composable; stay on the page.
  }
}

const inputClass =
  'font-body text-ink bg-cream-deep border-line placeholder:text-ink-faint focus:border-sage focus:shadow-ring focus:surface-card w-full rounded-xl border-[1.5px] px-3 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-45'
</script>

<template>
  <div class="surface-app flex min-h-dvh flex-col items-center justify-center px-6 py-10">
    <div class="surface-card flex w-full max-w-sm flex-col gap-6 rounded-3xl p-7">
      <header class="flex flex-col items-center gap-3 text-center">
        <AppLogoMark class="h-14 w-14" />
        <div class="flex flex-col gap-1">
          <h1 class="font-display text-ink text-xl font-bold">
            {{ isSignup ? t('auth.signupTitle') : t('auth.loginTitle') }}
          </h1>
          <p class="text-ink-soft font-body text-sm">
            {{ isSignup ? t('auth.signupSubtitle') : t('auth.loginSubtitle') }}
          </p>
        </div>
      </header>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <label class="flex flex-col gap-1">
          <span class="text-ink-soft font-body text-xs font-semibold">{{
            t('auth.emailLabel')
          }}</span>
          <input
            v-model="email"
            type="email"
            name="email"
            autocomplete="username"
            inputmode="email"
            :placeholder="t('auth.emailPlaceholder')"
            :disabled="isLoading"
            :aria-invalid="emailError ? 'true' : undefined"
            :class="[inputClass, emailError ? 'border-softrose' : '']"
          />
          <span v-if="emailError" class="text-softrose font-body text-xs">{{ emailError }}</span>
        </label>

        <label v-if="isSignup" class="flex flex-col gap-1">
          <span class="text-ink-soft font-body text-xs font-semibold">{{
            t('auth.nameLabel')
          }}</span>
          <input
            v-model="name"
            type="text"
            name="name"
            autocomplete="name"
            :placeholder="t('auth.namePlaceholder')"
            :disabled="isLoading"
            :class="inputClass"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-ink-soft font-body text-xs font-semibold">{{
            t('auth.passwordLabel')
          }}</span>
          <input
            v-model="password"
            type="password"
            name="password"
            :autocomplete="isSignup ? 'new-password' : 'current-password'"
            :placeholder="t('auth.passwordPlaceholder')"
            :disabled="isLoading"
            :aria-invalid="passwordError ? 'true' : undefined"
            :class="[inputClass, passwordError ? 'border-softrose' : '']"
          />
          <span v-if="passwordError" class="text-softrose font-body text-xs">{{
            passwordError
          }}</span>
        </label>

        <button
          type="submit"
          :disabled="isLoading"
          class="fill-accent font-body focus-visible:shadow-ring mt-1 cursor-pointer rounded-2xl border-none px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(124,154,146,0.28)] outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <template v-if="isSignup">{{
            signupLoading ? t('auth.signingUp') : t('auth.signupButton')
          }}</template>
          <template v-else>{{
            loginLoading ? t('auth.loggingIn') : t('auth.loginButton')
          }}</template>
        </button>
      </form>

      <div class="flex items-center gap-3">
        <span class="bg-line h-px flex-1"></span>
        <span class="text-ink-faint font-body text-xs">{{ t('auth.or') }}</span>
        <span class="bg-line h-px flex-1"></span>
      </div>

      <div class="flex flex-col gap-2">
        <button
          v-for="provider in providers"
          :key="provider"
          type="button"
          :disabled="isLoading"
          class="text-ink border-line font-body focus-visible:shadow-ring cursor-pointer rounded-2xl border bg-transparent px-5 py-3 text-sm font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-40"
          @click="startOAuth(provider)"
        >
          {{ t('auth.continueWith', { provider: t(`auth.providers.${provider}`) }) }}
        </button>
      </div>

      <p class="text-ink-soft font-body text-center text-sm">
        <template v-if="isSignup">
          {{ t('auth.haveAccount') }}
          <RouterLink to="/login" class="text-sage-deep font-semibold">{{
            t('auth.goLogin')
          }}</RouterLink>
        </template>
        <template v-else>
          {{ t('auth.noAccount') }}
          <RouterLink to="/signup" class="text-sage-deep font-semibold">{{
            t('auth.goSignup')
          }}</RouterLink>
        </template>
      </p>
    </div>
  </div>
</template>
