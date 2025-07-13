import { getLevelId } from '@harmony/util/src/utils/component'
import { FlowGraph } from './graph'
import { JSXElementNode } from './nodes/jsx-element'

const defaultFilter = (element: JSXElementNode) =>
  element.getParentComponent().getJSXElements()[0]?.id !== element.id
export const getElementLevel = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
  filter: (element: JSXElementNode) => boolean | undefined = defaultFilter,
):
  | {
      element: JSXElementNode
      level: number
    }
  | undefined => {
  const numLevels = componentId.split('#').length
  let element: JSXElementNode | undefined
  for (let i = 0; i < numLevels; i++) {
    const _componentId = getLevelId(componentId, i)
    element = graph.getJSXElementById(_componentId, childIndex)
    if (!element) {
      continue
    }

    const filterResult = filter(element)
    // Undefined return value means do the default filter
    if (
      filterResult === false ||
      (filterResult === undefined && !defaultFilter(element))
    ) {
      continue
    }

    return { element, level: i }
  }

  return element ? { element, level: numLevels } : undefined
}

export const getJSXElementFromLevels = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
  filter?: (element: JSXElementNode) => boolean,
) => {
  const result = getElementLevel(componentId, childIndex, graph, filter)
  if (!result) {
    return undefined
  }

  return result.element
}

export const getJSXParentElement = (
  componentId: string,
  childIndex: number,
  graph: FlowGraph,
) =>
  getJSXElementFromLevels(
    componentId,
    childIndex,
    graph,
    (_element) =>
      _element.getChildren().length > 1 ||
      _element.getAttributes().find((attr) => attr.getName() === 'children') ===
        undefined,
  )
