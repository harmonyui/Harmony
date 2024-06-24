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
