import { getBaseId } from '@harmony/util/src/utils/component'
import type { FlowGraph } from '../../indexor/graph'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import type { Node } from '../../indexor/types'
import type { JSXAttribute } from '../../indexor/nodes/jsx-attribute'

interface AttributeInfo {
  attribute?: JSXAttribute
  elementValues: {
    parent: JSXElementNode
    values: Node[]
  }[]
  addArguments: {
    parent: JSXElementNode
    propertyName: string
  }[]
}
export const rotateThroughValuesAndMakeChanges = (
  attribute: AttributeInfo,
  makeChangeFunc: (node: Node, parent: JSXElementNode) => boolean,
) => {
  let updated = false
  for (let i = attribute.elementValues.length - 1; i >= 0; i--) {
    const elementValue = attribute.elementValues[i]
    for (const val of elementValue.values) {
      if (makeChangeFunc(val, elementValue.parent)) {
        updated = true
        break
      }
    }
  }

  return updated
}

export const addCommentToElement = (
  element: JSXElementNode,
  comment: string,
  graph: FlowGraph,
) => {
  graph.addLeadingComment(element.getOpeningElement(), comment)
}

export const replaceAll = <T extends string | undefined>(
  str: T,
  findStr: string,
  withStr: string,
): T => {
  if (!str) return str

  const newStr = str.replace(new RegExp(findStr, 'g'), withStr)

  return newStr as T
}

export const getInstanceInfo = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
) => {
  const setMappingIndex = (
    element: JSXElementNode,
    _componentId: string,
    index: number,
  ) => {
    const mappingIndexes = element.getMappingExpression(_componentId)
    const allIndexes = mappingIndexes.reduce<number[]>(
      (prev, curr) => [...prev, ...curr.values],
      [],
    )
    if (allIndexes.includes(index)) {
      element.setMappingIndex(index)
    }
  }

  const baseId = getBaseId(componentId)
  const realComponentId = graph.idMapping[`${baseId}-${childIndex}`]
    ? componentId.replace(baseId, graph.idMapping[`${baseId}-${childIndex}`])
    : componentId

  const element = graph.getJSXElementById(baseId, childIndex)
  if (!element) {
    throw new Error('Element not found')
  }

  const instances = element.getRootInstances(realComponentId)
  if (!instances) throw new Error('Instances not found')

  setMappingIndex(element, realComponentId, childIndex)
  const attributes: AttributeInfo[] = element
    .getAttributes(realComponentId)
    .map((attribute) => ({
      attribute,
      elementValues: attribute.getDataFlowWithParents(realComponentId),
      addArguments:
        instances.length > 1
          ? attribute
              .getArgumentReferences(instances[1])
              .identifiers.map((identifier) => ({
                parent: instances[1],
                propertyName: identifier.name,
              }))
          : [],
    }))

  const isComponent = element.name[0].toUpperCase() === element.name[0]
  if (
    !isComponent &&
    !attributes.find((attr) => attr.attribute?.getName() === 'className')
  ) {
    attributes.push({
      elementValues: [],
      addArguments: [{ parent: element, propertyName: 'className' }],
    })
  }

  return { instances, attributes }
}
