import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'

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

export function useCreateTask() {
  const queryCache = useQueryCache()
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
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: true })
    },
  })
}

export function useCompleteTask() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/complete', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: true })
    },
  })
}

export function useReopenTask() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/reopen', {
        params: { path: { id } },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: true })
    },
  })
}

export function useUpdateTask() {
  const queryCache = useQueryCache()
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
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: true })
    },
  })
}

export function useDeleteTask() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async (id: string) => {
      const { error } = await apiClient.DELETE('/tasks/{id}', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to delete task')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: true })
    },
  })
}

export function useResolveResistance() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async (id: string) => {
      const { data, error } = await apiClient.POST('/tasks/{id}/resolve-resistance', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to resolve resistance')
      return data!
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['tasks'], exact: true })
    },
  })
}
