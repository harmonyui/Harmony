import type * as t from '@babel/types'
import type { NodeBase } from '../types'
import { Node } from '../types'
import type { JSXElementNode } from './jsx-element'

export class ComponentNode extends Node<
  t.FunctionDeclaration | t.ArrowFunctionExpression
> {
  private instances = new Set<JSXElementNode>()
  constructor(
    private _arguments: Node[],
    private elements: JSXElementNode[],
    {
      id,
      location,
      name,
      dataDependencies,
      dataDependents,
      path,
      content,
    }: NodeBase<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  ) {
    super({
      id,
      location,
      type: 'FunctionDeclaration',
      name,
      dataDependencies,
      dataDependents,
      path,
      content,
    })
  }

  public addInstance(instance: JSXElementNode) {
    if (instance.getName() !== this.name) {
      throw new Error('Instance should be same name as component')
    }
    this.instances.add(instance)
  }

  public getInstances(): JSXElementNode[] {
    return Array.from(this.instances)
  }

  public getArguments() {
    return this._arguments
  }

  public addJSXElement(element: JSXElementNode) {
    this.elements.push(element)
  }

  public getJSXElements() {
    return this.elements
  }
}
export const isFunction = (node: Node): node is ComponentNode =>
  node instanceof ComponentNode
