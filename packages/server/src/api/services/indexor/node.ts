import type * as t from '@babel/types'
import type { JSXAttribute, NodeBase } from './types'
import { Node } from './types'
import { createNode } from './utils'
import type { JSXElementNode } from './nodes/jsx-element'

export class ComponentNode extends Node<
  t.FunctionDeclaration | t.ArrowFunctionExpression
> {
  constructor(
    //private props: Map<string, Node>,
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

  // public getProperties() {
  //   return this.props
  // }

  public getArguments() {
    return this._arguments
  }

  public addJSXElement(element: JSXElementNode) {
    this.elements.push(element)
  }
}

export class UndefinedNode extends Node {}

export class ComponentArgumentPlaceholderNode extends Node {
  private jsxAttributes: JSXAttribute[]
  constructor(elementNode: JSXElementNode) {
    super(
      createNode(
        `${elementNode.name}Placeholder`,
        elementNode.path,
        elementNode.location.file,
      ),
    )
    this.jsxAttributes = elementNode.getAttributes()
  }

  public getJSXAttributes() {
    return this.jsxAttributes
  }
}
