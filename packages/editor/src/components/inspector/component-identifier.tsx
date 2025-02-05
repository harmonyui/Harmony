import type { Fiber } from 'react-reconciler'
import type { ComponentProp } from '@harmony/util/src/types/component'
import { getElementFiberUpward, getReferenceFiber } from './fiber'

export interface ComponentElement {
  id: string
  childIndex: number
  name: string
  props: ComponentProp[]
  isComponent: boolean
  element: HTMLElement
  children: ComponentElement[]
}

export const getComponentElementFiber = (
  element: HTMLElement,
): Fiber | undefined => {
  const fiber = getElementFiberUpward(element)
  const referenceFiber = getReferenceFiber(fiber)
  return referenceFiber
}
