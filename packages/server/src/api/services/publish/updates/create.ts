/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { addComponentSchema } from '@harmony/util/src/updates/component'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { RegistryItem } from '@harmony/util/src/harmonycn/types'
import type { FlowGraph } from '../../indexor/graph'
import { getGraph } from '../../indexor/graph'
import type { Node } from '../../indexor/types'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import { isJSXElement } from '../../indexor/nodes/jsx-element'
import { getSnippetFromNode } from '../../indexor/utils'
import { ImportStatement } from '../../indexor/nodes/import-statement'
import type { UpdateComponent } from './types'
import { getInstanceFromComponent } from './utils'

type InstanceInfo = Pick<RegistryItem, 'implementation' | 'dependencies'>

export const createUpdate: UpdateComponent = (
  { value, update: componentUpdate },
  graph,
  repository,
) => {
  const { parentId, parentChildIndex, index, component, copiedFrom } =
    parseUpdate(addComponentSchema, value)

  const parentElement = graph.getJSXElementById(parentId, parentChildIndex)
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
  update: ComponentUpdate,
  {
    parentId,
    parentChildIndex,
    index,
  }: { parentId: string; parentChildIndex: number; index: number },
  code: InstanceInfo,
  graph: FlowGraph,
) => {
  const parentElement = graph.getJSXElementById(parentId, parentChildIndex)
  if (!parentElement) {
    throw new Error(`Parent element with id ${parentId} not found`)
  }

  const instanceNodes = getElementInstanceNodes(
    parentElement.location.file,
    code,
  )

  graph.addChildElement(
    instanceNodes,
    update.componentId,
    update.childIndex,
    index,
    parentElement,
  )
}

const getElementInstanceNodes = (
  file: string,
  { implementation, dependencies }: InstanceInfo,
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

  const nodes = graph.getNodes()
  const elementInstance = nodes.find(isJSXElement)
  if (!elementInstance) {
    throw new Error('Element instance node is not a JSX element')
  }

  const otherNodes = nodes.filter(
    (node) =>
      node !== elementInstance &&
      node.location.start >= elementInstance.location.start &&
      node.location.end <= elementInstance.location.end,
  )

  //Normalize the location of the nodes
  const offset = elementInstance.location.start
  elementInstance.location.start -= offset
  elementInstance.location.end -= offset
  elementInstance.location.file = file
  otherNodes.forEach((node) => {
    node.location.start -= offset
    node.location.end -= offset
    node.location.file = file
  })
  return { element: elementInstance, nodes: otherNodes }
}

const getInstanceFromElement = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
): InstanceInfo => {
  const element = graph.getJSXElementById(componentId, childIndex)
  if (!element) {
    throw new Error(`Element with id ${componentId} not found`)
  }

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
  }
}
