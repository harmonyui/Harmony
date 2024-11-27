import type { FlowGraph } from '../../indexor/graph'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import type { Node } from '../../indexor/types'
import type { UpdateInfo } from './types'

export const rotateThroughValuesAndMakeChanges = (
  attribute: UpdateInfo['attributes'][number],
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
