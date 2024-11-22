import type { Binding, NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { getSnippetFromNode } from '../publish/code-updator'
import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isObjectPattern,
  isTemplateLiteral,
  isVariableDeclarator,
} from './node-predicates'
import type { FlowGraph } from './graph'
import type { Node } from './types'
import { createNode, getLocationId } from './utils'
import { MemberExpressionNode } from './nodes/member-expression'
import { ObjectExpressionNode } from './nodes/object-expression'
import { ObjectPatternNode } from './nodes/object-pattern'

export type AddEdge<T extends t.Node> = (
  node: Node<T>,
  graph: FlowGraph,
) => string[]

export const addDataEdge = (node: Node, graph: FlowGraph) => {
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
  } else if (isMemberExpression(node)) {
    return addMemberExpressionEdge(node, graph)
  } else if (isObjectExpression(node)) {
    return addObjectExpressionEdge(node, graph)
  } else if (isVariableDeclarator(node)) {
    return addVariableDeclaratorEdge(node, graph)
  }

  graph.setNode(node)
  return []
}
const addCallExpressionEdge: AddEdge<t.CallExpression> = (node, graph) => {
  graph.setNode(node)
  return node.node.arguments.map((argument, i) => {
    const argPath = node.path.get(`arguments.${i}`) as NodePath
    const newNode = createNode(getSnippetFromNode(argument), argPath, '')

    addDataEdge(newNode, graph)

    return newNode.id
  })
}

const addIdentifierEdge: AddEdge<t.Identifier> = (node, graph) => {
  graph.setNode(node)
  let scope = node.path.scope.bindings[node.node.name] as Binding | undefined
  scope =
    scope ??
    (node.path.scope.parent.bindings[node.node.name] as Binding | undefined)
  if (!scope) {
    throw new Error('Invalid scope')
  }

  const identifier = scope.identifier
  const identifierId = getLocationId(identifier)

  //If we are currently already visiting this node, just return
  if (node.id === identifierId) return []

  const referencePath = scope.path
  const newNode = createNode(
    getSnippetFromNode(referencePath.node),
    referencePath,
    '',
  )
  addDataEdge(newNode, graph)

  const identifierNode = graph.nodes.get(getLocationId(identifier))
  if (!identifierNode) {
    throw new Error('Identifier node not found')
  }

  return [identifierNode.id]
}

const addVariableDeclaratorEdge: AddEdge<t.VariableDeclarator> = (
  node,
  graph,
) => {
  graph.setNode(node)
  const initPath = node.path.get('init') as NodePath
  const id = node.path.get('id') as NodePath
  const idNode = createNode(getSnippetFromNode(node.node.id), id, '')
  addDataEdge(idNode, graph)

  const initNode = createNode(
    node.node.init ? getSnippetFromNode(node.node.init) : 'undefined',
    initPath,
    '',
  )
  addDataEdge(initNode, graph)
  graph.addDependency(idNode.id, initNode.id)
  return [idNode.id]
}

const addObjectPatternEdge: AddEdge<t.ObjectPattern> = (node, graph) => {
  graph.setNode(node)
  for (let i = 0; i < node.node.properties.length; i++) {
    const property = node.node.properties[i]
    if (t.isObjectProperty(property)) {
      const keyPath = node.path.get(`properties.${i}.key`) as NodePath
      const newKey = createNode(getSnippetFromNode(property.key), keyPath, '')

      const valuePath = node.path.get(`properties.${i}.value`) as NodePath
      const newValue = createNode(
        getSnippetFromNode(property.value),
        valuePath,
        '',
      )

      const propertypath = node.path.get(
        `properties.${i}`,
      ) as NodePath<t.ObjectPattern>
      const newNode = new ObjectPatternNode(
        newKey,
        createNode(getSnippetFromNode(propertypath.node), propertypath, ''),
      )
      graph.setNode(newNode)
      addDataEdge(newKey, graph)
      addDataEdge(newValue, graph)

      graph.addDependency(newNode.id, node.id)
      if (newValue.id !== newNode.id) {
        graph.addDependency(newValue.id, newNode.id)
      }
    }
  }
  return []
}

const addTemplateLiteralEdge: AddEdge<t.TemplateLiteral> = (node, graph) => {
  graph.setNode(node)
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

const addMemberExpressionEdge: AddEdge<t.MemberExpression> = (node, graph) => {
  const objectPath = node.path.get('object') as NodePath
  const objectNode = createNode(
    getSnippetFromNode(node.node.object),
    objectPath,
    '',
  )
  addDataEdge(objectNode, graph)

  const propertyPath = node.path.get('property') as NodePath
  const propertyNode = createNode(
    getSnippetFromNode(node.node.property),
    propertyPath,
    '',
  )
  //Only trace the data flow of computed properties
  if (node.node.computed) {
    addDataEdge(propertyNode, graph)
  } else {
    graph.setNode(propertyNode)
  }
  const memberExpressionNode = new MemberExpressionNode(propertyNode, node)
  graph.setNode(memberExpressionNode)

  return [objectNode.id]
}

const addObjectExpressionEdge: AddEdge<t.ObjectExpression> = (node, graph) => {
  const properties = node.node.properties.map((property, i) => {
    if (t.isObjectProperty(property)) {
      const keyPath = node.path.get(`properties.${i}.key`) as NodePath
      const keyNode = createNode(getSnippetFromNode(keyPath.node), keyPath, '')
      graph.setNode(keyNode)
      const valuePath = node.path.get(`properties.${i}.value`) as NodePath
      const valueNode = createNode(
        getSnippetFromNode(valuePath.node),
        valuePath,
        '',
      )
      if (valueNode.id !== keyNode.id) {
        addDataEdge(valueNode, graph)
        graph.addDependency(keyNode.id, valueNode.id)
      } else {
        addDataEdge(keyNode, graph)
      }

      return keyNode
    }

    const path = node.path.get(`properties.${i}`) as NodePath
    const newNode = createNode(getSnippetFromNode(path.node), path, '')
    addDataEdge(newNode, graph)

    return newNode
  })
  const objectExpression = new ObjectExpressionNode(properties, node)
  graph.setNode(objectExpression)

  return properties.map((property) => property.id)
}
