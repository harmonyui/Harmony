import * as parser from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { ComponentLocation } from '@harmony/util/src/types/component'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import { getSnippetFromNode } from '../publish/code-updator'
import { isLiteralNode } from './ast'

type NodeType = NodePath['type']

interface NodeBase<T extends t.Node> {
  id: string
  location: ComponentLocation
  type: NodeType
  name: string
  dependencies: Set<Node>
  dependents: Set<Node>
  path: NodePath<T>
}
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
}

export class JSXAttributeNode extends Node<t.JSXAttribute> {
  private value: Node
  constructor(
    private parentElement: JSXElementNode,
    base: NodeBase<t.JSXAttribute>,
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

    const key = t.isJSXExpressionContainer(arg.value)
      ? `value.expression`
      : `value`
    const value = attributePath.get(key)
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
    private attributes: Map<string, JSXAttributeNode>,
    private parentComponent: ComponentNode,
    private definitionComponent: ComponentNode | undefined,
    base: NodeBase<t.JSXElement>,
  ) {
    super(base)
  }

  public getAttributes() {
    return Array.from(this.attributes.values())
  }

  public getParentComponent() {
    return this.parentComponent
  }

  public getDefinitionComponent() {
    return this.definitionComponent
  }

  public addAttribute(name: string, attribute: JSXAttributeNode) {
    this.attributes.set(name, attribute)
  }
}

class ComponentNode extends Node<t.FunctionDeclaration> {
  constructor(
    private props: Map<string, Node>,
    private elements: JSXElementNode[],
    {
      id,
      location,
      name,
      dependencies,
      dependents,
      path,
    }: NodeBase<t.FunctionDeclaration>,
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

  public addJSXElement(element: JSXElementNode) {
    this.elements.push(element)
  }
}

export class FlowGraph {
  public nodes: Map<string, Node>
  private dirtyNodes: Set<Node> = new Set<Node>()

  constructor(
    private file: string,
    private code: string,
  ) {
    this.nodes = new Map()
  }

  public getNodes() {
    const values = Array.from(this.nodes.values())

    return values.sort((a, b) => b.location.start - a.location.start)
  }

  public addNode<T extends t.Node>(name: string, path: NodePath<T>): Node {
    const id = getLocationId(path.node)
    if (!this.nodes.has(id)) {
      const newNode = this.createNode(name, path)
      this.nodes.set(id, newNode)
    }
    const node = this.nodes.get(id)
    if (!node) throw new Error(`Node with ID ${id} not found`)

    return node
  }

  public createNode<T extends t.Node>(
    name: string,
    path: NodePath<T>,
  ): Node<T> {
    return createNode(name, path, this.file)
  }

  public addDependency(fromId: string, toId: string) {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)

    if (fromNode && toNode) {
      fromNode.dependencies.add(toNode)
      toNode.dependents.add(fromNode)
    }
  }

  public addComponentNode(
    name: string,
    path: NodePath<t.FunctionDeclaration>,
  ): ComponentNode {
    const props = new Map<string, Node>()
    const addPropNode = (param: t.Identifier, pathKey: string) => {
      const paramName = param.name
      const paramPath = path.get(pathKey)
      if (Array.isArray(paramPath)) throw new Error('Should not be array')

      const paramNode = this.addNode(paramName, paramPath)
      props.set(paramName, paramNode)
    }

    path.node.params.forEach((param, index) => {
      if (t.isIdentifier(param)) {
        addPropNode(param, `params.${index}`)
      } else if (t.isObjectPattern(param)) {
        param.properties.forEach((prop, propIndex) => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            addPropNode(prop.key, `params.${index}.properties.${propIndex}`)
          }
        })
      }
    })
    const node = this.createNode(name, path)
    const componentNode: ComponentNode = new ComponentNode(props, [], node)
    props.forEach((prop) => this.addDependency(componentNode.id, prop.id))

    if (!this.nodes.has(componentNode.id)) {
      this.nodes.set(componentNode.id, componentNode)
    }
    return componentNode
  }

  public addJSXElement(
    jsxElementNode: JSXElementNode,
    component: ComponentNode,
  ) {
    this.nodes.set(jsxElementNode.id, jsxElementNode)
    component.addJSXElement(jsxElementNode)
    this.addDependency(jsxElementNode.id, component.id)
  }

  public addJSXAttribute(
    jsxAttributeNode: JSXAttributeNode,
    jsxElementNode: JSXElementNode,
  ) {
    this.nodes.set(jsxAttributeNode.id, jsxAttributeNode)
    jsxElementNode.addAttribute(jsxAttributeNode.name, jsxAttributeNode)
    const definitionComponent = jsxElementNode.getDefinitionComponent()

    const valueNode = jsxAttributeNode.getValueNode()
    this.nodes.set(valueNode.id, valueNode)
    if (definitionComponent) {
      this.addComponentDataEdge(
        definitionComponent,
        jsxAttributeNode.name,
        valueNode,
      )
    }

    if (t.isIdentifier(valueNode.node)) {
      this.addDataFlowEdge(
        jsxAttributeNode.path,
        valueNode as Node<t.Identifier>,
      )
    }
    this.addDependency(jsxAttributeNode.id, jsxElementNode.id)
  }

  public addComponentDataEdge(
    component: ComponentNode,
    name: string,
    valueNode: Node,
  ) {
    const prop = component.getProperties().get(name)
    if (prop) {
      //JSXElement Component prop -> AttributeValue
      this.addDependency(prop.id, valueNode.id)
    }
  }

  public addDataFlowEdge(path: NodePath, node: Node<t.Identifier>) {
    const param = path.scope.bindings[node.name].identifier
    const paramId = getLocationId(param)
    this.addDependency(node.id, paramId)
  }

  public getDefinition(name: string): ComponentNode | undefined {
    let definitionNode: ComponentNode | undefined
    this.nodes.forEach((node) => {
      if (node.type === 'FunctionDeclaration' && node.name === name) {
        definitionNode = node as ComponentNode
      }
    })
    return definitionNode
  }

  public getNodeById(id: string): Node | undefined {
    return this.nodes.get(id)
  }

  // Output graph dependencies for debugging
  public printDependencies() {
    this.nodes.forEach((node) => {
      console.log(`${node.type} ${node.name} (${node.id}):`)
      console.log('  Dependencies:', Array.from(node.dependencies))
      console.log('  Dependents:', Array.from(node.dependents))
    })
  }

  public changeNodeValue(node: Node<t.StringLiteral>, newValue: string) {
    const newNode = t.stringLiteral(newValue)
    node.path.replaceWith(newNode)
    this.dirtyNodes.add(node)
  }

  public saveChanges() {
    this.dirtyNodes.forEach((node) => {
      if (!isLiteralNode(node.node)) return
      const value = getSnippetFromNode(node.node)
      if (!value) return
      this.code = replaceByIndex(
        this.code,
        value,
        node.location.start,
        node.location.end,
      )
    })
    this.dirtyNodes.clear()
  }

  public getCode() {
    return this.code
  }
}

