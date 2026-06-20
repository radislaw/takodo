export const MIT_LIMIT = 3

export function canAddMIT(entries: { isMIT: boolean }[]): boolean {
  return entries.filter((e) => e.isMIT).length < MIT_LIMIT
}

export function countMIT(entries: { isMIT: boolean }[]): number {
  return entries.filter((e) => e.isMIT).length
}
