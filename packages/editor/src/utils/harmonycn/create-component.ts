import type { HarmonyCn } from '@harmony/util/src/harmonycn/types'
import { componentCreations } from './components'
import type { CreateComponent, CreatedComponent } from './types'

export const createComponentElement = (
  component: HarmonyCn,
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

  return { ...createdComponent, componentId, childIndex }
}