function getContainingComponent(
  path: NodePath,
  graph: FlowGraph,
): ComponentNode | undefined {
  let parent = path.parentPath
  while (parent) {
    if (t.isFunctionDeclaration(parent.node)) {
      const name = parent.node.id?.name
      if (name) {
        const comp = graph.nodes.get(getLocationId(parent.node))
        if (comp && comp instanceof ComponentNode) return comp
      }
    }
    parent = parent.parentPath
  }
  return undefined
}

function createNode<T extends t.Node>(
  name: string,
  path: NodePath<T>,
  file: string,
): Node<T> {
  const _node = path.node
  const id = getLocationId(_node)
  const location = {
    file,
    start: _node.loc?.start.index ?? 0,
    end: _node.loc?.end.index ?? 0,
  }
  const type = _node.type
  const newNode: Node<T> = new Node<T>({
    id,
    type,
    name,
    dependencies: new Set(),
    dependents: new Set(),
    path,
    location,
  })
  return newNode
}

export function traceDataFlow(node: Node): Node[] {
  const origins: Node[] = []
  const visited = new Set<string>()

  const dfs = (current: Node) => {
    if (visited.has(current.id)) return
    visited.add(current.id)

    if (isLiteralNode(current.node)) {
      // Found an origin with a static value
      origins.push(current)
    } else {
      // Recursively trace dependencies to find origins
      current.dependencies.forEach((depId) => dfs(depId))
    }
  }

  dfs(node)
  return origins
}

// Utility function to generate unique IDs based on code location
function getLocationId(node: t.Node): string {
  const loc = node.loc
  return loc
    ? `${loc.start.line}:${loc.start.column}-${loc.end.line}:${loc.end.column}`
    : 'unknown-location'
}

export function getGraph(code: string) {
  // Initialize the flow graph
  const graph = new FlowGraph('test.ts', code)

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  // Traverse the AST to populate the graph with explicit dependencies and data flow edges
  traverse(ast, {
    FunctionDeclaration(path) {
      const functionName = path.node.id?.name

      if (functionName) {
        graph.addComponentNode(functionName, path)
      }
    },

    JSXElement(path) {
      const containingComponent = getContainingComponent(path, graph)
      if (!containingComponent)
        throw new Error('Should have a containing component')

      if (t.isJSXIdentifier(path.node.openingElement.name)) {
        const name = path.node.openingElement.name.name
        const definitionComponent = graph.getDefinition(name)

        const elementNode = new JSXElementNode(
          new Map(),
          containingComponent,
          definitionComponent,
          graph.createNode(name, path),
        )

        graph.addJSXElement(elementNode, containingComponent)

        path.traverse({
          JSXAttribute(attributePath) {
            if (t.isJSXIdentifier(attributePath.node.name)) {
              const attributeNode = new JSXAttributeNode(
                elementNode,
                graph.createNode(attributePath.node.name.name, attributePath),
              )

              graph.addJSXAttribute(attributeNode, elementNode)
            }
          },
        })
      }
    },
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee)) {
        const calleeName = path.node.callee.name
        const callNode = graph.addNode(calleeName, path)

        const definitionNode = graph.getDefinition(calleeName)

        if (definitionNode) {
          graph.addDependency(callNode.id, definitionNode.id)
        }

        // Map arguments to parameters and establish data flow edges
        path.node.arguments.forEach((arg, index) => {
          if (t.isStringLiteral(arg) || t.isIdentifier(arg)) {
            const argPath = path.get(`arguments.${index}`)
            if (Array.isArray(argPath)) throw new Error('Should not be array')
            const argumentNode = graph.addNode(getSnippetFromNode(arg), argPath)

            if (definitionNode) {
              graph.addComponentDataEdge(definitionNode, '', argumentNode) // Data flow from argument to parameter
            }

            if (t.isIdentifier(argumentNode.node)) {
              graph.addDataFlowEdge(argPath, argumentNode as Node<t.Identifier>)
            }
          }
        })
      }
    },
  })

  return graph
}
