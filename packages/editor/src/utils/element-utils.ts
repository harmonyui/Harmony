/* eslint-disable @typescript-eslint/no-non-null-assertion --- ok*/
export const recurseElements = (
  element: HTMLElement,
  callbacks: ((element: HTMLElement) => void)[],
) => {
  callbacks.forEach((callback) => {
    callback(element)
  })
  Array.from(element.children)
    .filter((child) => (child as HTMLElement).dataset.harmonyText !== 'true')
    .forEach((child) => {
      recurseElements(child as HTMLElement, callbacks)
    })
}

export function findElementFromId(
  componentId: string,
  childIndex: number,
): HTMLElement | undefined {
  const selector = `[data-harmony-id="${componentId}"]`
  const container = document.getElementById('harmony-container')
  if (!container) {
    throw new Error('Cannot find container harmony-container')
  }
  const elements = container.querySelectorAll(selector)
  for (const element of Array.from(elements)) {
    const elementChildIndex = Array.from(
      element.parentElement?.children || [],
    ).indexOf(element)
    if (elementChildIndex === childIndex) return element as HTMLElement
  }

  return undefined
}

export function findElementsFromId(componentId: string): HTMLElement[] {
  const selector = `[data-harmony-id="${componentId}"]`
  const container = document.getElementById('harmony-container')
  if (!container) {
    throw new Error('Cannot find container harmony-container')
  }
  const elements = container.querySelectorAll(selector)
  return Array.from(elements) as HTMLElement[]
}

export function findSameElementsFromId(componentId: string): HTMLElement[] {
  const selector = `[data-harmony-component-id="${componentId}"]`
  const container = document.getElementById('harmony-container')
  if (!container) {
    throw new Error('Cannot find container harmony-container')
  }
  const elements = container.querySelectorAll(selector)
  return Array.from(elements) as HTMLElement[]
}

export function getComponentIdAndChildIndex(component: HTMLElement): {
  childIndex: number
  componentId: string
  index: number
} {
  let componentId = component.dataset.harmonyId
  let index = 0
  let childIndex = Array.from(component.parentElement!.children).indexOf(
    component,
  )
  if (!componentId) {
    if (component.dataset.harmonyText === 'true') {
      const element = component.parentElement
      if (!element) {
        throw new Error('Error when getting component parent in harmony text')
      }
      index = Array.from(element.children).indexOf(component)
      childIndex = Array.from(element.parentElement!.children).indexOf(element)
      componentId = element.dataset.harmonyId
    }

    if (!componentId || index < 0) {
      throw new Error('Error when getting component')
    }
  }

  if (childIndex < 0) throw new Error('Cannot get right child index')

  return { childIndex, componentId, index }
}
