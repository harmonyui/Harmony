import * as parser from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import type { ArrayProperty, Node } from './types'
import type { LiteralNode } from './utils'
import {
  createNode,
  getComponentName,
  getLocationId,
  getSnippetFromNode,
  isLiteralNode,
} from './utils'
import { addDataEdge } from './data-flow'
import { JSXSpreadAttributeNode } from './nodes/jsxspread-attribute'
import { isJSXElement, JSXElementNode } from './nodes/jsx-element'
import { JSXAttributeNode } from './nodes/jsx-attribute'
import type { JSXAttribute } from './nodes/jsx-attribute'
import { ComponentNode } from './nodes/component'
import {
  isJSXText,
  isStringLiteral,
  isTemplateElement,
} from './predicates/simple-predicates'

export type FileUpdateInfo = Record<
  string,
  {
    filePath: string
    locations: {
      snippet: string
      start: number
      end: number
      updatedTo: number
      diff: number
    }[]
  }
>
export class FlowGraph {
  public nodes: Map<string, Node>
  public file = ''
  public code = ''
  private dirtyNodes: Set<Node> = new Set<Node>()
  private insertNodes: Set<Node> = new Set<Node>()
  private mappedDependencyStack: ArrayProperty[] = []
  public idMapping: Record<string, string> = {}

  constructor() {
    this.nodes = new Map()
  }

  public addProject(file: string, code: string) {
    this.file = file
    this.code = code
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

  public addDataDependency(fromId: string, toId: string) {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)

    if (fromNode && toNode) {
      fromNode.dependencies.add(toNode)
      toNode.dependents.add(fromNode)
      const parent = fromNode.getParent()
      parent && this.addParent(toNode.id, parent.id)
    }
  }

  public addDependency(fromId: string, toId: string) {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)

