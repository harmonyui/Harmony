import type { Binding, NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import type { FlowGraph } from './graph'
import type { Node, ObjectProperty } from './types'
import { getLocationId, getSnippetFromNode } from './utils'
import { MemberExpressionNode } from './nodes/member-expression'
import { ObjectExpressionNode } from './nodes/object-expression'
import { RestElementNode } from './nodes/rest-element'
import { ObjectPropertyNode } from './nodes/object-property'
import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isObjectPattern,
  isTemplateLiteral,
  isVariableDeclarator,
  isExpression,
} from './predicates/simple-predicates'

export type AddEdge<T extends t.Node> = (
  node: Node<T>,
  graph: FlowGraph,
) => string[]

export const addDataEdge = (node: Node, graph: FlowGraph) => {
  const edges = addEdge(node, graph)
  edges.forEach((edge) => graph.addDataDependency(node.id, edge))
}
const addEdge: AddEdge<t.Node> = (node, graph) => {
  const edges: string[] = []
  const visitor = createVisitor(graph, edges)
  if (isIdentifier(node)) {
    visitor.Identifier(node)
  } else if (isCallExpression(node)) {
    visitor.CallExpression(node)
  } else if (isObjectPattern(node)) {
    visitor.ObjectPattern(node)
  } else if (isTemplateLiteral(node)) {
    visitor.TemplateLiteral(node)
  } else if (isMemberExpression(node)) {
    visitor.MemberExpression(node)
  } else if (isObjectExpression(node)) {
    visitor.ObjectExpression(node)
  } else if (isVariableDeclarator(node)) {
    visitor.VariableDeclarator(node)
  } else if (isExpression(node)) {
    graph.setNode(node)
    node.path.traverse(visitor)
  } else {
    graph.setNode(node)
  }
  return edges
}

