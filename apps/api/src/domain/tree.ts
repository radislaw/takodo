import type { DomainTask, TaskNode } from './types.js'

export function assembleTree(tasks: DomainTask[]): TaskNode[] {
  const nodeMap = new Map<string, TaskNode>()
  const roots: TaskNode[] = []

  for (const t of tasks) {
    nodeMap.set(t.id, { ...t, children: [] })
  }

  for (const node of nodeMap.values()) {
    if (node.parentId === null) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  }

  return roots
}
