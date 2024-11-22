import * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type { NodeBase } from '../types'
import { JSXAttribute } from '../types'
import { createNode } from '../utils'
import { getSnippetFromNode } from '../../publish/code-updator'
import type { JSXElementNode } from './jsx-element'

export class JSXAttributeNode extends JSXAttribute<
  t.JSXAttribute | t.JSXText | t.JSXExpressionContainer
> {
  constructor(
    parentElement: JSXElementNode,
    childIndex: number,
    base: NodeBase<t.JSXAttribute | t.JSXText | t.JSXExpressionContainer>,
  ) {
    super(
      parentElement,
      createValue(base.path, base.location.file),
      childIndex,
      base,
    )
  }
}

function createValue(path: NodePath, fileLocation: string) {
  const arg = path.node
  const attributePath = path

  const getValueKey = () => {
    if (t.isJSXAttribute(arg)) {
      return t.isJSXExpressionContainer(arg.value)
        ? `value.expression`
        : `value`
    }

    if (t.isJSXExpressionContainer(arg)) {
      return `expression`
    }

    return ''
  }
  const key = getValueKey()

  const value = key ? attributePath.get(key) : attributePath
  if (Array.isArray(value)) throw new Error('Should not be array')
  const valueNode = createNode(
    getSnippetFromNode(value.node),
    value,
    fileLocation,
  )

  return valueNode
}
