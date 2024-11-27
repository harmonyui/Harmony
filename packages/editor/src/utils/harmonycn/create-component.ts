import { componentCreations } from './components'
import type { CreateComponent } from './types'

export const createComponentElement = (
  component: string,
  componentId: string,
  childIndex: number,
): HTMLElement => {
  const componentCreationFunction = componentCreations[component] as
    | CreateComponent
    | undefined
  if (!componentCreationFunction) {
    throw new Error(`Component ${component} not found`)
  }

  const element = componentCreationFunction()
  element.dataset.harmonyId = componentId
  element.dataset.harmonyChildIndex = String(childIndex)

  return element
}
