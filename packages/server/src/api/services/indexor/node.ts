import * as t from '@babel/types'
import { getSnippetFromNode } from '../publish/code-updator'
import type { NodeBase } from './types'
import { Node } from './types'
import { createNode, traceDataFlow } from './utils'

export class JSXAttributeNode extends Node<
  t.JSXAttribute | t.JSXText | t.JSXExpressionContainer
> {
  private value: Node
  constructor(
    private parentElement: JSXElementNode,
    base: NodeBase<t.JSXAttribute | t.JSXText | t.JSXExpressionContainer>,
  ) {
    super(base)
    this.value = this.createValue()
  }

  public getParentElement() {
    return this.parentElement
  }

  public getValueNode() {
    return this.value
  }

  public getDataFlow(): Node[] {
    return traceDataFlow(this.value)
  }

  private createValue() {
    const arg = this.path.node
    const attributePath = this.path

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
      this.location.file,
    )

    return valueNode
  }
}

export class JSXElementNode extends Node<t.JSXElement> {
  constructor(
    private attributes: JSXAttributeNode[],
    private parentComponent: ComponentNode,
    private definitionComponent: ComponentNode | undefined,
    base: NodeBase<t.JSXElement>,
  ) {
    super(base)
  }

  public getAttributes() {
    return Array.from(this.attributes)
  }

  public getParentComponent() {
    return this.parentComponent
  }

  public getDefinitionComponent() {
    return this.definitionComponent
  }

  public addAttribute(attribute: JSXAttributeNode) {
    this.attributes.push(attribute)
  }
}

export class ComponentNode extends Node<
  t.FunctionDeclaration | t.ArrowFunctionExpression
> {
  constructor(
    private props: Map<string, Node>,
    private _arguments: Node[],
    private elements: JSXElementNode[],
    {
      id,
      location,
      name,
      dependencies,
      dependents,
      path,
    }: NodeBase<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  ) {
    super({
      id,
      location,
      type: 'FunctionDeclaration',
      name,
      dependencies,
      dependents,
      path,
    })
  }

  public getProperties() {
    return this.props
  }

  public getArguments() {
    return this._arguments
  }

  public addJSXElement(element: JSXElementNode) {
    this.elements.push(element)
  }
}

export class ObjectPropertyNode extends Node {}

export class UndefinedNode extends Node {}
