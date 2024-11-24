import * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import { Node, type NodeBase, type ObjectProperty } from '../types'
import type { LiteralNode } from '../utils'
import { createNode, isChildNode } from '../utils'
import { getSnippetFromNode } from '../../publish/code-updator'
import { isIdentifier, isLiteral } from '../node-predicates'
import type { JSXElementNode } from './jsx-element'

export class JSXAttribute<T extends t.Node = t.Node>
  extends Node<T>
  implements ObjectProperty
{
  constructor(
    private parentElement: JSXElementNode,
    private value: Node,
    private childIndex: number,
    base: NodeBase<T>,
  ) {
    super(base)
  }

  public getValueNode() {
    return this.value
  }
  public setValueNode(value: Node) {
    this.value = value
  }

  public getParentElement() {
    return this.parentElement
  }

  public getDataFlow(): Node<LiteralNode>[] {
    const values = this.value.getValues()
    return values.filter((value) => isLiteral(value))
  }

  public getChildIndex(): number {
    return this.childIndex
  }

  public getName(): string {
    return this.name
  }

  public getArgumentReferences(): {
    identifiers: Node<t.Identifier>[]
    argument: Node | undefined
  } {
    const definitionComponent = this.parentElement.getParentComponent()
    const argument = definitionComponent.getArguments()[0] as Node | undefined
    if (!argument) return { identifiers: [], argument }

    const identifiers = this.value.getValues((node) =>
      isIdentifier(node),
    ) as Node<t.Identifier>[]

    return {
      identifiers: identifiers.filter(
        (identifier) =>
          identifier.getValues((node) => isChildNode(node, argument)).length >
          0,
      ),
      argument,
    }
  }
}

export class JSXAttributeNode extends JSXAttribute<
  t.JSXAttribute | t.JSXText | t.JSXExpressionContainer
> {
  constructor(
    parentElement: JSXElementNode,
    childIndex: number,
    content: string,
    base: NodeBase<t.JSXAttribute | t.JSXText | t.JSXExpressionContainer>,
  ) {
    super(
      parentElement,
      createValue(base.path, base.location.file, content),
      childIndex,
      base,
    )
  }
}

function createValue(
  path: NodePath,
  fileLocation: string,
  fileContent: string,
) {
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
    fileContent,
  )

  return valueNode
}
