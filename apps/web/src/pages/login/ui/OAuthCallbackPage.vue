<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOAuthCallback, consumePendingProvider } from '@/shared/api'
import { useErrorToast } from '@/shared/lib/useErrorToast'

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const { mutateAsync: completeOAuth } = useOAuthCallback()
const { showError } = useErrorToast()

onMounted(async () => {
  const provider = consumePendingProvider()
  const code = String(route.query.code ?? '')
  const state = String(route.query.state ?? '')

  if (!provider || !code || !state) {
    showError('auth.errors.callbackFailed')
    await router.replace('/login')
    return
  }

  try {
    await completeOAuth({ provider, code, state })
    await router.replace('/today')
  } catch {
    showError('auth.errors.callbackFailed')
    await router.replace('/login')
  }
})
</script>

<template>
  <div class="surface-app flex min-h-dvh items-center justify-center px-6">
    <p class="text-ink-soft font-body text-sm">{{ t('auth.callbackLoading') }}</p>
  </div>
</template>
