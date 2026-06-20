import { useQuery } from '@pinia/colada'
import { toValue } from 'vue'
import type { Ref } from 'vue'
import type { components } from '../../../../../packages/contract/openapi/types.gen'
import { apiClient } from '@/api/client'
import { useReward } from '@/shared/lib/useReward'
import { useAppMutation } from '@/shared/api/useMutationHelper'
import { useCacheInvalidate } from './cache-deps'

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
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (body: TaskCreateBody) => {
      const { data } = await apiClient.POST('/tasks', { body })
      if (!data) throw new Error('Failed to create task')
      return data
    },
    onSettled: () => inv.taskMutation(),
  })
}

export function useCompleteTask() {
  const inv = useCacheInvalidate()
  const { celebrate } = useReward()
  return useAppMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/complete', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSuccess: () => {
      celebrate()
    },
    onSettled: () => inv.taskComplete(),
  })
}

export function useReopenTask() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/reopen', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: () => inv.taskComplete(),
  })
}

export function useUpdateTask() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async ({ id, ...body }: { id: string } & TaskUpdateBody) => {
      const { data, error } = await apiClient.PATCH('/tasks/{id}', {
        params: { path: { id } },
        body,
      })
      if (error) throw new Error('Failed to update task')
      return data!
    },
    onSettled: () => inv.taskMutation(),
  })
}

export function useDeleteTask() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (id: string) => {
      const { error } = await apiClient.DELETE('/tasks/{id}', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to delete task')
    },
    onSettled: () => inv.taskMutation(),
  })
}

export function useResolveResistance() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/resolve-resistance', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to resolve resistance')
      return data!
    },
    onSettled: () => inv.taskMutation(),
  })
}

export function useRecordFocus() {
  const inv = useCacheInvalidate()
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
    onSettled: () => inv.taskFocus(),
  })
}
