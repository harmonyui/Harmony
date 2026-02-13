import type { FlowGraph } from '../indexor/graph'
import type { Node } from '../indexor/types'
import type { LiteralNode } from '../indexor/utils'
import { getLiteralValue } from '../indexor/utils'
import type { JSXElementNode } from '../indexor/nodes/jsx-element'
import { ContextBuilder } from './context-builder'
import type { UpdateInfo } from './updates/types'
import type { IFlowGraph } from './i-flow-graph'

export class FlowGraphContextWrapper implements IFlowGraph {
  private contextBuilder: ContextBuilder
  private originalGraph: FlowGraph
  private currentUpdate: UpdateInfo | null = null

  constructor(graph: FlowGraph, contextBuilder: ContextBuilder) {
    this.originalGraph = graph
    this.contextBuilder = contextBuilder
  }

  // Called by CodeUpdator before processing each update
  setCurrentUpdate(update: UpdateInfo): void {
    this.currentUpdate = update
  }

  // Mutation method wrappers - these record changes instead of mutating

  public addLeadingComment(node: Node, comment: string): void {
    if (!this.currentUpdate) return

    this.contextBuilder.recordChange({
      confidence: 'uncertain',
      changeType: 'comment',
      location: {
        file: node.location.file,
        line: this.getLineNumber(node),
        componentId: node.id,
        elementName: this.getElementName(node),
      },
      change: {
        description: comment,
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public changeLiteralNode(node: Node<LiteralNode>, newValue: string): void {
    if (!this.currentUpdate) return

    const oldValue = String(getLiteralValue(node.node))

    this.contextBuilder.recordChange({
      confidence: 'concrete',
      changeType: 'literal',
      location: {
        file: node.location.file,
        line: this.getLineNumber(node),
        componentId: node.id,
        elementName: this.getElementName(node),
      },
      change: {
        description: `Change literal value from "${oldValue}" to "${newValue}"`,
        oldValue,
        newValue,
        codeSnippet: this.getCodeSnippetWithLine(node),
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public addAttributeToElement(
    node: JSXElementNode,
    propertyName: string,
    newValue: string,
  ): void {
    if (!this.currentUpdate) return

    this.contextBuilder.recordChange({
      confidence: 'concrete',
      changeType: 'attribute',
      location: {
        file: node.location.file,
        line: this.getLineNumber(node),
        componentId: node.id,
        elementName: this.getElementName(node),
      },
      change: {
        description: `Add attribute ${propertyName} with value "${newValue}"`,
        oldValue: '',
        newValue,
        propertyName,
        codeSnippet: this.getCodeSnippetWithLine(node),
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public addJSXTextToElement(node: JSXElementNode, newValue: string): void {
    if (!this.currentUpdate) return

    this.contextBuilder.recordChange({
      confidence: 'concrete',
      changeType: 'attribute',
      location: {
        file: node.location.file,
        line: this.getLineNumber(node),
        componentId: node.id,
        elementName: this.getElementName(node),
      },
      change: {
        description: `Add JSX text content "${newValue}"`,
        oldValue: '',
        newValue,
        propertyName: 'children',
        codeSnippet: this.getCodeSnippetWithLine(node),
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public addStyleToElement(
    node: JSXElementNode,
    propertyName: string,
    newValue: string,
  ): void {
    if (!this.currentUpdate) return

    this.contextBuilder.recordChange({
      confidence: 'concrete',
      changeType: 'style',
      location: {
        file: node.location.file,
        line: this.getLineNumber(node),
        componentId: node.id,
        elementName: this.getElementName(node),
      },
      change: {
        description: `Add style property ${propertyName}: "${newValue}"`,
        oldValue: '',
        newValue,
        propertyName,
        codeSnippet: this.getCodeSnippetWithLine(node),
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public addChildElement(
    instanceNodes: any,
    componentId: string,
    childIndex: number,
    index: number,
    parentElement: JSXElementNode,
    beforeSibling?: JSXElementNode,
  ): void {
    if (!this.currentUpdate) return

    this.contextBuilder.recordChange({
      confidence: 'concrete',
      changeType: 'element-create',
      location: {
        file: parentElement.location.file,
        line: this.getLineNumber(parentElement),
        componentId: parentElement.id,
        elementName: this.getElementName(parentElement),
      },
      change: {
        description: `Create child element at index ${index}`,
        oldValue: '',
        newValue: `New element with componentId: ${componentId}`,
        codeSnippet: this.getCodeSnippetWithLine(parentElement),
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public deleteElement(jsxElement: JSXElementNode): {
    content: string
    childElements: JSXElementNode[]
  } {
    if (this.currentUpdate) {
      this.contextBuilder.recordChange({
        confidence: 'concrete',
        changeType: 'element-delete',
        location: {
          file: jsxElement.location.file,
          line: this.getLineNumber(jsxElement),
          componentId: jsxElement.id,
          elementName: this.getElementName(jsxElement),
        },
        change: {
          description: `Delete element ${jsxElement.name}`,
          oldValue: this.getCodeSnippetWithLine(jsxElement),
          newValue: '',
          codeSnippet: this.getCodeSnippetWithLine(jsxElement),
        },
        originalUpdate: this.currentUpdate.update,
      })
    }

    // Return mock data - we don't actually delete in build-context mode
    const childElements = jsxElement.getJSXChildren(true)
    const content = jsxElement.getNodeContent()
    return { content, childElements }
  }

  public replaceNode(node: Node, newNode: any): void {
    if (!this.currentUpdate) return

    this.contextBuilder.recordChange({
      confidence: 'concrete',
      changeType: 'literal',
      location: {
        file: node.location.file,
        line: this.getLineNumber(node),
        componentId: node.id,
        elementName: this.getElementName(node),
      },
      change: {
        description: `Replace node`,
        oldValue: this.getCodeSnippetWithLine(node),
        newValue: 'Replaced with new node',
        codeSnippet: this.getCodeSnippetWithLine(node),
      },
      originalUpdate: this.currentUpdate.update,
    })
  }

  public dirtyNode(_node: Node): void {
    // No-op in context mode - doesn't record change
  }

  // Helper methods for extracting information

  private getLineNumber(node: Node): number {
    return node.location.start
  }

  private getCodeSnippetWithLine(node: Node): string {
    try {
      const lines = this.originalGraph.code.split('\n')
      const lineNumber = node.location.start
      const line = lines[lineNumber - 1] || ''

      return `${lineNumber} | ${line.trim()}`
    } catch {
      return `${node.location.start} | [Code snippet unavailable]`
    }
  }

  private getElementName(node: Node): string | undefined {
    try {
      // Try to find the element name from the node
      if ('name' in node && typeof node.name === 'string') {
        return node.name
      }

      // Try to get from parent if it's a JSXElement
      const parent = node.getParent()
      if (parent && 'name' in parent && typeof parent.name === 'string') {
        return parent.name
      }

      return undefined
    } catch {
      return undefined
    }
  }

  // Proxy read-only methods to originalGraph
  // These are needed so update handlers can query the graph

  public getNodes() {
    return this.originalGraph.getNodes()
  }

  public get nodes() {
    return this.originalGraph.nodes
  }

  public get files() {
    return this.originalGraph.files
  }

  public get importMappings() {
    return this.originalGraph.importMappings
  }

  public get code() {
    return this.originalGraph.code
  }

  public get file() {
    return this.originalGraph.file
  }

  public resolveImports(importPath: string): string {
    return this.originalGraph.resolveImports(importPath)
  }

  public addDataDependency(fromId: string, toId: string) {
    return this.originalGraph.addDataDependency(fromId, toId)
  }

  public addDependency(fromId: string, toId: string) {
    return this.originalGraph.addDependency(fromId, toId)
  }

  public addParent(fromId: string, parentId: string) {
    return this.originalGraph.addParent(fromId, parentId)
  }

  public createNode<T extends import('@babel/types').Node>(
    name: string,
    path: import('@babel/traverse').NodePath<T>,
  ): Node<T> {
    return this.originalGraph.createNode(name, path)
  }

  public setNode(node: Node) {
    return this.originalGraph.setNode(node)
  }

  public setNewNode(node: Node, parent: Node) {
    return this.originalGraph.setNewNode(node, parent)
  }

  public addNode<T extends import('@babel/types').Node>(
    name: string,
    path: import('@babel/traverse').NodePath<T>,
  ): Node {
    return this.originalGraph.addNode(name, path)
  }

  public createJSXAttributeNode(
    parent: JSXElementNode,
    name: string,
    value: Node | string,
  ) {
    return this.originalGraph.createJSXAttributeNode(parent, name, value)
  }

  public createObjectExpressionNode(
    node: import('@babel/types').ObjectExpression,
    parent: Node,
  ) {
    return this.originalGraph.createObjectExpressionNode(node, parent)
  }

  public addJSXElement(
    jsxElementNode: JSXElementNode,
    parentElement: JSXElementNode | undefined,
    component: any,
    beforeSibling?: JSXElementNode,
  ) {
    return this.originalGraph.addJSXElement(
      jsxElementNode,
      parentElement,
      component,
      beforeSibling,
    )
  }

  public addComponentNode(
    name: string,
    path: import('@babel/traverse').NodePath<
      | import('@babel/types').FunctionDeclaration
      | import('@babel/types').ArrowFunctionExpression
    >,
  ) {
    return this.originalGraph.addComponentNode(name, path)
  }

  public getComponentName(path: import('@babel/traverse').NodePath) {
    return this.originalGraph.getComponentName(path)
  }

  public pushMappedDependency(id: any) {
    return this.originalGraph.pushMappedDependency(id)
  }

  public popMappedDependency() {
    return this.originalGraph.popMappedDependency()
  }

  public getJSXElementById(
    componentId: string,
    childIndex: number,
  ): import('../indexor/nodes/jsx-element').JSXElementNode | undefined {
    return this.originalGraph.getJSXElementById(componentId, childIndex)
  }

  public evaluatePropertyOrAdd(node: Node, property: string): Node {
    return this.originalGraph.evaluatePropertyOrAdd(node, property)
  }
}
