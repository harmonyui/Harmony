import { parseUpdate } from '@harmony/util/src/updates/utils'
import { updatePropertySchema } from '@harmony/util/src/updates/property'
import type { UpdateComponent } from './types'
import { addCommentToElement, getInstanceInfo } from './utils'

export const propertyUpdate: UpdateComponent = async (info, graph) => {
  const { name, value } = parseUpdate(updatePropertySchema, info.value)
  const { value: oldValue } = parseUpdate(updatePropertySchema, info.oldValue)

  const componentId = info.update.componentId
  const { attributes, instances: graphElements } = getInstanceInfo(
    componentId,
    info.update.childIndex,
    graph,
  )

  const propertyAttribute = attributes.find(
    (attr) =>
      attr.attribute?.getName() === 'className' || attr.addArguments.length > 0,
  )
  const addArgument = propertyAttribute?.addArguments.find(
    (arg) => arg.propertyName === name,
  )

  if (!propertyAttribute || !addArgument) {
    const commentValue = `Change ${name} for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
    return
  }

  if (addArgument.values.length === 0) {
    graph.addAttributeToElement(addArgument.parent, name, value)
    return
  }

  const valueNode = addArgument.values[0]
  graph.changeLiteralNode(valueNode, value)
}
