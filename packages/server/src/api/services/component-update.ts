import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { ComponentUpdateRepository } from '../repository/database/component-update'

export type ComponentUpdateWithDate = ComponentUpdate & { dateModified: Date }

export const getComponentUpdates = async (
  branchId: string,
  componentUpdateRepository: ComponentUpdateRepository,
): Promise<ComponentUpdateWithDate[]> => {
  const updates = await componentUpdateRepository.getUpdates(branchId, [
    'dateModified',
  ])

  return normalizeRecentUpdates(updates)
}

export function normalizeRecentUpdates(
  updates: ComponentUpdateWithDate[],
): ComponentUpdateWithDate[] {
  const ascUpdates = updates
    .slice()
    .sort((a, b) => a.dateModified.getTime() - b.dateModified.getTime())
  return ascUpdates.reduce<ComponentUpdateWithDate[]>((prev, curr) => {
    const prevUpdateIndex = prev.findIndex(
      (p) =>
        curr.type !== 'component' &&
        p.type === curr.type &&
        p.name === curr.name &&
        p.componentId === curr.componentId &&
        p.childIndex === curr.childIndex,
    )
    //If there isn't a similar update, add this to the list
    if (prevUpdateIndex < 0) {
      prev.push(curr)
    } else {
      //Otherwise replace because we are doing ascending, so last one wins
      prev[prevUpdateIndex] = curr
    }

    return prev
  }, [])
}
