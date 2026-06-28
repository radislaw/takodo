import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { hasSession } from '@/shared/lib/authStorage'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/login',
    meta: { chrome: false, public: true },
    component: () => import('@/pages/login').then((m) => m.LoginPage),
  },
  {
    path: '/signup',
    meta: { chrome: false, public: true },
    component: () => import('@/pages/login').then((m) => m.LoginPage),
  },
  {
    path: '/auth/callback',
    meta: { chrome: false, public: true },
    component: () => import('@/pages/login').then((m) => m.OAuthCallbackPage),
  },
  {
    path: '/today',
    component: () => import('@/pages/today').then((m) => m.TodayPage),
  },
  {
    path: '/assistant',
    component: () => import('@/pages/assistant').then((m) => m.AssistantPage),
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
    path: '/help',
    component: () => import('@/pages/help').then((m) => m.HelpPage),
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

// Auth gate: unauthenticated users are sent to /login (keeping where they
// were headed); authenticated users skip the auth pages.
router.beforeEach((to) => {
  const authed = hasSession()
  const isPublic = to.meta.public === true
  if (!authed && !isPublic) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (authed && (to.path === '/login' || to.path === '/signup')) {
    return { path: '/today' }
  }
  return true
})
