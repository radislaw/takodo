import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/design/tokens',
  },
  {
    path: '/design/tokens',
    component: () => import('@/pages/design-tokens').then((m) => m.DesignTokensPage),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