    if (fromNode && toNode) {
      fromNode.dependencies.add(toNode)
      toNode.dependents.add(fromNode)
    }
  }

  public addParent(fromId: string, parentId: string) {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(parentId)

    if (fromNode && toNode && !fromNode.getParent()) {
      fromNode.setParent(toNode)
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
    parentElement: JSXElementNode | undefined,
    component: ComponentNode,
  ) {
    this.setNode(jsxElementNode)
    this.setNode(jsxElementNode.getOpeningElement())
    const closingElement = jsxElementNode.getClosingElement()
    closingElement && this.setNode(closingElement)
    component.addJSXElement(jsxElementNode)
    parentElement?.addChild(jsxElementNode)
  }

  public addJSXAttribute(
    jsxAttributeNode: JSXAttribute,
    jsxElementNode: JSXElementNode,
  ) {
    this.setNode(jsxAttributeNode)
    jsxElementNode.addAttribute(jsxAttributeNode)

    const valueNode = jsxAttributeNode.getValueNode()
    valueNode.setParent(jsxElementNode)
    this.addDataFlowEdge(valueNode)
    const mappingExpression = this.popMappedDependency()
    if (mappingExpression) {
      jsxAttributeNode.isMappedExpression = true
      jsxElementNode.setMappingExpression(mappingExpression)
    }
    //For JSXText, the valueNode is the same as the attributeNode
    if (valueNode.id !== jsxAttributeNode.id) {
      jsxAttributeNode.setValueNode(this.nodes.get(valueNode.id) ?? valueNode)
    }
    ;(this.nodes.get(valueNode.id) ?? valueNode).setParent(jsxElementNode)

    if (jsxAttributeNode instanceof JSXSpreadAttributeNode) {
      this.addDataDependency(jsxAttributeNode.id, valueNode.id)
    } else {
      this.addDataDependency(jsxAttributeNode.id, jsxElementNode.id)
    }
  }

  public addFunctionArgumentDataEdge(
    definition: ComponentNode,
    argumentNodes: Node[],
  ) {
    if (argumentNodes.length > definition.getArguments().length) return
    argumentNodes.forEach((arg, index) => {
      const param = definition.getArguments()[index]
      this.addDataDependency(param.id, arg.id)
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
      if (isJSXElement(node) && node.name === name) {
        instances.push(node)
      }
    })
    return instances
  }

  public getNodeById(id: string): Node | undefined {
    return this.nodes.get(id)
  }

  public getJSXElementById(
    id: string,
    childIndex: number,
  ): JSXElementNode | undefined {
    const node =
      this.nodes.get(this.idMapping[`${id}-${childIndex}`]) ??
      this.nodes.get(id)
    if (node && isJSXElement(node)) {
      return node
    }

    return undefined
  }

  // Output graph dependencies for debugging
  public printDependencies() {
    this.nodes.forEach((node) => {
      console.log(`${node.type} ${node.name} (${node.id}):`)
      console.log('  Dependencies:', Array.from(node.dependencies))
      console.log('  Dependents:', Array.from(node.dependents))
    })
  }

  public dirtyNode(node: Node, oldValue: string) {
    if (
      Array.from(this.insertNodes).find(
        (n) =>
          n.location.start <= node.location.start &&
          n.location.end >= node.location.end,
      )
    ) {
      const afterNodes = this.getNodes().filter(
        (_node) =>
          _node.location.file === node.location.file &&
          _node.location.start >= node.location.start,
      )
      const inBetweenNodes = this.getNodes().filter(
        (_node) =>
          _node.location.file === node.location.file &&
          _node.location.start < node.location.start &&
          _node.location.end > node.location.start,
      )
      const newNodeContent = getSnippetFromNode(node.node)
      const newNodeLength = newNodeContent.length - oldValue.length
      afterNodes.forEach((_node) => {
        _node.location.start += newNodeLength
        _node.location.end += newNodeLength
      })
      inBetweenNodes.forEach((_node) => {
        _node.location.end += newNodeLength
      })
      return
    }
    this.dirtyNodes.add(node)
  }

  public replaceNode(node: Node, newNode: t.Node) {
    const oldValue = getSnippetFromNode(node.node)
    node.path.replaceWith(newNode)
    this.dirtyNode(node, oldValue)
  }

  public addLeadingComment(node: Node, comment: string) {
    const oldValue = getSnippetFromNode(node.node)
    node.path.addComment('leading', comment)
    this.dirtyNode(node, oldValue)
  }

  public changeLiteralNode(node: Node<LiteralNode>, newValue: string) {
    if (isJSXText(node)) {
      const newNode = t.jsxText(newValue)
      this.replaceNode(node, newNode)
    } else if (isStringLiteral(node)) {
      const newNode = t.stringLiteral(newValue)
      this.replaceNode(node, newNode)
    } else if (isTemplateElement(node)) {
      const newNode = t.templateElement({ raw: newValue }, node.node.tail)
      this.replaceNode(node, newNode)
    } else {
      throw new Error('Given node is not a literal node')
    }
  }

  public addAttributeToElement(
    node: JSXElementNode,
    propertyName: string,
    newValue: string,
  ) {
    const newNode = t.jsxAttribute(
      t.jsxIdentifier(propertyName),
      t.stringLiteral(newValue),
    )
    const oldValue = getSnippetFromNode(node.node)
    node.path.node.openingElement.attributes.push(newNode)
    this.dirtyNode(node, oldValue)
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

  public addChildElement(
    {
      element: childElement,
      nodes,
    }: { element: JSXElementNode; nodes: Node[] },
    componentId: string,
    childIndex: number,
    index: number,
    parentElement: JSXElementNode,
  ) {
    this.setNode(childElement)
    nodes.forEach((node) => this.setNode(node))

    const beforeElement = parentElement.getChildren()[index] as
      | JSXElementNode
      | undefined
    if (!beforeElement) {
      parentElement.path.pushContainer('children', childElement.node)
      const parentClosingElement = parentElement.getClosingElement()
      this.insertNewNode(childElement, parentClosingElement.location.start)
    } else {
      beforeElement.path.insertBefore(childElement.node)
      this.insertNewNode(childElement, beforeElement.location.start)
    }
    const offset = childElement.location.start
    nodes.forEach((node) => {
      node.location.start += offset
      node.location.end += offset
    })
    this.addJSXElement(
      childElement,
      parentElement,
      parentElement.getParentComponent(),
    )
    this.idMapping[`${componentId}-${childIndex}`] = childElement.id

    return childElement
  }

  public insertNewNode(node: Node, startIndex: number) {
    const afterNodes = this.getNodes().filter(
      (_node) =>
        _node.location.file === node.location.file &&
        _node.location.start >= startIndex,
    )
    const inBetweenNodes = this.getNodes().filter(
      (_node) =>
        _node.location.file === node.location.file &&
        _node.location.start < startIndex &&
        _node.location.end > startIndex,
    )
    const newNodeContent = getSnippetFromNode(node.node)
    const newNodeLength = newNodeContent.length
    afterNodes.forEach((_node) => {
      _node.location.start += newNodeLength
      _node.location.end += newNodeLength
    })
    inBetweenNodes.forEach((_node) => {
      _node.location.end += newNodeLength
    })
    node.location.start = startIndex
    node.location.end = startIndex + newNodeLength

    //Only insert the node if it is not inside of an already inserted node
    if (
      Array.from(this.insertNodes).find(
        (n) =>
          n.location.start <= node.location.start &&
          n.location.end >= node.location.end,
      )
    )
      return
    this.insertNodes.add(node)
  }

  public createNodeAndPath<T extends t.Node>(
    name: string,
    node: T,
    parentPath: NodePath,
  ): Node<T> {
    const path = new NodePath<T>(parentPath.hub, parentPath.node)
    path.node = node
    path.node.loc = parentPath.node.loc

    return this.createNode<T>(name, path)
  }

  public getCode() {
    return this.code
  }

  public pushMappedDependency(id: ArrayProperty) {
    this.mappedDependencyStack.push(id)
  }

  public popMappedDependency() {
    return this.mappedDependencyStack.pop()
  }

  public getFileUpdates(): FileUpdateInfo {
    const codeUpdates = [
      ...Array.from(this.dirtyNodes.values()).map((node) => ({
        node,
        location: node.location,
        inserted: false,
      })),
      ...Array.from(this.insertNodes.values()).map((node) => ({
        node,
        location: node.location,
        inserted: true,
      })),
    ].sort((a, b) => a.location.start - b.location.start)
    const commitChanges: FileUpdateInfo = {}
    for (const update of codeUpdates) {
      let change = commitChanges[update.location.file] as
        | FileUpdateInfo[string]
        | undefined
      if (!change) {
        change = { filePath: update.location.file, locations: [] }
        commitChanges[update.location.file] = change
      }
      const snippet = getSnippetFromNode(update.node.node)
      const updatedTo = update.location.start + snippet.length

      const newLocation = {
        snippet,
        start: update.location.start,
        end: update.location.end,
        updatedTo,
        diff: 0,
        insertedDiff: 0,
        inserted: update.inserted,
      }
      if (update.inserted) {
        newLocation.end = update.location.start
        newLocation.updatedTo = update.location.start
      }
      const last = change.locations[change.locations.length - 1] as
        | typeof newLocation
        | undefined
      if (last) {
        const diff = last.updatedTo - last.end + last.diff
        const insertedDiff = last.inserted
          ? last.insertedDiff + last.snippet.length
          : last.insertedDiff
        if (last.updatedTo > newLocation.start + diff) {
          if (last.snippet === newLocation.snippet) continue
          //throw new Error("Conflict in changes")
          console.log(`Conflict?: ${last.end}, ${newLocation.start + diff}`)
        }

        newLocation.start += diff
        newLocation.end += diff
        newLocation.updatedTo += diff
        newLocation.diff = diff
        newLocation.insertedDiff = insertedDiff
      }

      change.locations.push(newLocation)
    }
    Object.values(commitChanges).forEach((change) => {
      change.locations.forEach((location) => {
        location.diff += (
          location as unknown as { insertedDiff: number }
        ).insertedDiff
      })
    })

    return commitChanges
  }
}

export function getGraph(file: string, code: string, _graph?: FlowGraph) {
  // Initialize the flow graph
  const graph = _graph ?? new FlowGraph()
  graph.addProject(file, code)

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

      const currentElements: JSXElementNode[] = []

      path.traverse({
        JSXElement: {
          enter(jsxPath) {
            const name = t.isJSXIdentifier(jsxPath.node.openingElement.name)
              ? jsxPath.node.openingElement.name.name
              : getSnippetFromNode(jsxPath.node.openingElement.name)
            const definitionComponent = graph.getDefinition(name)

            const openingElement = graph.createNode(
              getSnippetFromNode(jsxPath.node.openingElement),
              jsxPath.get('openingElement'),
            )
            if (graph.nodes.get(openingElement.id)) return

            const closingElement = jsxPath.node.closingElement
              ? graph.createNode(
                  getSnippetFromNode(jsxPath.node.closingElement),
                  jsxPath.get('closingElement'),
                )
              : undefined

            const elementNode = new JSXElementNode(
              [],
              containingComponent,
              definitionComponent,
              openingElement,
              closingElement,
              graph.createNode(name, jsxPath),
            )

            const parentElement = currentElements[currentElements.length - 1]
            graph.addJSXElement(elementNode, parentElement, containingComponent)
            currentElements.push(elementNode)

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
          },
          exit() {
            currentElements.pop()
          },
        },
      })
    },
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee)) {
        const calleeName = path.node.callee.name
        const callNode = graph.addNode(calleeName, path)

        const definitionNode = graph.getDefinition(calleeName)

        if (definitionNode) {
          graph.addDataDependency(callNode.id, definitionNode.id)
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
