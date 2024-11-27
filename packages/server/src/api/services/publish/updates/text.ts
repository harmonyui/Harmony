import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { UpdateComponent } from './types'
import { addCommentToElement, rotateThroughValuesAndMakeChanges } from './utils'

export const updateText: UpdateComponent = (
  { update: componentUpdate, attributes, oldValue, value, graphElements },
  graph,
) => {
  const index = parseInt(componentUpdate.name)
  const textAttribute = attributes.find(
    (attr) =>
      attr.attribute.getName() === 'children' &&
      attr.attribute.getChildIndex() === index,
  )
  if (!textAttribute) {
    const commentValue = `Change inner text for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
    return
  }

  if (
    !rotateThroughValuesAndMakeChanges(textAttribute, (nodeValue) => {
      if (isLiteral(nodeValue)) {
        graph.changeLiteralNode(nodeValue, componentUpdate.value)
        return true
      }

      return false
    })
  ) {
    const commentValue = `Change inner text for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
  }
}
