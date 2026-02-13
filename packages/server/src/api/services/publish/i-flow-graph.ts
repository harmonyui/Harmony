import type { Node } from '../indexor/types'
import type { LiteralNode } from '../indexor/utils'
import type { JSXElementNode } from '../indexor/nodes/jsx-element'
import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'

/**
 * Interface defining the contract for FlowGraph and FlowGraphContextWrapper.
 * This ensures both classes can be used interchangeably by update handlers.
 */
export interface IFlowGraph {
  // Graph state properties
  nodes: Map<string, Node>
  files: Record<string, any>
  importMappings: Record<string, string>
  code: string
  file: string

  // Mutation methods - these either modify the graph or record the intent to modify
  addLeadingComment(node: Node, comment: string): void
  changeLiteralNode(node: Node<LiteralNode>, newValue: string): void
  addAttributeToElement(
    node: JSXElementNode,
    propertyName: string,
    newValue: string,
  ): void
  addJSXTextToElement(node: JSXElementNode, newValue: string): void
  addStyleToElement(
    node: JSXElementNode,
    propertyName: string,
    newValue: string,
  ): void
  addChildElement(
    instanceNodes: any,
    componentId: string,
    childIndex: number,
    index: number,
    parentElement: JSXElementNode,
    beforeSibling?: JSXElementNode,
  ): void
  deleteElement(jsxElement: JSXElementNode): {
    content: string
    childElements: JSXElementNode[]
  }
  replaceNode(node: Node, newNode: any): void
  dirtyNode(node: Node): void

  // Query methods - read-only operations
  getNodes(): Node[]
  getJSXElementById(
    componentId: string,
    childIndex: number,
  ): JSXElementNode | undefined
  resolveImports(importPath: string): string

  // Graph building methods
  addDataDependency(fromId: string, toId: string): void
  addDependency(fromId: string, toId: string): void
  addParent(fromId: string, parentId: string): void
  createNode<T extends t.Node>(name: string, path: NodePath<T>): Node<T>
  setNode(node: Node): void
  setNewNode(node: Node, parent: Node): void
  addNode<T extends t.Node>(name: string, path: NodePath<T>): Node
  createJSXAttributeNode(
    parent: JSXElementNode,
    name: string,
    value: Node | string,
  ): any
  createObjectExpressionNode(node: t.ObjectExpression, parent: Node): any
  addJSXElement(
    jsxElementNode: JSXElementNode,
    parentElement: JSXElementNode | undefined,
    component: any,
    beforeSibling?: JSXElementNode,
  ): void
  addComponentNode(
    name: string,
    path: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  ): any
  getComponentName(path: NodePath): Node | undefined
  pushMappedDependency(id: any): void
  popMappedDependency(): any
  evaluatePropertyOrAdd(node: Node, property: string): Node
}
