import type { DomainTask } from './types.js'

export function bubbleUp(tasks: DomainTask[], taskId: string): DomainTask[] {
  const map = new Map(tasks.map((t) => [t.id, { ...t }]))

  const target = map.get(taskId)
  if (!target || target.parentId === null) return [...map.values()]

  const visited = new Set<string>()
  let currentId: string | null = target.parentId
  while (currentId !== null) {
    if (visited.has(currentId)) break
    visited.add(currentId)
    const parent = map.get(currentId)
    if (!parent) break

    const children = [...map.values()].filter((t) => t.parentId === currentId)
    if (children.every((c) => c.status === 'done')) {
      parent.status = 'done'
      parent.completedAt = new Date()
      currentId = parent.parentId
    } else {
      break
    }
  }

  return [...map.values()]
}

export function reopenTask(tasks: DomainTask[], taskId: string): DomainTask[] {
  const map = new Map(tasks.map((t) => [t.id, { ...t }]))

  const seen = new Set<string>()
  const markOpen = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    const t = map.get(id)
    if (!t) return
    t.status = 'open'
    t.completedAt = null
    for (const child of map.values()) {
      if (child.parentId === id) markOpen(child.id)
    }
  }

  markOpen(taskId)
  return [...map.values()]
}