const createVisitor = (graph: FlowGraph, edges: string[]) => {
  const isNode = <T extends t.Node>(
    path: NodePath<T> | Node<T>,
  ): path is Node<T> => 'dependencies' in path
  const nodeOrCreate = <T extends t.Node>(
    path: NodePath<T> | Node<T>,
  ): Node<T> => {
    if (isNode(path)) {
      return path
    }
    return graph.createNode(getSnippetFromNode(path.node), path)
  }
  return {
    CallExpression(path: NodePath<t.CallExpression> | Node<t.CallExpression>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addCallExpressionEdge(newNode, graph))
    },
    Identifier(path: NodePath<t.Identifier> | Node<t.Identifier>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addIdentifierEdge(newNode, graph))
    },
    MemberExpression(
      path: NodePath<t.MemberExpression> | Node<t.MemberExpression>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addMemberExpressionEdge(newNode, graph))
    },
    ObjectExpression(
      path: NodePath<t.ObjectExpression> | Node<t.ObjectExpression>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addObjectExpressionEdge(newNode, graph))
    },
    ObjectPattern(path: NodePath<t.ObjectPattern> | Node<t.ObjectPattern>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addObjectPatternEdge(newNode, graph))
    },
    TemplateLiteral(
      path: NodePath<t.TemplateLiteral> | Node<t.TemplateLiteral>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addTemplateLiteralEdge(newNode, graph))
    },
    VariableDeclarator(
      path: NodePath<t.VariableDeclarator> | Node<t.VariableDeclarator>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addVariableDeclaratorEdge(newNode, graph))
    },
    StringLiteral(path: NodePath<t.StringLiteral> | Node<t.StringLiteral>) {
      const newNode = nodeOrCreate(path)
      graph.setNode(newNode)
      edges.push(newNode.id)
    },
  }
}
const addCallExpressionEdge: AddEdge<t.CallExpression> = (node, graph) => {
  graph.setNode(node)
  return node.node.arguments.map((argument, i) => {
    const argPath = node.path.get(`arguments.${i}`) as NodePath
    const newNode = graph.createNode(getSnippetFromNode(argument), argPath)

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
  const identifierId = getLocationId(identifier, graph.file, graph.code)

  //If we are currently already visiting this node, just return
  if (node.id === identifierId) return []

  const referencePath = scope.path
  const newNode = graph.createNode(
    getSnippetFromNode(referencePath.node),
    referencePath,
  )
  addDataEdge(newNode, graph)

  const identifierNode = graph.nodes.get(identifierId)
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
  const idNode = graph.createNode(getSnippetFromNode(node.node.id), id)
  addDataEdge(idNode, graph)

  const initNode = graph.createNode(
    node.node.init ? getSnippetFromNode(node.node.init) : 'undefined',
    initPath,
  )
  addDataEdge(initNode, graph)
  graph.addDataDependency(idNode.id, initNode.id)
  return [idNode.id]
}

const addObjectPatternEdge: AddEdge<t.ObjectPattern> = (node, graph) => {
  graph.setNode(node)
  const currProperties: ObjectPropertyNode[] = []
  for (let i = 0; i < node.node.properties.length; i++) {
    const property = node.node.properties[i]
    if (t.isObjectProperty(property)) {
      const keyPath = node.path.get(`properties.${i}.key`) as NodePath
      let newKey = graph.createNode(getSnippetFromNode(property.key), keyPath)

      const valuePath = node.path.get(`properties.${i}.value`) as NodePath
      let newValue = graph.createNode(
        getSnippetFromNode(property.value),
        valuePath,
      )

      const propertypath = node.path.get(
        `properties.${i}`,
      ) as NodePath<t.ObjectProperty>
      let newNode: ObjectPropertyNode
      //If the key and the value are different, we want to trace those data edges first, then
      //create the node to ensure that the key and values are the correct types
      if (newKey.id !== newValue.id) {
        if (property.computed) {
          addDataEdge(newKey, graph)
        }
        addDataEdge(newValue, graph)
        newKey = graph.nodes.get(newKey.id) ?? newKey
        newValue = graph.nodes.get(newValue.id) ?? newValue
        newNode = new ObjectPropertyNode(
          newKey,
          newValue,
          graph.createNode(getSnippetFromNode(propertypath.node), propertypath),
        )
        graph.setNode(newNode)
      } else {
        newNode = new ObjectPropertyNode(
          newKey,
          newValue,
          graph.createNode(getSnippetFromNode(propertypath.node), propertypath),
        )
        addDataEdge(newNode, graph)
      }

      graph.addDataDependency(newNode.id, node.id)
      if (newValue.id !== newNode.id) {
        graph.addDataDependency(newValue.id, newNode.id)
      }
      currProperties.push(newNode)
      //Rest element -- assume that it is last
    } else {
      const restPath = node.path.get(
        `properties.${i}`,
      ) as NodePath<t.RestElement>
      const restNode = new RestElementNode(
        currProperties,
        graph.code,
        graph.createNode(getSnippetFromNode(property.argument), restPath),
      )
      graph.setNode(restNode)
      const argument = restNode.getArgument()
      addDataEdge(argument, graph)
      graph.addDataDependency(restNode.id, node.id)
      graph.addDataDependency(argument.id, restNode.id)
      if (!graph.nodes.has(argument.id)) {
        throw new Error('Argument node not found')
      }
      restNode.setArgument(graph.nodes.get(argument.id) ?? argument)
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
      .map((q, i) =>
        q.value.raw.length > 0
          ? (node.path.get(`quasis.${i}`) as NodePath<t.TemplateElement>)
          : undefined,
      )
      .filter((q) => q !== undefined),
  ]
    .sort(
      (a, b) => (a.node.loc?.start.index || 0) - (b.node.loc?.start.index || 0),
    )
    .map((path) => {
      const name =
        path.type === 'TemplateElement'
          ? path.node.value.raw
          : getSnippetFromNode(path.node)
      const newNode = graph.createNode<t.Expression | t.TemplateElement>(
        name,
        path,
      )
      addDataEdge(newNode, graph)

      return newNode.id
    })
}

const addMemberExpressionEdge: AddEdge<t.MemberExpression> = (node, graph) => {
  const objectPath = node.path.get('object') as NodePath
  const objectNode = graph.createNode(
    getSnippetFromNode(node.node.object),
    objectPath,
  )
  addDataEdge(objectNode, graph)

  const propertyPath = node.path.get('property') as NodePath
  const propertyNode = graph.createNode(
    getSnippetFromNode(node.node.property),
    propertyPath,
  )
  //Only trace the data flow of computed properties
  if (node.node.computed) {
    addDataEdge(propertyNode, graph)
  } else {
    graph.setNode(propertyNode)
  }
  const memberExpressionNode = new MemberExpressionNode(
    propertyNode,
    propertyNode,
    node,
  )
  graph.setNode(memberExpressionNode)

  return [objectNode.id]
}

const addObjectExpressionEdge: AddEdge<t.ObjectExpression> = (node, graph) => {
  const currProperties: ObjectProperty[] = []
  const properties = node.node.properties
    .map((property, i) => {
      if (t.isObjectProperty(property)) {
        const keyPath = node.path.get(`properties.${i}.key`) as NodePath
        let newKey = graph.createNode(getSnippetFromNode(property.key), keyPath)

        const valuePath = node.path.get(`properties.${i}.value`) as NodePath
        let newValue = graph.createNode(
          getSnippetFromNode(property.value),
          valuePath,
        )

        const propertypath = node.path.get(
          `properties.${i}`,
        ) as NodePath<t.ObjectProperty>
        let newNode: ObjectPropertyNode
        //If the key and the value are different, we want to trace those data edges first, then
        //create the node to ensure that the key and values are the correct types
        if (newKey.id !== newValue.id) {
          if (property.computed) {
            addDataEdge(newKey, graph)
          }
          addDataEdge(newValue, graph)
          newKey = graph.nodes.get(newKey.id) ?? newKey
          newValue = graph.nodes.get(newValue.id) ?? newValue
          newNode = new ObjectPropertyNode(
            newKey,
            newValue,
            graph.createNode(
              getSnippetFromNode(propertypath.node),
              propertypath,
            ),
          )
          graph.setNode(newNode)
        } else {
          newNode = new ObjectPropertyNode(
            newKey,
            newValue,
            graph.createNode(
              getSnippetFromNode(propertypath.node),
              propertypath,
            ),
          )
          // Add data edge for the value, which will add depencies for ObjectPropertyNode
          // Since they are the same id
          addDataEdge(newValue, graph)
        }

        graph.addDataDependency(newNode.id, node.id)
        if (newValue.id !== newNode.id) {
          graph.addDataDependency(newNode.id, newValue.id)
        }
        currProperties.push(newNode)
        return newNode
      } else if (t.isSpreadElement(property)) {
        const restPath = node.path.get(
          `properties.${i}`,
        ) as NodePath<t.RestElement>
        const restNode = new RestElementNode(
          currProperties,
          graph.code,
          graph.createNode(getSnippetFromNode(property.argument), restPath),
        )
        graph.setNode(restNode)
        const argument = restNode.getArgument()
        addDataEdge(argument, graph)
        graph.addDataDependency(restNode.id, node.id)
        graph.addDataDependency(argument.id, restNode.id)
        if (!graph.nodes.has(argument.id)) {
          throw new Error('Argument node not found')
        }
        restNode.setArgument(graph.nodes.get(argument.id) ?? argument)

        return restNode
      }

      // const path = node.path.get(`properties.${i}`) as NodePath
      // const newNode = createNode(getSnippetFromNode(path.node), path, '')
      // addDataEdge(newNode, graph)

      // return newNode

      return undefined
    })
    .filter((property) => property !== undefined)
  const objectExpression = new ObjectExpressionNode(properties, node)
  graph.setNode(objectExpression)

  return properties.map((property) => property.id)
}
