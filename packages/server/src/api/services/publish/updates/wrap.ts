import { parseUpdate } from '@harmony/util/src/updates/utils'
import { UpdateComponent } from './types'
import {
  unwrapComponentSchema,
  wrapComponentSchema,
  wrapUnwrapComponentSchema,
} from '@harmony/util/src/updates/component'
import { createComponent } from './create'
import { getJSXElementFromLevels, getJSXParentElement } from './utils'
import { reorderElement } from './reorder'
import { deleteComponent } from './delete'

export const updateWrapUnwrap: UpdateComponent = async (
  info,
  graph,
  repository,
) => {
  const { action } = parseUpdate(wrapUnwrapComponentSchema, info.value)

  if (action === 'wrap') {
    updateWrap(info, graph, repository)
  } else {
    updateUnwrap(info, graph, repository)
  }
}

const updateWrap: UpdateComponent = async ({ value, update }, graph) => {
  const { elements } = parseUpdate(wrapComponentSchema, value)

  if (elements.length === 0) return
  const jsxElements = elements
    .map((element) =>
      getJSXElementFromLevels(element.componentId, element.childIndex, graph),
    )
    .filter((element) => element !== undefined)

  if (jsxElements.length !== elements.length) {
    throw new Error('Could not find all elements to wrap')
  }

  const parentElement = jsxElements[0].getParentElement()

  if (!parentElement) {
    throw new Error('Could not find parent element to unwrap')
  }

  const index = parentElement.getJSXChildren().indexOf(jsxElements[0])

  createComponent(
    { componentId: update.componentId, childIndex: update.childIndex },
    {
      parentId: parentElement.id,
      parentChildIndex: parentElement.getChildIndex(),
      index,
    },
    {
      componentIds: [],
      dependencies: [],
      implementation: '<div></div>',
    },
    graph,
  )

  elements.forEach(({ componentId, childIndex }, i) => {
    reorderElement(
      {
        parentId: update.componentId,
        parentChildIndex: update.childIndex,
        index: i,
      },
      { componentId, childIndex },
      graph,
    )
  })
}

const updateUnwrap: UpdateComponent = async ({ value, update }, graph) => {
  parseUpdate(unwrapComponentSchema, value)

  const jsxElement = getJSXElementFromLevels(
    update.componentId,
    update.childIndex,
    graph,
  )

  if (!jsxElement) {
    throw new Error('Could not find element to unwrap')
  }

  const parentElement = jsxElement.getParentElement()

  if (!parentElement) {
    throw new Error('Could not find parent element to unwrap')
  }

  const index = parentElement.getJSXChildren().indexOf(jsxElement)
  const children = [...jsxElement.getJSXChildren()]
  children.forEach((childElement, i) => {
    reorderElement(
      {
        parentId: parentElement.id,
        parentChildIndex: parentElement.getChildIndex(),
        index: index + i,
      },
      {
        componentId: childElement.id,
        childIndex: childElement.getChildIndex(),
      },
      graph,
    )
  })

  deleteComponent(
    { componentId: update.componentId, childIndex: update.childIndex },
    graph,
  )
}
