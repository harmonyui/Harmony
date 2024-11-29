import { parseUpdate } from '@harmony/util/src/updates/utils'
import { addComponentSchema } from '@harmony/util/src/updates/component'
import type { Repository } from '@harmony/util/src/types/branch'
import { getGraph } from '../../indexor/graph'
import type { Node } from '../../indexor/types'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import { isJSXElement } from '../../indexor/nodes/jsx-element'
import { addPrefixToClassName } from '../css-conveter'
import type { UpdateComponent } from './types'

export const createUpdate: UpdateComponent = (
  { value, update: componentUpdate, componentId },
  graph,
  repository,
) => {
  const { parentId, parentChildIndex, index, component } = parseUpdate(
    addComponentSchema,
    value,
  )

  const parentElement = graph.getJSXElementById(parentId, parentChildIndex)
  if (!parentElement) {
    throw new Error(`Parent element with id ${parentId} not found`)
  }

  const instanceCode = getInstanceFromComponent(component, repository)
  const instanceNodes = getElementInstanceNodes(
    parentElement.location.file,
    instanceCode,
  )

  graph.addChildElement(
    instanceNodes,
    componentId,
    componentUpdate.childIndex,
    index,
    parentElement,
  )
}

const getInstanceFromComponent = (
  component: string,
  repository: Repository,
) => {
  if (component === 'Text') {
    return '<span>Label</span>'
  } else if (component === 'Frame') {
    const classes = 'p-2'
    const classesWithPrefix = repository.tailwindPrefix
      ? addPrefixToClassName(classes, repository.tailwindPrefix)
      : classes
    return `<div className="${classesWithPrefix}"></div>`
  } else if (component === 'Image') {
    return '<img src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png" />'
  }

  throw new Error('Invalid component type')
}

const getElementInstanceNodes = (
  file: string,
  instanceCode: string,
): { element: JSXElementNode; nodes: Node[] } => {
  const graph = getGraph(
    Math.random().toString(),
    `
    const App = () => {
      return ${instanceCode}
    }
  `,
  )

  const nodes = graph.getNodes()
  const elementInstance = nodes[1]
  if (!isJSXElement(elementInstance)) {
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
