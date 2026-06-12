import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { toValue } from 'vue'
import type { Ref } from 'vue'
import { apiClient } from '@/api/client'
import { useReward } from '@/shared/lib/useReward'
import { useErrorToast } from '@/shared/lib/useErrorToast'

export function useTasks() {
  return useQuery({
    key: () => ['tasks'],
    query: async () => {
      const { data } = await apiClient.GET('/tasks')
      if (!data) throw new Error('Failed to fetch tasks')
      return data
    },
  })
}

export function useTaskTree(id: Ref<string> | string) {
  return useQuery({
    key: () => ['tasks', toValue(id), 'tree'],
    query: async () => {
      const { data, error } = await apiClient.GET('/tasks/{id}/tree', {
        params: { path: { id: toValue(id) } },
      })
      if (error) throw new Error('Task not found')
      return data!
    },
  })
}

export function useCreateTask() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (body: {
      title: string
      note?: string
      parentId?: string
      estimateMinutes?: number
    }) => {
      const { data } = await apiClient.POST('/tasks', { body })
      if (!data) throw new Error('Failed to create task')
      return data
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useCompleteTask() {
  const queryCache = useQueryCache()
  const { celebrate, hide } = useReward()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/complete', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onMutate: () => {
      celebrate()
    },
    onError: () => {
      hide()
      showError('errors.saveFailed')
    },
    onSettled: () => {
      // Completion changes streak/XP/badges and quest progress too.
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
    },
  })
}

export function useReopenTask() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/reopen', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
    },
  })
}

export function useUpdateTask() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async ({
      id,
      ...body
    }: {
      id: string
      title?: string
      note?: string
      estimateMinutes?: number
    }) => {
      const { data, error } = await apiClient.PATCH('/tasks/{id}', {
        params: { path: { id } },
        body,
      })
      if (error) throw new Error('Failed to update task')
      return data!
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useDeleteTask() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (id: string) => {
      const { error } = await apiClient.DELETE('/tasks/{id}', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to delete task')
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useResolveResistance() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/resolve-resistance', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to resolve resistance')
      return data!
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useRecordFocus() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async ({
      id,
      seconds,
      pomodoro,
    }: {
      id: string
      seconds: number
      pomodoro?: boolean
    }) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/focus', {
        params: { path: { id } },
        body: { seconds, pomodoro },
      })
      if (error) throw new Error('Failed to record focus')
      return data!
    },
    onSettled: () => {
      // Pomodoros feed XP/level.
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}
