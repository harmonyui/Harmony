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

export interface Node<T extends t.Node = t.Node> {
  location: ComponentLocation
  change: 'add' | 'remove' | 'update' | 'none'
  node: T
  path: NodePath<T> | null
  name: string
}

export interface ComponentNode
  extends Node<t.ArrowFunctionExpression | t.FunctionDeclaration> {
  elements: ElementNode[]
  children: ComponentNode[]
  parents: ComponentNode[]
  props: PropertyNode[]
}

export interface ElementNode extends Node<t.JSXElement> {
  id: string
  parent: ComponentNode
  attributes: AttributeNode[]
  next: ElementNode[]
  prev: ElementNode[]
}

export interface AttributeNode
  extends Node<t.JSXAttribute | t.JSXText | t.JSXExpressionContainer> {
  parent: ElementNode
  properties: PropertyNode[]
  next: AttributeNode[]
  prev: AttributeNode[]
  index: number | null
}

export interface PropertyNode extends Node {
  next: PropertyNode[]
}
