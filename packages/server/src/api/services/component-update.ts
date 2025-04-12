import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { ComponentUpdateRepository } from '../repository/database/component-update'

export type ComponentUpdateWithDate = ComponentUpdate & { dateModified: Date }

export const getComponentUpdates = async (
  branchId: string,
  componentUpdateRepository: ComponentUpdateRepository,
): Promise<ComponentUpdate[]> => {
  const updates = await componentUpdateRepository.getUpdates(branchId, [
    'dateModified',
  ])

  return normalizeRecentUpdates(updates)
}

export const createComponentUpdates = async (
  updates: ComponentUpdate[],
  branchId: string,
  componentUpdateRepository: ComponentUpdateRepository,
): Promise<ComponentUpdate[]> => {
  const normalizedUpdates = normalizeSortedUpdates(updates)
  return componentUpdateRepository.createUpdates(normalizedUpdates, branchId)
}

export function normalizeRecentUpdates(
  updates: ComponentUpdateWithDate[],
): ComponentUpdate[] {
  const ascUpdates = updates
    .slice()
    .sort((a, b) => a.dateModified.getTime() - b.dateModified.getTime())
  return normalizeSortedUpdates(ascUpdates)
}

export const normalizeSortedUpdates = (
  updates: ComponentUpdate[],
): ComponentUpdate[] => {
  return updates.reduce<ComponentUpdate[]>((prev, curr) => {
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
      //Otherwise replace because we are doing ascending, so last one wins (preserve the old value)
      prev[prevUpdateIndex] = {
        ...curr,
        oldValue: prev[prevUpdateIndex].oldValue,
      }
    }

    return prev
  }, [])
}
