import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { UpdateComponent } from './types'
import {
  addCommentToElement,
  getInstanceInfo,
  rotateThroughValuesAndMakeChanges,
} from './utils'

export const updateText: UpdateComponent = async (
  { update: componentUpdate, oldValue, value },
  graph,
) => {
  const { attributes, instances: graphElements } = getInstanceInfo(
    componentUpdate.componentId,
    componentUpdate.childIndex,
    graph,
  )

  const index = parseInt(componentUpdate.name)
  let textAttribute = attributes.find(
    (attr) =>
      attr.name === 'children' &&
      (attr.attribute?.getChildIndex() === index ||
        attr.addArguments.length > 0),
  )
  if (!textAttribute && attributes.find((attr) => attr.name === 'children')) {
    textAttribute = {
      addArguments: [
        {
          propertyName: 'children',
          values: [],
          parent: graphElements[0],
        },
      ],
      name: 'children',
      elementValues: [],
    }
  }
  if (!textAttribute) {
    const commentValue = `Change inner text for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
    return
  }

  if (
    !rotateThroughValuesAndMakeChanges(textAttribute, (nodeValue, parent) => {
      const addArgument = textAttribute.addArguments.find(
        (arg) => arg.propertyName === 'children' && arg.values.length === 0,
      )
      const shouldDoAddArgument =
        addArgument &&
        graphElements.findIndex((el) => el.id === addArgument.parent.id) >
          graphElements.findIndex((el) => el.id === parent.id)

      if (shouldDoAddArgument) {
        const { parent: addArgumentParent } = addArgument
        graph.addJSXTextToElement(addArgumentParent, value)
        return true
      }

      if (isLiteral(nodeValue)) {
        graph.changeLiteralNode(nodeValue, componentUpdate.value)
        return true
      }

      return false
    })
  ) {
    const addArgument = textAttribute.addArguments.find(
      (arg) => arg.propertyName === 'children' && arg.values.length === 0,
    )
    //If we can add an attribute to the parent, let's do that
    if (addArgument) {
      const { parent: addArgumentParent } = addArgument
      graph.addJSXTextToElement(addArgumentParent, value)
      return
    }

    const commentValue = `Change inner text for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
  }
}
