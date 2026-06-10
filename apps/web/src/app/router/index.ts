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
    path: '/do',
    meta: { chrome: false },
    component: () => import('@/pages/do').then((m) => m.DoPage),
  },
  {
    path: '/tasks',
    component: () => import('@/pages/tasks').then((m) => m.TasksPage),
  },
  {
    path: '/tasks/:id',
    component: () => import('@/pages/tasks').then((m) => m.TaskDetailPage),
  },
  {
    path: '/frequent',
    component: () => import('@/pages/frequent').then((m) => m.FrequentPage),
  },
  {
    path: '/rewards',
    component: () => import('@/pages/rewards').then((m) => m.RewardsPage),
  },
  {
    path: '/profile',
    component: () => import('@/pages/profile').then((m) => m.ProfilePage),
  },
  {
    path: '/design/tokens',
    meta: { chrome: false },
    component: () => import('@/pages/design-tokens').then((m) => m.DesignTokensPage),
  },
  {
    path: '/design/ui',
    meta: { chrome: false },
    component: () => import('@/pages/design-ui').then((m) => m.DesignUiPage),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})
