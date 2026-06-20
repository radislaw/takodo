import { useQueryCache } from '@pinia/colada'
import { todayDate } from './daily'

export function useCacheInvalidate() {
  const queryCache = useQueryCache()

  return {
    dailyEntry() {
      const date = todayDate()
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
    dailyNote() {
      queryCache.invalidateQueries({ key: ['daily', todayDate()], exact: true })
    },
    logDone() {
      const date = todayDate()
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
    },
    taskMutation() {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
    },
    taskComplete() {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
    },
    taskFocus() {
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  }
}
