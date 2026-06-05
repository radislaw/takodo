import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    component: () => import('@/pages/today').then((m) => m.TodayPage),
  },
  {
    path: '/design/tokens',
    component: () => import('@/pages/design-tokens').then((m) => m.DesignTokensPage),
  },
  {
    path: '/design/ui',
    component: () => import('@/pages/design-ui').then((m) => m.DesignUiPage),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
