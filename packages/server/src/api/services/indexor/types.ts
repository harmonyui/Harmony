import type { ComponentLocation } from '@harmony/util/src/types/component'
import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type { FlowGraph } from './graph'
import { getSnippetFromNode } from './utils'

export interface Attribute {
  id: string
  type: 'text' | 'className' | 'property'
  name: string
  value: string
  index: number
  location: ComponentLocation
  locationType: string
  //reference: HarmonyComponent
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
  level: number
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
  dataDependencies: Set<Node>
  dataDependents: Set<Node>
  path: NodePath<T>
  content: string
  graph: FlowGraph
}

export interface GetValuesOptions {
  predicate?: (node: Node) => boolean
  visitor?: (node: Node) => void
}

const simplePredicate = (node: Node): boolean =>
  node.dataDependencies.size === 0
export class Node<T extends t.Node = t.Node> {
  public id: string
  public location: ComponentLocation
  public type: NodeType
  public name: string
  public dataDependencies: Set<Node>
  public dataDependents: Set<Node>
  public content: string
  public graph: FlowGraph
  private parent: Node | undefined
  public get node(): T {
    return this.path.node
  }
  public path: NodePath<T>
  private instanceIndex = 0

  constructor({
    id,
    location,
    type,
    name,
    dataDependencies,
    dataDependents,
    path,
    content,
    graph,
  }: NodeBase<T>) {
    this.id = id
    this.location = location
    this.type = type
    this.name = name
    this.dataDependencies = dataDependencies
    this.dataDependents = dataDependents
    this.path = path
    this.content = content
    this.graph = graph
  }

  public getChildIndex() {
    return this.instanceIndex
  }

  public setChildIndex(index: number) {
    this.instanceIndex = index
  }

  public getValues({
    predicate = simplePredicate,
    visitor,
  }: GetValuesOptions = {}): Node[] {
    return this.getValuesBase({ predicate, visitor })
  }

  protected getValuesBase({
    predicate = simplePredicate,
    visitor,
  }: {
    predicate?: (node: Node) => boolean
    visitor?: (node: Node) => void
  }): Node[] {
    visitor?.(this)

    if (predicate(this)) {
      return [this]
    }
    const values: Node[] = []
    this.dataDependencies.forEach((node) => {
      values.push(...node.getValues({ predicate, visitor }))
    })

    return values
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

    const innerVisitor = (node: Node) => {
      const parent = node.getParent()
      if (parent && parentPredicate(parent) && parents[0] !== parent) {
        parents.unshift(parent)
      }
    }
    if (useBase) {
      this.getValuesBase({
        predicate: innerPredicate,
        visitor: innerVisitor,
      })
    } else {
      this.getValues({
        predicate: innerPredicate,
        visitor: innerVisitor,
      })
    }

    return ret
  }

  public setParent(parent: Node | undefined) {
    this.parent = parent
  }
  public getParent(): Node | undefined {
    return this.parent
  }

  public getNodeContent(): string {
    return getSnippetFromNode(this.node)
  }
}

export interface ObjectNode extends Node {
  getAttributes: () => ObjectProperty[]
  addProperty: (name: string, value: string | Node<t.Expression>) => void
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
