import html2canvas from 'html2canvas'

export const getElementSnapshot = async (
  element: HTMLElement,
): Promise<string> => {
  const canvas = await html2canvas(element)
  return canvas.toDataURL()
}
