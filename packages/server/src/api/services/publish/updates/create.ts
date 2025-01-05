/* eslint-disable no-nested-ternary -- ok*/

import { parseUpdate } from '@harmony/util/src/updates/utils'
import { addComponentSchema } from '@harmony/util/src/updates/component'
import type { FlowGraph } from '../../indexor/graph'
import { getSnippetFromNode } from '../../indexor/utils'
import { ImportStatement } from '../../indexor/nodes/import-statement'
import type { InstanceInfo, UpdateComponent } from './types'
import {
  getElementInstanceNodes,
  getInstanceFromComponent,
  getInstanceFromElement,
  getJSXElementFromLevels,
} from './utils'

export const createUpdate: UpdateComponent = async (
  { value, update: componentUpdate },
  graph,
  repository,
) => {
  const { parentId, parentChildIndex, index, component, copiedFrom, element } =
    parseUpdate(addComponentSchema, value)

  //If there is no comonent attached, it is probably just the result of an undo delete
  if (!component && !copiedFrom && !element) {
    return
  }

  const instanceCode = copiedFrom
    ? getInstanceFromCopiedFrom(
        copiedFrom.componentId,
        copiedFrom.childIndex,
        graph,
      )
    : element
      ? getInstanceFromElement(element)
      : component
        ? getInstanceFromComponent(component, repository)
        : undefined

  if (!instanceCode) {
    throw new Error('Instance code not found')
  }

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
    (_element) =>
      _element.getChildren().length > 1 ||
      _element.getAttributes().find((attr) => attr.getName() === 'children') ===
        undefined,
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

const getInstanceFromCopiedFrom = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
): InstanceInfo => {
  const element = getJSXElementFromLevels(componentId, childIndex, graph)
  if (!element) {
    throw new Error(`Element with id ${componentId} not found`)
  }
  const allElements = element.getJSXChildren(true)

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
