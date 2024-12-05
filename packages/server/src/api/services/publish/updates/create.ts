/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { addComponentSchema } from '@harmony/util/src/updates/component'
import type { FlowGraph } from '../../indexor/graph'
import { getGraph } from '../../indexor/graph'
import type { Node } from '../../indexor/types'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import { isJSXElement } from '../../indexor/nodes/jsx-element'
import { getSnippetFromNode } from '../../indexor/utils'
import { ImportStatement } from '../../indexor/nodes/import-statement'
import type { InstanceInfo, UpdateComponent } from './types'
import { getInstanceFromComponent, getJSXElementFromLevels } from './utils'

export const createUpdate: UpdateComponent = (
  { value, update: componentUpdate },
  graph,
  repository,
) => {
  const { parentId, parentChildIndex, index, component, copiedFrom } =
    parseUpdate(addComponentSchema, value)

  const parentElement = getJSXElementFromLevels(
    parentId,
    parentChildIndex,
    graph,
  )
  if (!parentElement) {
    throw new Error(`Parent element with id ${parentId} not found`)
  }

  //If there is no comonent attached, it is probably just the result of an undo delete
  if (!component && !copiedFrom) {
    return
  }

  const instanceCode = copiedFrom
    ? getInstanceFromElement(
        copiedFrom.componentId,
        copiedFrom.childIndex,
        graph,
      )
    : getInstanceFromComponent(component!, repository)

  createComponent(
    componentUpdate,
    { parentId, parentChildIndex, index },
    instanceCode,
    graph,
  )
}

export const createComponent = (
  { componentId, childIndex }: { componentId: string; childIndex: number },
  {
    parentId,
    parentChildIndex,
    index,
  }: { parentId: string; parentChildIndex: number; index: number },
  code: InstanceInfo,
  graph: FlowGraph,
) => {
  const parentElement = getJSXElementFromLevels(
    parentId,
    parentChildIndex,
    graph,
  )
  if (!parentElement) {
    throw new Error(`Parent element with id ${parentId} not found`)
  }

  const instanceNodes = getElementInstanceNodes(
    parentElement.location.file,
    code,
  )

  graph.addChildElement(
    instanceNodes,
    componentId,
    childIndex,
    index,
    parentElement,
  )
}

const getElementInstanceNodes = (
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

  //Normalize the location of the nodes
  const offset = elementInstance.location.start
  nodes.forEach((node) => {
    node.location.file = file
    node.location.start -= offset
    node.location.end -= offset
  })
  return { element: elementInstance, nodes: otherNodes }
}

const getInstanceFromElement = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
): InstanceInfo => {
  const element = getJSXElementFromLevels(componentId, childIndex, graph)
  if (!element) {
    throw new Error(`Element with id ${componentId} not found`)
  }
  const allElements = element.getChildren(true)

  return {
    implementation: getSnippetFromNode(element.node),
    dependencies: element
      .getDependencies()
      .filter((dep) => dep instanceof ImportStatement)
      .map((dep) => ({
        name: dep.getName(),
        path: dep.getSource(),
        isDefault: dep.isDefault(),
      })),
    componentIds: allElements.map((node) => node.id),
  }
}
