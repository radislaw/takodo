import { useQuery, useQueryCache } from '@pinia/colada'
import { toValue } from 'vue'
import type { Ref } from 'vue'
import type { components } from '../../../../../packages/contract/openapi/types.gen'
import { apiClient } from '@/api/client'
import { useReward } from '@/shared/lib/useReward'
import { useAppMutation } from '@/shared/api/useMutationHelper'

type TaskCreateBody = components['schemas']['TaskCreate']
type TaskUpdateBody = components['schemas']['TaskUpdate']

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
  return useAppMutation({
    mutation: async (body: TaskCreateBody) => {
      const { data } = await apiClient.POST('/tasks', { body })
      if (!data) throw new Error('Failed to create task')
      return data
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useCompleteTask() {
  const queryCache = useQueryCache()
  const { celebrate, hide } = useReward()
  return useAppMutation({
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
    onError: (_err) => {
      hide()
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
  return useAppMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/reopen', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
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
  return useAppMutation({
    mutation: async ({ id, ...body }: { id: string } & TaskUpdateBody) => {
      const { data, error } = await apiClient.PATCH('/tasks/{id}', {
        params: { path: { id } },
        body,
      })
      if (error) throw new Error('Failed to update task')
      return data!
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useDeleteTask() {
  const queryCache = useQueryCache()
  return useAppMutation({
    mutation: async (id: string) => {
      const { error } = await apiClient.DELETE('/tasks/{id}', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to delete task')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useResolveResistance() {
  const queryCache = useQueryCache()
  return useAppMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/resolve-resistance', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to resolve resistance')
      return data!
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
  })
}

export function useRecordFocus() {
  const queryCache = useQueryCache()
  return useAppMutation({
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
