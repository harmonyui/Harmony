import { getBaseId, getLevelId } from '@harmony/util/src/utils/component'
import type { Repository } from '@harmony/util/src/types/branch'
import {
  harmonyCnSchema,
  type RegistryItem,
} from '@harmony/util/src/harmonycn/types'
import { componentInstances } from '@harmony/util/src/harmonycn/components'
import type { ClassNameValue } from '@harmony/util/src/updates/classname'
import { createUpdate } from '@harmony/util/src/updates/utils'
import { getGraph, type FlowGraph } from '../../indexor/graph'
import {
  isJSXElement,
  type JSXElementNode,
} from '../../indexor/nodes/jsx-element'
import type { Node } from '../../indexor/types'
import type { JSXAttribute } from '../../indexor/nodes/jsx-attribute'
import { addPrefixToClassName, convertCSSToTailwind } from '../css-conveter'
import type { LiteralNode } from '../../indexor/utils'
import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { InstanceInfo } from './types'

interface AttributeInfo {
  name: string
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
    return {
      instances: [],
      attributes: [],
    }
  }

  const instances = element.getRootInstances(realComponentId)
  if (!instances) throw new Error('Instances not found')

  setMappingIndex(element, realComponentId, childIndex)
  const attributes: AttributeInfo[] = element
    .getAttributes(realComponentId)
    .map((attribute) => ({
      name: attribute.getName(),
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

  const getAddProperties = (elementName: string): string[] => {
    const properties: string[] = []
    const isComponent = elementName[0].toUpperCase() === elementName[0]
    if (!isComponent) {
      properties.push(...['className', 'children'])
    }
    switch (elementName) {
      case 'img':
        properties.push(...['src', 'alt'])
        break
      case 'a':
        properties.push(...['href'])
        break
    }

    return properties
  }

  const addProperties = getAddProperties(element.name)
  addProperties.forEach((prop) => {
    if (!attributes.find((attr) => attr.attribute?.getName() === prop))
      attributes.push({
        name: prop,
        elementValues: [],
        addArguments: [{ parent: element, propertyName: prop, values: [] }],
      })
  })

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

export const getInstanceFromElement = (
  element: string,
  className?: string,
): InstanceInfo => {
  const getImplementationFromTagName = (tagName: string) => {
    const classNameImplementation = className ? ` className="${className}"` : ''
    switch (tagName) {
      case 'style':
        return `<style>{\`text\`}</style>`
      case 'img':
        return `<img${classNameImplementation}/>`
      case 'input':
        return `<input${classNameImplementation}/>`
      default:
        return `<${tagName}${classNameImplementation}></${tagName}>`
    }
  }
  return {
    implementation: element.startsWith('<')
      ? element
      : getImplementationFromTagName(element),
    dependencies: [],
    componentIds: [],
  }
}

export const getElementInstanceNodes = (
  file: string,
  { implementation, dependencies, componentIds }: InstanceInfo,
): { element: JSXElementNode; nodes: Node[] } => {
  const importStatements = dependencies
    .map((dependency) => {
      return dependency.isDefault
        ? `import ${dependency.name} from '${dependency.path}'`
        : `import { ${dependency.name} } from '${dependency.path}'`
    })
    .join('\n')
  const graph = getGraph(
    Math.random().toString(),
    `${importStatements}

    const App = () => {
      return ${implementation}
    }
  `,
  )

  const elementInstance = graph.getNodes().find(isJSXElement)
  if (!elementInstance) {
    throw new Error('Element instance node is not a JSX element')
  }
  const nodes =
    graph.files[elementInstance.location.file].getNodes(elementInstance)

  const otherNodes = nodes.filter((node) => node !== elementInstance)
  const childElements = elementInstance.getChildren(true)

  if (componentIds.length > 0) {
    if (childElements.length !== componentIds.length) {
      throw new Error(
        `Number of child elements (${childElements.length}) does not match number of component ids (${componentIds.length})`,
      )
    }
    childElements.forEach((childElement) => {
      const id = componentIds.shift()
      if (id) {
        childElement.id = id
      }
    })
  }

  //Normalize the location of the nodes
  const offset = elementInstance.location.start
  nodes.forEach((node) => {
    node.location.file = file
    node.location.start -= offset
    node.location.end -= offset
  })
  return { element: elementInstance, nodes: otherNodes }
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

export const parseText = <T extends Node>(
  text: string,
  filter: (node: Node) => node is T,
): T[] => {
  const graph = getGraph(
    'file',
    `
      export const temp = ${text}
    `,
  )

  return graph.getNodes().filter(filter)
}

export const parseJSXElementText = (text: string): JSXElementNode[] => {
  return parseText(`() => ${text}`, isJSXElement)
}

export const getClassNameValue = async (
  name: string,
  value: string,
  cssFramework: string,
) => {
  if (name === 'class')
    return createUpdate<ClassNameValue>({ type: 'class', value })
  if (cssFramework !== 'tailwind')
    return createUpdate<ClassNameValue>({ type: 'style', value })

  const tailwindValue = await convertCSSToTailwind(name, value)
  if (!tailwindValue) {
    return createUpdate<ClassNameValue>({
      type: 'style',
      value,
    })
  }

  return createUpdate<ClassNameValue>({
    type: 'class',
    value: replaceAll(tailwindValue, '"', "'"),
  })
}
