export function isTextElement(element: HTMLElement): boolean {
  return (
    element.childNodes.length > 0 &&
    Array.from(element.childNodes).every(
      (child) => child.nodeType === Node.TEXT_NODE,
    )
  )
}

export function isImageElement(element: Element): boolean {
  return ['img', 'svg'].includes(element.tagName.toLowerCase())
}
