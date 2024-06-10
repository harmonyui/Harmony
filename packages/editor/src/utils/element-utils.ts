export const recurseElements = (element: HTMLElement, callbacks: ((element: HTMLElement) => void)[]) => {
    callbacks.forEach(callback => {callback(element)});
    Array.from(element.children).filter(child => (child as HTMLElement).dataset.harmonyText !== 'true').forEach(child => { recurseElements(child as HTMLElement, callbacks); });
}