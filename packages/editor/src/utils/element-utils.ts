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
  rootElement: HTMLElement | undefined,
): HTMLElement | undefined {
  const selector = `[data-harmony-id="${componentId}"]`
  if (!rootElement) {
    throw new Error('Cannot find root element')
  }
  const elements = rootElement.querySelectorAll(selector)
  for (const element of Array.from(elements)) {
    const elementChildIndex = Array.from(
      element.parentElement?.children || [],
    ).indexOf(element)
    if (elementChildIndex === childIndex) return element as HTMLElement
  }

  return undefined
}

export function findElementsFromId(
  componentId: string,
  rootElement: HTMLElement | undefined,
): HTMLElement[] {
  const selector = `[data-harmony-id="${componentId}"]`
  const container = rootElement
  if (!container) {
    throw new Error('Cannot find container harmony-container')
  }
  const elements = container.querySelectorAll(selector)
  return Array.from(elements) as HTMLElement[]
}

export function findSameElementsFromId(
  componentId: string,
  rootElement: HTMLElement | undefined,
): HTMLElement[] {
  const selector = `[data-harmony-component-id="${componentId}"]`
  const container = rootElement
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

export const createComponentId = (element: HTMLElement): string => {
  if (element.id !== '') {
    return `#${element.id}`
  }
  const path = []
  let currElement = element
  while (currElement.parentElement) {
    let tagName = element.tagName.toLowerCase()
    if (currElement.id) {
      tagName += `#${currElement.id}`
    }
    // else if (currElement.className) {
    //   tagName += `.${currElement.className.split(' ').join('.')}`
    // }
    else {
      const siblings = Array.from(currElement.parentElement.children)
      const index = siblings.indexOf(currElement) + 1
      tagName += `:nth-child(${index})`
    }
    path.unshift(tagName)
    currElement = currElement.parentElement
  }
  return btoa(path.join(' > '))
}
