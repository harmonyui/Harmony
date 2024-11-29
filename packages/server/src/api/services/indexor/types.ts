import type { ComponentLocation } from '@harmony/util/src/types/component'
import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'

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
  childIndex?: number
  name: string
  props: Attribute[]
  isComponent: boolean
  getParent: () => HarmonyComponent | undefined
  containingComponent?: HarmonyContainingComponent
  location: ComponentLocation
  children: string[]
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
  content: string
}

const simplePredicate = (node: Node): boolean => node.dependencies.size === 0
export class Node<T extends t.Node = t.Node> {
  public id: string
  public location: ComponentLocation
  public type: NodeType
  public name: string
  public dependencies: Set<Node>
  public dependents: Set<Node>
  public content: string
  private parent: Node | undefined
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
    content,
  }: NodeBase<T>) {
    this.id = id
    this.location = location
    this.type = type
    this.name = name
    this.dependencies = dependencies
    this.dependents = dependents
    this.path = path
    this.content = content
  }

  public getValues(
    predicate: (node: Node) => boolean = simplePredicate,
  ): Node[] {
    return this.getValuesBase(predicate)
  }

  protected getValuesBase(
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

  public traceParent(
    predicate: (node: Node | undefined) => boolean = (node) =>
      node ? simplePredicate(node) : false,
  ): Node | undefined {
    if (predicate(this.getParent())) {
      return this.getParent()
    }
    let parent: Node | undefined
    this.dependents.forEach((node) => {
      if (parent) return
      const nodeParent = node.traceParent(predicate)
      if (nodeParent) {
        parent = nodeParent
      }
    })

    return parent
  }

  public getValuesWithParents<N extends Node, P extends Node, Return>(
    predicate: (node: Node) => node is N,
    parentPredicate: (node: Node) => node is P,
    extractValue: (node: N, currParents: P[]) => Return,
    parents: P[],
    useBase = false,
  ): { parent: P; values: Return[] }[] {
    const ret: { parent: P; values: Return[] }[] = []
    const innerPredicate = (node: Node) => {
      const parent = node.getParent()
      if (parent && parentPredicate(parent) && parents[0] !== parent) {
        parents.unshift(parent)
      }
      const currParent = parents[0]

      if (!predicate(node)) return false

      const data = ret.find((item) => item.parent === currParent)
      const value = extractValue(node, parents)

      if (data) {
        data.values.push(value)
      } else {
        ret.push({ parent: currParent, values: [value] })
      }

      return true
    }
    if (useBase) {
      this.getValuesBase(innerPredicate)
    } else {
      this.getValues(innerPredicate)
    }

    return ret
  }

  public setParent(parent: Node) {
    this.parent = parent
  }
  public getParent(): Node | undefined {
    return this.parent
  }
}

export interface ObjectNode extends Node {
  getAttributes: () => ObjectProperty[]
}

export interface ObjectProperty extends Node {
  getName: () => string
  getValueNode: () => Node
}

export interface ArrayNode extends Node {
  getArrayElements: () => Node[]
}
export interface ArrayProperty extends Node {
  getIndex: () => number | undefined
  setIndex: (index: number | undefined) => void
  getArrayExpression: () => ArrayNode[]
}
