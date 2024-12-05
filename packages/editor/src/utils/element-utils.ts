/* eslint-disable @typescript-eslint/no-non-null-assertion --- ok*/
export const recurseElements = (
  element: HTMLElement,
  callbacks: ((
    element: HTMLElement,
    parentElement: HTMLElement | undefined,
  ) => void)[],
  parent?: HTMLElement,
) => {
  callbacks.forEach((callback) => {
    callback(element, parent)
  })
  Array.from(element.children)
    .filter((child) => (child as HTMLElement).dataset.harmonyText !== 'true')
    .forEach((child) => {
      recurseElements(child as HTMLElement, callbacks, element)
    })
}

export function findElementFromId(
  componentId: string,
  childIndex: number,
  rootElement: HTMLElement | undefined,
): HTMLElement | undefined {
  const selector = `[data-harmony-id="${componentId}"][data-harmony-child-index="${childIndex}"]`
  if (!rootElement) {
    throw new Error('Cannot find root element')
  }
  const elements = rootElement.querySelectorAll(selector)
  if (elements.length > 0) {
    return elements[0] as HTMLElement
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
  let childIndex = Number(component.dataset.harmonyChildIndex)

  if (!componentId) {
    if (component.dataset.harmonyText === 'true') {
      const element = component.parentElement
      if (!element) {
        throw new Error('Error when getting component parent in harmony text')
      }
      index = Array.from(element.children).indexOf(component)
      childIndex = Number(element.dataset.harmonyChildIndex)
      componentId = element.dataset.harmonyId
    }

    if (!componentId || index < 0) {
      throw new Error('Error when getting component')
    }
  }

  if (childIndex < 0) throw new Error('Cannot get right child index')

  return { childIndex, componentId, index }
}

export function getComponentId(
  component: HTMLElement | undefined,
): string | undefined {
  if (!component) return undefined

  return getComponentIdAndChildIndex(component).componentId
}

export const createComponentId = (element: HTMLElement): string => {
  const actualElement =
    element.dataset.harmonyText === 'true' ? element.parentElement! : element
  if (actualElement.id !== '') {
    return `#${actualElement.id}`
  }
  const path: string[] = []
  let currElement = actualElement
  while (currElement.parentElement) {
    let tagName = currElement.tagName.toLowerCase()
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

export const getImageSrc = (image: HTMLImageElement): string => {
  const result = /<img[^>]*\s+src=['"]([^'"]+)['"]/.exec(image.outerHTML)
  if (result) {
    return result[1]
  }

  return ''
}

export const getElementText = (element: HTMLElement): string => {
  if (element.dataset.harmonyText === 'true') {
    return element.textContent || ''
  }

  return element.innerText
}

export const translatePropertyName = (name: string): string => {
  switch (name) {
    case 'src':
      return 'Source'
    case 'href':
      return 'URL'
    default:
      return name
  }
}
