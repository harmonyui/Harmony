import * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import { Node, type NodeBase, type ObjectProperty } from '../types'
import type { LiteralNode } from '../utils'
import { createNode, getSnippetFromNode, isChildNode } from '../utils'
import { isIdentifier, isLiteral } from '../predicates/simple-predicates'
import { isJSXElement, type JSXElementNode } from './jsx-element'
import { UndefinedNode } from './undefined'

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
    const literalValues = values.filter((value) => isLiteral(value))

    return literalValues
  }

  public getJSXAttributes(): JSXAttribute[] {
    return [this]
  }

  public getDataFlowWithParents(): {
    parent: JSXElementNode
    values: Node[]
  }[] {
    const parents: JSXElementNode[] = []
    const ret: { parent: JSXElementNode; values: Node[] }[] = []
    const values = this.value.getValues((node) => {
      const parent = node.getParent()
      if (parent && isJSXElement(parent) && parents[0] !== parent) {
        parents.unshift(parent)
      }
      const currParent = parents[0]

      if (node.dependencies.size !== 0) return false

      const data = ret.find((item) => item.parent === currParent)

      if (data) {
        data.values.push(node)
      } else {
        ret.push({ parent: currParent, values: [node] })
      }

      return true
    })
    // values.forEach((value) => {
    //   const parent = value.traceParent((node) =>
    //     node ? isJSXElement(node) : false,
    //   ) as JSXElementNode | undefined
    //   if (!parent) throw new Error('Element does not have a parent')
    //   const data = ret.find((item) => item.parent === parent)

    //   if (data) {
    //     data.values.push(value)
    //   } else {
    //     ret.push({ parent, values: [value] })
    //   }
    // })

    return ret
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
  if (!(value.node as Node | null)) {
    return new UndefinedNode(
      createNode('', attributePath, fileLocation, fileContent),
    )
  }
  const valueNode = createNode(
    getSnippetFromNode(value.node),
    value,
    fileLocation,
    fileContent,
  )

  return valueNode
}
