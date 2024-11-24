import * as parser from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import { getSnippetFromNode } from '../publish/code-updator'
import type { Node } from './types'
import {
  createNode,
  getComponentName,
  getLocationId,
  isLiteralNode,
} from './utils'
import { addDataEdge } from './data-flow'
import { JSXSpreadAttributeNode } from './nodes/jsxspread-attribute'
import { JSXElementNode } from './nodes/jsx-element'
import type { JSXAttribute } from './nodes/jsx-attribute'
import { JSXAttributeNode } from './nodes/jsx-attribute'
import { ComponentNode } from './nodes/component'

export class FlowGraph {
  public nodes: Map<string, Node>
  private dirtyNodes: Set<Node> = new Set<Node>()

  constructor(
    public file: string,
    public code: string,
  ) {
    this.nodes = new Map()
  }

  public getNodes() {
    const values = Array.from(this.nodes.values())

    return values.sort((a, b) => a.location.start - b.location.start)
  }

  public addNode<T extends t.Node>(name: string, path: NodePath<T>): Node {
    const id = getLocationId(path.node, this.file, this.code)
    if (!this.nodes.has(id)) {
      const newNode = this.createNode(name, path)
      this.setNode(newNode)
    }
    const node = this.nodes.get(id)
    if (!node) throw new Error(`Node with ID ${id} not found`)

    return node
  }

  public setNode(node: Node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node)
    }
  }

  public createNode<T extends t.Node>(
    name: string,
    path: NodePath<T>,
  ): Node<T> {
    return createNode(name, path, this.file, this.code)
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
    const _arguments: Node[] = []

    const addArgumentNode = (param: t.Node, pathKey: string) => {
      const paramPath = path.get(pathKey)
      if (Array.isArray(paramPath)) throw new Error('Should not be array')

      const paramNode = this.addNode(getSnippetFromNode(param), paramPath)
      _arguments.push(paramNode)
    }

    path.node.params.forEach((param, index) => {
      addArgumentNode(param, `params.${index}`)
    })
    const node = this.createNode(name, path)
    const componentNode: ComponentNode = new ComponentNode(_arguments, [], node)

    this.setNode(componentNode)
    return componentNode
  }

  public addJSXElement(
    jsxElementNode: JSXElementNode,
    component: ComponentNode,
  ) {
    this.setNode(jsxElementNode)
    component.addJSXElement(jsxElementNode)
  }

  public addJSXAttribute(
    jsxAttributeNode: JSXAttribute,
    jsxElementNode: JSXElementNode,
  ) {
    this.setNode(jsxAttributeNode)
    jsxElementNode.addAttribute(jsxAttributeNode)

    const valueNode = jsxAttributeNode.getValueNode()
    this.addDataFlowEdge(valueNode)
    //For JSXText, the valueNode is the same as the attributeNode
    if (valueNode.id !== jsxAttributeNode.id) {
      jsxAttributeNode.setValueNode(this.nodes.get(valueNode.id) ?? valueNode)
    }
    if (jsxAttributeNode instanceof JSXSpreadAttributeNode) {
      this.addDependency(jsxAttributeNode.id, valueNode.id)
    } else {
      this.addDependency(jsxAttributeNode.id, jsxElementNode.id)
    }
  }

  public addFunctionArgumentDataEdge(
    definition: ComponentNode,
    argumentNodes: Node[],
  ) {
    if (argumentNodes.length > definition.getArguments().length)
      throw new Error('Too many arguments')
    argumentNodes.forEach((arg, index) => {
      const param = definition.getArguments()[index]
      this.addDependency(param.id, arg.id)
    })
  }

  public addJSXInstanceComponentEdge(
    elementDefinition: ComponentNode,
    elementNode: JSXElementNode,
  ) {
    this.addFunctionArgumentDataEdge(elementDefinition, [elementNode])
    elementDefinition.addInstance(elementNode)
    elementNode.setDefinitionComponent(elementDefinition)
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

  public getElementInstances(name: string): JSXElementNode[] {
    const instances: JSXElementNode[] = []
    this.nodes.forEach((node) => {
      if (node instanceof JSXElementNode && node.name === name) {
        instances.push(node)
      }
    })
    return instances
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

export function getGraph(file: string, code: string) {
  // Initialize the flow graph
  const graph = new FlowGraph(file, code)

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
      const instances = graph.getElementInstances(functionName)
      instances.forEach((instance) => {
        graph.addJSXInstanceComponentEdge(containingComponent, instance)
      })

      path.traverse({
        JSXElement(jsxPath) {
          if (t.isJSXIdentifier(jsxPath.node.openingElement.name)) {
            const name = jsxPath.node.openingElement.name.name
            const definitionComponent = graph.getDefinition(name)

            const openingElement = graph.createNode(
              getSnippetFromNode(jsxPath.node.openingElement),
              jsxPath.get('openingElement'),
            )

            const elementNode = new JSXElementNode(
              [],
              containingComponent,
              definitionComponent,
              openingElement,
              graph.createNode(name, jsxPath),
            )

            graph.addJSXElement(elementNode, containingComponent)

            const currAttributes: JSXAttributeNode[] = []
            for (
              let i = 0;
              i < jsxPath.node.openingElement.attributes.length;
              i++
            ) {
              const attributePath = jsxPath.get(
                `openingElement.attributes.${i}`,
              ) as NodePath<t.JSXAttribute | t.JSXSpreadAttribute>

              if (t.isJSXAttribute(attributePath.node)) {
                const attributeName = t.isJSXIdentifier(attributePath.node.name)
                  ? attributePath.node.name.name
                  : getSnippetFromNode(attributePath.node)
                const attributeNode = new JSXAttributeNode(
                  elementNode,
                  -1,
                  graph.code,
                  graph.createNode(
                    attributeName,
                    attributePath as NodePath<t.JSXAttribute>,
                  ),
                )

                graph.addJSXAttribute(attributeNode, elementNode)
                currAttributes.push(attributeNode)
              } else {
                const spreadAttributeNode = new JSXSpreadAttributeNode(
                  elementNode,
                  currAttributes,
                  graph.code,
                  graph.createNode(
                    getSnippetFromNode(attributePath.node),
                    attributePath as NodePath<t.JSXSpreadAttribute>,
                  ),
                )

                graph.addJSXAttribute(spreadAttributeNode, elementNode)
              }
            }

            let childIndex = 0
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
                  childIndex,
                  graph.code,
                  graph.createNode(
                    'children',
                    childPath as NodePath<t.JSXExpressionContainer | t.JSXText>,
                  ),
                )

                graph.addJSXAttribute(attributeNode, elementNode)
              }
              childIndex++
            }

            //Connect the element to the definition component
            const elementDefinition = elementNode.getDefinitionComponent()
            if (elementDefinition) {
              graph.addJSXInstanceComponentEdge(elementDefinition, elementNode)
            }
          } else {
            throw new Error("I dunno what's going on")
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
          }
        })
      }
    },
  })

  return graph
}