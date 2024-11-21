import * as parser from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import { getSnippetFromNode } from '../publish/code-updator'
import { isLiteralNode } from './ast'
import type { Node } from './types'
import { createNode, getComponentName, getLocationId } from './utils'
import { ComponentNode, JSXAttributeNode, JSXElementNode } from './node'
import { addDataEdge } from './data-flow'

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

    return values.sort((a, b) => a.location.start - b.location.start)
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
    path: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  ): ComponentNode {
    const props = new Map<string, Node>()
    const _arguments: Node[] = []
    const addPropNode = (param: t.Identifier, pathKey: string) => {
      const paramName = param.name
      const paramPath = path.get(pathKey)
      if (Array.isArray(paramPath)) throw new Error('Should not be array')

      const paramNode = this.addNode(paramName, paramPath)
      props.set(paramName, paramNode)
    }
    const addArgumentNode = (param: t.Node, pathKey: string) => {
      const paramPath = path.get(pathKey)
      if (Array.isArray(paramPath)) throw new Error('Should not be array')

      const paramNode = this.addNode(getSnippetFromNode(param), paramPath)
      _arguments.push(paramNode)
    }

    path.node.params.forEach((param, index) => {
      addArgumentNode(param, `params.${index}`)
      if (t.isObjectPattern(param)) {
        param.properties.forEach((prop, propIndex) => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            addPropNode(prop.key, `params.${index}.properties.${propIndex}`)
          }
        })
      }
    })
    const node = this.createNode(name, path)
    const componentNode: ComponentNode = new ComponentNode(
      props,
      _arguments,
      [],
      node,
    )
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
    jsxElementNode.addAttribute(jsxAttributeNode)
    const definitionComponent = jsxElementNode.getDefinitionComponent()

    const valueNode = jsxAttributeNode.getValueNode()
    this.addDataFlowEdge(valueNode)
    if (definitionComponent) {
      this.addComponentDataEdge(
        definitionComponent,
        jsxAttributeNode.name,
        valueNode,
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

  public addDataFlowEdge(node: Node) {
    addDataEdge(node, this)
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

export function getGraph(code: string) {
  // Initialize the flow graph
  const graph = new FlowGraph('test.ts', code)

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  // Traverse the AST to populate the graph with explicit dependencies and data flow edges
  traverse(ast, {
    'FunctionDeclaration|ArrowFunctionExpression'(path) {
      if (
        !t.isFunctionDeclaration(path.node) &&
        !t.isArrowFunctionExpression(path.node)
      )
        return
      const functionName = getComponentName(path)
      if (!functionName) return

      const containingComponent = graph.addComponentNode(
        functionName,
        path as NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>,
      )

      path.traverse({
        JSXElement(jsxPath) {
          if (t.isJSXIdentifier(jsxPath.node.openingElement.name)) {
            const name = jsxPath.node.openingElement.name.name
            const definitionComponent = graph.getDefinition(name)

            const elementNode = new JSXElementNode(
              [],
              containingComponent,
              definitionComponent,
              graph.createNode(name, jsxPath),
            )

            graph.addJSXElement(elementNode, containingComponent)

            for (
              let i = 0;
              i < jsxPath.node.openingElement.attributes.length;
              i++
            ) {
              const attributePath = jsxPath.get(
                `openingElement.attributes.${i}`,
              )
              if (Array.isArray(attributePath))
                throw new Error('Should not be array')

              const attributeName =
                t.isJSXAttribute(attributePath.node) &&
                t.isJSXIdentifier(attributePath.node.name)
                  ? attributePath.node.name.name
                  : getSnippetFromNode(attributePath.node)
              const attributeNode = new JSXAttributeNode(
                elementNode,
                graph.createNode(
                  attributeName,
                  attributePath as NodePath<t.JSXAttribute>,
                ),
              )

              graph.addJSXAttribute(attributeNode, elementNode)
            }

            for (let i = 0; i < jsxPath.node.children.length; i++) {
              const node = jsxPath.node.children[i]
              if (t.isJSXText(node) && node.value.trim().length === 0) continue

              const childPath = jsxPath.get(`children.${i}`)
              if (Array.isArray(childPath))
                throw new Error('Should not be array')

              if (
                t.isJSXExpressionContainer(childPath.node) ||
                t.isJSXText(childPath.node)
              ) {
                const attributeNode = new JSXAttributeNode(
                  elementNode,
                  graph.createNode(
                    'children',
                    childPath as NodePath<t.JSXExpressionContainer | t.JSXText>,
                  ),
                )

                graph.addJSXAttribute(attributeNode, elementNode)
              }
            }
          }
        },
      })
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
            const argumentNode = graph.createNode(
              getSnippetFromNode(arg),
              argPath,
            )
            graph.addDataFlowEdge(argumentNode)
            if (definitionNode) {
              graph.addComponentDataEdge(definitionNode, '', argumentNode) // Data flow from argument to parameter
            }
          }
        })
      }
    },
  })

  return graph
}
