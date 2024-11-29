import * as parser from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import * as prettier from 'prettier'
import type { ArrayProperty, Node } from './types'
import type { LiteralNode } from './utils'
import {
  createNode,
  getComponentName,
  getLocationId,
  getSnippetFromNode,
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
    newContent: string
  }
>
export class FlowGraph {
  public nodes: Map<string, Node>
  public file = ''
  public code = ''
  private mappedDependencyStack: ArrayProperty[] = []
  public idMapping: Record<string, string> = {}
  public files: Record<string, { program: t.Program; content: string }> = {}
  private dirtyFiles: Set<string> = new Set<string>()

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
    jsxElementNode.setParentElement(parentElement)
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

  public dirtyNode(node: Node) {
    this.dirtyFiles.add(node.location.file)
  }

  public replaceNode(node: Node, newNode: t.Node) {
    node.path.replaceWith(newNode)
    this.dirtyNode(node)
  }

  public addLeadingComment(node: Node, comment: string) {
    node.path.addComment('leading', comment)
    this.dirtyNode(node)
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
    node.path.node.openingElement.attributes.push(newNode)
    this.dirtyNode(node)
  }

  public async saveChanges(options: prettier.Options) {
    await Promise.all(
      Array.from(this.dirtyFiles).map(async (file) => {
        const program = this.files[file].program
        this.files[file].content = await this.formatCode(
          getSnippetFromNode(program),
          options,
        )
      }),
    )
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
      childElement.path = parentElement.path.get(
        `children.${parentElement.node.children.length - 1}`,
      ) as NodePath<t.JSXElement>
      let parentClosingElement = parentElement.getClosingElement()
      if (!parentClosingElement) {
        parentClosingElement = this.createNodeAndPath(
          parentElement.name,
          t.jSXClosingElement(t.jSXIdentifier(parentElement.name)),
          parentElement.path,
        )
        parentElement.setClosingElement(parentClosingElement)
        parentClosingElement.id = `${parentElement.id}-closing`
        this.setNode(parentClosingElement)
        this.dirtyNode(parentElement)
      }
      this.dirtyNode(childElement)
    } else {
      beforeElement.path.insertBefore(childElement.node)
      childElement.path =
        beforeElement.path.getPrevSibling() as NodePath<t.JSXElement>
      this.dirtyNode(childElement)
    }
    this.addJSXElement(
      childElement,
      parentElement,
      parentElement.getParentComponent(),
    )
    this.idMapping[`${componentId}-${childIndex}`] = childElement.id

    return childElement
  }

  public deleteElement(jsxElement: JSXElementNode) {
    const parentElement = jsxElement.getParentElement()
    if (parentElement) {
      const parentChildren = parentElement.getChildren()
      const index = parentChildren.indexOf(jsxElement)
      if (index === -1) throw new Error('Cannot find child of element')
      parentChildren.splice(index, 1)
    }

    const parentComponent = jsxElement.getParentComponent()
    const parentComponentChildren = parentComponent.getJSXElements()
    const componentIndex = parentComponentChildren.indexOf(jsxElement)
    if (componentIndex === -1) throw new Error('Cannot find child of element')
    parentComponentChildren.splice(componentIndex, 1)

    const content = getSnippetFromNode(jsxElement.node)
    jsxElement.path.remove()
    this.dirtyNode(jsxElement)

    return content
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

  public async getFileUpdates(
    options: prettier.Options,
  ): Promise<FileUpdateInfo> {
    const changes = await Promise.all(
      Array.from(this.dirtyFiles).map<Promise<[string, string]>>(
        async (file) => {
          const program = this.files[file].program
          const newContent = getSnippetFromNode(program)
          const formatted = await this.formatCode(newContent, options)

          return [file, formatted]
        },
      ),
    )

    return changes.reduce<FileUpdateInfo>((prev, [file, newContent]) => {
      prev[file] = { filePath: file, newContent }
      return prev
    }, {})
  }

  public async formatCode(code: string, options: prettier.Options = {}) {
    return prettier.format(code, {
      ...options,
      parser: 'typescript',
    })
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

  graph.files[file] = { program: ast.program, content: code }

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
                  jsxPath.get(
                    'closingElement',
                  ) as NodePath<t.JSXClosingElement>,
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
