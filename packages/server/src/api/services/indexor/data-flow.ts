import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { getSnippetFromNode } from '../publish/code-updator'
import { createNode, getLocationId } from './utils'
import type { FlowGraph } from './graph'
import type { Node } from './types'
import {
  ComponentNode,
  ObjectPropertyNode,
  PropertyNode,
  UndefinedNode,
} from './node'

export type AddEdge<T extends t.Node> = (
  node: Node<T>,
  graph: FlowGraph,
) => string[]

const isIdentifier = (node: Node): node is Node<t.Identifier> =>
  t.isIdentifier(node.node)
const isCallExpression = (node: Node): node is Node<t.CallExpression> =>
  t.isCallExpression(node.node)
const isObjectPattern = (node: Node): node is Node<t.ObjectPattern> =>
  t.isObjectPattern(node.node)
const isFunctionDeclaration = (
  node: Node,
): node is Node<t.FunctionDeclaration> => t.isFunctionDeclaration(node.node)
const isArrowFunctionExpression = (
  node: Node,
): node is Node<t.ArrowFunctionExpression> =>
  t.isArrowFunctionExpression(node.node)
const isFunction = (node: Node): node is ComponentNode =>
  node instanceof ComponentNode
const isVariableDeclarator = (node: Node): node is Node<t.VariableDeclarator> =>
  t.isVariableDeclarator(node.node)
const isTemplateLiteral = (node: Node): node is Node<t.TemplateLiteral> =>
  t.isTemplateLiteral(node.node)

export const addDataEdge = (node: Node, graph: FlowGraph) => {
  graph.nodes.set(node.id, node)
  const edges = addEdge(node, graph)
  edges.forEach((edge) => graph.addDependency(node.id, edge))
}
const addEdge: AddEdge<t.Node> = (node, graph) => {
  if (isIdentifier(node)) {
    return addIdentifierEdge(node, graph)
  } else if (isCallExpression(node)) {
    return addCallExpressionEdge(node, graph)
  } else if (isObjectPattern(node)) {
    return addObjectPatternEdge(node, graph)
  } else if (isTemplateLiteral(node)) {
    return addTemplateLiteralEdge(node, graph)
  }

  return []
}
const addCallExpressionEdge: AddEdge<t.CallExpression> = (node, graph) => {
  return node.node.arguments.map((argument, i) => {
    const argPath = node.path.get(`arguments.${i}`) as NodePath
    const newNode = createNode(getSnippetFromNode(argument), argPath, '')

    addDataEdge(newNode, graph)

    return newNode.id
  })
}

const addEdgeToAssignment = (
  node: Node,
  contextNode: Node<t.Identifier>,
  graph: FlowGraph,
) => {
  graph.nodes.set(node.id, node)
  if (isIdentifier(node)) {
    return node.id
  } else if (isObjectPattern(node)) {
    const propertyIndex = node.node.properties.findIndex(
      (property) =>
        t.isObjectProperty(property) &&
        t.isIdentifier(property.value) &&
        property.value.name === contextNode.node.name,
    )
    const propertyPath = node.path.get(
      `properties.${propertyIndex}.key`,
    ) as NodePath
    const newPropertyNode = new ObjectPropertyNode(
      createNode(contextNode.name, propertyPath, ''),
    )
    graph.nodes.set(newPropertyNode.id, newPropertyNode)
    graph.addDependency(newPropertyNode.id, node.id)
    return newPropertyNode.id
  }

  throw new Error('Cannot deconstruct assignment')
}
const addIdentifierEdge: AddEdge<t.Identifier> = (node, graph) => {
  const referencePath = node.path.scope.bindings[node.node.name].path
  const newNode = createNode(
    getSnippetFromNode(referencePath.node),
    referencePath,
    '',
  )
  if (isObjectPattern(newNode)) {
    return [addEdgeToAssignment(newNode, node, graph)]
  } else if (isVariableDeclarator(newNode)) {
    const initPath = newNode.path.get('init') as NodePath
    const id = newNode.path.get('id') as NodePath
    const idNode = createNode(getSnippetFromNode(newNode.node.id), id, '')
    const assignment = addEdgeToAssignment(idNode, node, graph)

    const initNode = createNode(
      newNode.node.init ? getSnippetFromNode(newNode.node.init) : 'undefined',
      initPath,
      '',
    )
    addDataEdge(initNode, graph)
    graph.addDependency(idNode.id, initNode.id)
    return [assignment]
  }

  return [newNode.id]
}

const addObjectPatternEdge: AddEdge<t.ObjectPattern> = (node, graph) => {
  for (let i = 0; i < node.node.properties.length; i++) {
    const property = node.node.properties[i]
    if (
      t.isObjectProperty(property) &&
      t.isIdentifier(property.key) &&
      t.isIdentifier(property.value)
    ) {
      const propertyPath = node.path.get(`properties.${i}.value`) as NodePath
      const newNode = createNode(
        getSnippetFromNode(property.value),
        propertyPath,
        '',
      )

      addDataEdge(newNode, graph)
    }
  }
  connectToParent(node, graph)
  return []
}

const addTemplateLiteralEdge: AddEdge<t.TemplateLiteral> = (node, graph) => {
  return [
    ...node.node.expressions.map(
      (_, i) => node.path.get(`expressions.${i}`) as NodePath<t.Expression>,
    ),
    // Filter out empty quasis. Should we do this?
    ...node.node.quasis
      .filter((q) => q.value.raw)
      .map(
        (_, i) => node.path.get(`quasis.${i}`) as NodePath<t.TemplateElement>,
      ),
  ]
    .sort(
      (a, b) => (a.node.loc?.start.index || 0) - (b.node.loc?.start.index || 0),
    )
    .map((path) => {
      const name =
        path.type === 'TemplateElement'
          ? path.node.value.raw
          : getSnippetFromNode(path.node)
      const newNode = createNode<t.Expression | t.TemplateElement>(
        name,
        path,
        '',
      )
      addDataEdge(newNode, graph)

      return newNode.id
    })
}

const connectToParent = (node: Node, graph: FlowGraph) => {
  const parent = node.path.parent
  const parentNode = graph.nodes.get(getLocationId(parent))
  //If node is an argument
  if (parentNode && isFunction(parentNode)) {
    const argumentNode = parentNode
      .getArguments()
      .find((arg) => arg.id === node.id)
    if (!argumentNode) throw new Error(`Cannot find argument node ${node.name}`)
    graph.addDependency(node.id, argumentNode.id)
  } else {
    throw new Error('Parent not found')
  }
}
