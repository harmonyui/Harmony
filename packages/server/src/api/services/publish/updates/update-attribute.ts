import { updateAttributeValue } from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { UpdateComponent } from './types'
import {
  addCommentToElement,
  getInstanceInfo,
  rotateThroughValuesAndMakeChanges,
} from './utils'

export const updateAttribute: UpdateComponent = async (
  { value, oldValue, update },
  graph,
) => {
  const {
    value: updateValue,
    action,
    name,
  } = parseUpdate(updateAttributeValue, value)

  const { attributes, instances: graphElements } = getInstanceInfo(
    update.componentId,
    update.childIndex,
    graph,
  )
  if (action === 'update') {
    const srcAttribute = attributes.find((attribute) => attribute.name === name)
    if (!srcAttribute) {
      const commentValue = `Change ${name} property for ${graphElements[0].name} tag from ${oldValue} to ${updateValue}`
      addCommentToElement(graphElements[0], commentValue, graph)
      return
    }

    if (
      !rotateThroughValuesAndMakeChanges(srcAttribute, (node, parent) => {
        const addArgument = srcAttribute.addArguments.find(
          (arg) => arg.propertyName === name && arg.values.length === 0,
        )
        const shouldDoAddArgument =
          addArgument &&
          graphElements.findIndex((el) => el.id === addArgument.parent.id) >
            graphElements.findIndex((el) => el.id === parent.id)

        if (shouldDoAddArgument) {
          const { parent: addArgumentParent } = addArgument
          graph.addAttributeToElement(addArgumentParent, name, updateValue)
          return true
        }

        if (isLiteral(node)) {
          graph.changeLiteralNode(node, updateValue)
          return true
        }

        return false
      })
    ) {
      const addArgument = srcAttribute.addArguments.find(
        (arg) => arg.propertyName === name && arg.values.length === 0,
      )
      //If we can add an attribute to the parent, let's do that
      if (addArgument) {
        const { parent: addArgumentParent } = addArgument
        graph.addAttributeToElement(addArgumentParent, name, updateValue)
        return
      }

      const topLevelAttributeParent =
        srcAttribute.elementValues[srcAttribute.elementValues.length - 1]
          ?.parent ?? graphElements[0]
      addCommentToElement(
        topLevelAttributeParent,
        `Change ${name} property for ${topLevelAttributeParent.name} tag from ${oldValue} to ${updateValue}`,
        graph,
      )
    }
  }
}
