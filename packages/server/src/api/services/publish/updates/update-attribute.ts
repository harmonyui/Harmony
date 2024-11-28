import { updateAttributeValue } from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { UpdateComponent } from './types'
import {
  addCommentToElement,
  getInstanceInfo,
  rotateThroughValuesAndMakeChanges,
} from './utils'

export const updateAttribute: UpdateComponent = (
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
    const srcAttribute = attributes.find(
      (attribute) => attribute.attribute.getName() === name,
    )
    if (!srcAttribute) {
      const commentValue = `Change ${name} property for ${graphElements[0].name} tag from ${oldValue} to ${updateValue}`
      addCommentToElement(graphElements[0], commentValue, graph)
      return
    }

    if (
      !rotateThroughValuesAndMakeChanges(srcAttribute, (node) => {
        if (isLiteral(node)) {
          graph.changeLiteralNode(node, updateValue)
          return true
        }

        return false
      })
    ) {
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
