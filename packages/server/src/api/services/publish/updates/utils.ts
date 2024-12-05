import { getBaseId, getLevelId } from '@harmony/util/src/utils/component'
import type { Repository } from '@harmony/util/src/types/branch'
import {
  harmonyCnSchema,
  type RegistryItem,
} from '@harmony/util/src/harmonycn/types'
import { componentInstances } from '@harmony/util/src/harmonycn/components'
import type { FlowGraph } from '../../indexor/graph'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import type { Node } from '../../indexor/types'
import type { JSXAttribute } from '../../indexor/nodes/jsx-attribute'
import { addPrefixToClassName } from '../css-conveter'
import type { LiteralNode } from '../../indexor/utils'
import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { InstanceInfo } from './types'

interface AttributeInfo {
  attribute?: JSXAttribute
  elementValues: {
    parent: JSXElementNode
    values: Node[]
  }[]
  addArguments: {
    parent: JSXElementNode
    propertyName: string
    values: Node<LiteralNode>[]
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
  const rootId = componentId.split('#')[0]
  const realComponentId = graph.nodes.get(`${rootId}-${childIndex}`)
    ? componentId.replace(rootId, `${rootId}-${childIndex}`)
    : componentId

  let element = graph.getJSXElementById(
    baseId,
    baseId === componentId ? childIndex : 0,
  )
  if (!element) {
    element = graph.getJSXElementById(baseId, 0)
  }

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
          ? attribute.getArgumentReferences().identifiers.map((identifier) => ({
              parent: instances[1],
              propertyName: identifier.name,
              values: identifier.getValues(isLiteral) as Node<LiteralNode>[],
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
      addArguments: [
        { parent: element, propertyName: 'className', values: [] },
      ],
    })
  }

  return { instances, attributes }
}

export const getInstanceFromComponent = (
  component: string,
  repository: Repository,
): InstanceInfo => {
  const defaultComponent = harmonyCnSchema.safeParse(component)
  let instance = defaultComponent.success
    ? componentInstances[defaultComponent.data]
    : (repository.registry[component] as RegistryItem | undefined)
  if (!instance) {
    throw new Error(`Invalid component type ${component}`)
  }

  instance = { ...instance }
  if (instance.classes) {
    const classesWithPrefix = repository.tailwindPrefix
      ? addPrefixToClassName(instance.classes, repository.tailwindPrefix)
      : instance.classes
    instance.implementation = instance.implementation.replace(
      'className="%"',
      `className="${classesWithPrefix}"`,
    )
  }

  return {
    implementation: instance.implementation,
    dependencies: instance.dependencies,
    componentIds: [],
  }
}

export const getJSXElementFromLevels = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
): JSXElementNode | undefined => {
  const numLevels = componentId.split('#').length
  let element: JSXElementNode | undefined
  for (let i = 0; i < numLevels; i++) {
    const _componentId = getLevelId(componentId, i)
    element = graph.getJSXElementById(_componentId, childIndex)
    if (!element) {
      continue
    }
    const parentComponent = element.getParentComponent()
    if (parentComponent.getJSXElements()[0].id === element.id) {
      continue
    }

    return element
  }

  return element
}
