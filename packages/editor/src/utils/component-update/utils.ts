import type { CreatedComponent } from '../harmonycn/types'

export const updateCreatedElementOptions = (
  createdElements: CreatedComponent[],
  componentId: string,
  childIndex: number,
  options: Required<CreatedComponent['options']>,
) => {
  const createdElementIndex = createdElements.findIndex(
    (el) => el.componentId === componentId && el.childIndex === childIndex,
  )
  if (createdElementIndex > -1) {
    const createdElement = createdElements[createdElementIndex]
    createdElements[createdElementIndex] = {
      ...createdElement,
      options: createdElement.options
        ? {
            ...createdElement.options,
            ...options,
          }
        : undefined,
    }
  }

  return createdElements
}
