import type { ComponentLocation } from '@harmony/util/src/types/component'
import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type { JSXElementNode } from './nodes/jsx-element'
import { isLiteralNode } from './ast'

export interface Attribute {
  id: string
  type: 'text' | 'className' | 'property'
  name: string
  value: string
  index: number
  location: ComponentLocation
  locationType: string
  reference: HarmonyComponent
  node: t.Node
}

export interface HarmonyComponent {
  id: string
  name: string
  props: Attribute[]
  isComponent: boolean
  getParent: () => HarmonyComponent | undefined
  containingComponent?: HarmonyContainingComponent
  location: ComponentLocation
  children: HarmonyComponent[]
  node: t.JSXElement
}

export type HarmonyContainingComponent = Omit<HarmonyComponent, 'node'> & {
  node: t.FunctionDeclaration | t.ArrowFunctionExpression
}

type NodeType = NodePath['type']

export interface NodeBase<T extends t.Node> {
  id: string
  location: ComponentLocation
  type: NodeType
  name: string
  dependencies: Set<Node>
  dependents: Set<Node>
  path: NodePath<T>
}

const simplePredicate = (node: Node): boolean => node.dependencies.size === 0
export class Node<T extends t.Node = t.Node> {
  public id: string
  public location: ComponentLocation
  public type: NodeType
  public name: string
  public dependencies: Set<Node>
  public dependents: Set<Node>
  public get node(): T {
    return this.path.node
  }
  public path: NodePath<T>

  constructor({
    id,
    location,
    type,
    name,
    dependencies,
    dependents,
    path,
  }: NodeBase<T>) {
    this.id = id
    this.location = location
    this.type = type
    this.name = name
    this.dependencies = dependencies
    this.dependents = dependents
    this.path = path
  }

  public getValues(
    predicate: (node: Node) => boolean = simplePredicate,
  ): Node[] {
    if (predicate(this)) {
      return [this]
    }
    const values: Node[] = []
    this.dependencies.forEach((node) => {
      values.push(...node.getValues(predicate))
    })

    return values
  }
}

export interface ObjectNode extends Node {
  getAttributes: () => ObjectProperty[]
}

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

  public getDataFlow(): Node[] {
    const values = this.value.getValues()
    return values.filter((value) => isLiteralNode(value.node))
  }

  public getChildIndex(): number {
    return this.childIndex
  }

  public getName(): string {
    return this.name
  }
}

export interface ObjectProperty extends Node {
  getName: () => string
  getValueNode: () => Node
}
