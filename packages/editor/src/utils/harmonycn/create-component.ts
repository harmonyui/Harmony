import { componentCreations } from './components'
import type { CreateComponent, CreatedComponent } from './types'

export const createComponentElement = (
  component: string,
  componentId: string,
  childIndex: number,
): CreatedComponent => {
  const componentCreationFunction = componentCreations[component] as
    | CreateComponent
    | undefined
  if (!componentCreationFunction) {
    throw new Error(`Component ${component} not found`)
  }

  const createdComponent = componentCreationFunction()
  createdComponent.element.dataset.harmonyId = componentId
  createdComponent.element.dataset.harmonyChildIndex = String(childIndex)

  return { ...createdComponent, componentId, childIndex }
}
