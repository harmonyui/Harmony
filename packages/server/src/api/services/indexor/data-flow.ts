import type { Binding, NodePath, Scope } from '@babel/traverse'
import * as t from '@babel/types'
import type { FlowGraph } from './graph'
import type { Node, ObjectProperty } from './types'
import { getComponentName, getLocationId, getSnippetFromNode } from './utils'
import { MemberExpressionNode } from './nodes/member-expression'
import { ObjectExpressionNode } from './nodes/object-expression'
import { RestElementNode } from './nodes/rest-element'
import {
  ObjectPropertyExpressionNode,
  ObjectPropertyNode,
} from './nodes/object-property'
import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isObjectPattern,
  isTemplateLiteral,
  isVariableDeclarator,
  isExpression,
  isFunctionExpression,
  isArrowFunctionExpression,
  isArrayPattern,
  isArrayExpression,
  isNumericLiteral,
  isJSXIdentifier,
  isImportSpecifier,
  isFunctionDeclaration,
  isVariableDeclaration,
} from './predicates/simple-predicates'
import { ArrayPropertyNode } from './nodes/array-property'
import { ArrayExpression } from './nodes/array-expression'
import { ImportStatement } from './nodes/import-statement'
import { JSXElementNode } from './nodes/jsx-element'
import { JSXAttributeNode } from './nodes/jsx-attribute'
import { JSXSpreadAttributeNode } from './nodes/jsxspread-attribute'

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
  if (isFunctionDeclaration(node)) {
    visitor.FunctionDeclaration(node)
  } else if (isArrowFunctionExpression(node)) {
    visitor.ArrowFunctionExpression(node)
  } else if (isMappedExpression(node)) {
    edges.push(...addMappedExpressionEdge(node, graph))
  } else if (isIdentifier(node)) {
    visitor.Identifier(node)
  } else if (isJSXIdentifier(node)) {
    visitor.JSXIdentifier(node)
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
  } else if (isVariableDeclaration(node)) {
    visitor.VariableDeclaration(node)
  } else if (isVariableDeclarator(node)) {
    visitor.VariableDeclarator(node)
  } else if (isArrayPattern(node)) {
    visitor.ArrayPattern(node)
  } else if (isArrayExpression(node)) {
    visitor.ArrayExpression(node)
  } else if (isImportSpecifier(node)) {
    visitor.ImportSpecifier(node)
  } else if (
    isExpression(node) &&
    !isFunctionExpression(node) &&
    !isArrowFunctionExpression(node)
  ) {
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
  ): path is Node<T> => 'dataDependencies' in path
  const nodeOrCreate = <T extends t.Node>(
    path: NodePath<T> | Node<T>,
  ): Node<T> => {
    if (isNode(path)) {
      return path
    }
    return graph.createNode(getSnippetFromNode(path.node), path)
  }
  return {
    ArrowFunctionExpression(
      path:
        | NodePath<t.ArrowFunctionExpression>
        | Node<t.ArrowFunctionExpression>,
    ) {
      const newNode = nodeOrCreate(path)
      addFunctionEdge(newNode, graph)
    },
    FunctionDeclaration(
      path: NodePath<t.FunctionDeclaration> | Node<t.FunctionDeclaration>,
    ) {
      const newNode = nodeOrCreate(path)
      addFunctionEdge(newNode, graph)
    },
    CallExpression(path: NodePath<t.CallExpression> | Node<t.CallExpression>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addCallExpressionEdge(newNode, graph))
    },
    Identifier(path: NodePath<t.Identifier> | Node<t.Identifier>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addIdentifierEdge(newNode, graph))
    },
    JSXIdentifier(path: NodePath<t.JSXIdentifier> | Node<t.JSXIdentifier>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addJSXIdentifier(newNode, graph))
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
    VariableDeclaration(
      path: NodePath<t.VariableDeclaration> | Node<t.VariableDeclaration>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addVariableDeclarationEdge(newNode, graph))
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
    ArrayPattern(path: NodePath<t.ArrayPattern> | Node<t.ArrayPattern>) {
      const newNode = nodeOrCreate(path)
      edges.push(...addArrayPatternEdge(newNode, graph))
    },
    ArrayExpression(
      path: NodePath<t.ArrayExpression> | Node<t.ArrayExpression>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addArrayExpressionEdge(newNode, graph))
    },
    ImportSpecifier(
      path: NodePath<t.ImportSpecifier> | Node<t.ImportSpecifier>,
    ) {
      const newNode = nodeOrCreate(path)
      edges.push(...addImportSpecifier(newNode, graph))
    },
  }
}

const addFunctionEdge: AddEdge<t.Function> = (node, graph) => {
  const path = node.path
  const functionName = getComponentName(path)
  if (!functionName || graph.nodes.get(node.id)) return []

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
        const name = getSnippetFromNode(jsxPath.node.openingElement.name)

        const openingElement = graph.createNode(
          getSnippetFromNode(jsxPath.node.openingElement),
          jsxPath.get('openingElement'),
        )
        if (graph.nodes.get(openingElement.id)) return

        const closingElement = jsxPath.node.closingElement
          ? graph.createNode(
              getSnippetFromNode(jsxPath.node.closingElement),
              jsxPath.get('closingElement') as NodePath<t.JSXClosingElement>,
            )
          : undefined

        const nameNode = graph.createNode(
          name,
          jsxPath.get('openingElement.name') as NodePath,
        )

        const elementNode = new JSXElementNode(
          [],
          containingComponent,
          openingElement,
          closingElement,
          nameNode,
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
          const _node = jsxPath.node.children[i]
          if (t.isJSXText(_node) && _node.value.trim().length === 0) continue

          const childPath = jsxPath.get(`children.${i}`)
          if (Array.isArray(childPath)) throw new Error('Should not be array')

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
      },
      exit() {
        currentElements.pop()
      },
    },
  })

  return []
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
  const scope = node.path.scope.bindings[node.node.name] as Binding | undefined

  if (!scope) {
    return []
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
    //console.error(`Identifier ${identifierId} not found`)
    return []
  }

  return [identifierNode.id]
}

const addJSXIdentifier: AddEdge<t.JSXIdentifier> = (node, graph) => {
  graph.setNode(node)
  let scope: Scope = node.path.scope
  //Assume for now that the jsx definition is at the top level
  while ((scope.parent as Scope | undefined) !== undefined) {
    scope = scope.parent
  }

  const binding = scope.bindings[node.node.name] as Binding | undefined
  if (!binding) {
    return []
  }

  const identifier = binding.identifier
  const identifierId = getLocationId(identifier, graph.file, graph.code)

  //If we are currently already visiting this node, just return
  if (node.id === identifierId) return []

  const referencePath = binding.path
  const newNode = graph.createNode(
    getSnippetFromNode(referencePath.node),
    referencePath,
  )
  addDataEdge(newNode, graph)

  const identifierNode = graph.nodes.get(identifierId)
  if (!identifierNode) {
    //console.error(`Identifier ${identifierId} not found`)
    return []
  }

  return [identifierNode.id]
}

const addVariableDeclarationEdge: AddEdge<t.VariableDeclaration> = (
  node,
  graph,
) => {
  graph.setNode(node)
  return node.node.declarations.map((declaration, i) => {
    const declarationPath = node.path.get(`declarations.${i}`) as NodePath
    const newNode = graph.createNode(
      getSnippetFromNode(declaration),
      declarationPath,
    )
    addDataEdge(newNode, graph)

    return newNode.id
  })
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
  if (isNumericLiteral(propertyNode)) {
    const arrayProperty = new ArrayPropertyNode(
      propertyNode.node.value,
      graph.createNode(getSnippetFromNode(node.node), node.path),
    )
    graph.setNode(arrayProperty)
  } else {
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
  }

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
        let newNode: ObjectPropertyExpressionNode
        //If the key and the value are different, we want to trace those data edges first, then
        //create the node to ensure that the key and values are the correct types
        if (newKey.id !== newValue.id) {
          if (property.computed) {
            addDataEdge(newKey, graph)
          }
          addDataEdge(newValue, graph)
          newKey = graph.nodes.get(newKey.id) ?? newKey
          newValue = graph.nodes.get(newValue.id) ?? newValue
          newNode = new ObjectPropertyExpressionNode(
            newKey,
            newValue,
            graph.createNode(
              getSnippetFromNode(propertypath.node),
              propertypath,
            ),
          )
          graph.setNode(newNode)
        } else {
          newNode = new ObjectPropertyExpressionNode(
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
        graph.addDataDependency(restNode.id, argument.id)
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

const addArrayPatternEdge: AddEdge<t.ArrayPattern> = (node, graph) => {
  const currElements: ArrayPropertyNode[] = []
  graph.setNode(node)
  for (let i = 0; i < node.node.elements.length; i++) {
    const element = node.node.elements[i]
    if (t.isRestElement(element)) {
      // const restPath = node.path.get(`elements.${i}`) as NodePath<t.RestElement>
      // const restNode = new RestElementNode(
      //   currElements,
      //   graph.code,
      //   graph.createNode(getSnippetFromNode(element.argument), restPath),
      // )
      // graph.setNode(restNode)
      // const argument = restNode.getArgument()
      // addDataEdge(argument, graph)
      // graph.addDataDependency(restNode.id, node.id)
      // graph.addDataDependency(argument.id, restNode.id)
      // if (!graph.nodes.has(argument.id)) {
      //   throw new Error('Argument node not found')
      // }
      // restNode.setArgument(graph.nodes.get(argument.id) ?? argument)
    } else {
      const elementPath = node.path.get(`elements.${i}`) as NodePath
      const newElement = new ArrayPropertyNode(
        i,
        graph.createNode(getSnippetFromNode(elementPath.node), elementPath),
      )
      addDataEdge(newElement, graph)
      graph.addDataDependency(newElement.id, node.id)

      currElements.push(newElement)
    }
  }

  return []
}

const addArrayExpressionEdge: AddEdge<t.ArrayExpression> = (node, graph) => {
  const elements: Node[] = []
  node.node.elements.forEach((element, i) => {
    if (t.isExpression(element)) {
      const elementPath = node.path.get(`elements.${i}`) as NodePath
      const newElement = graph.createNode(
        getSnippetFromNode(element),
        elementPath,
      )
      addDataEdge(newElement, graph)
      elements.push(graph.nodes.get(newElement.id) ?? newElement)
    }
  })
  const arrayExpression = new ArrayExpression(elements, node)
  graph.setNode(arrayExpression)

  return []
}

const addImportSpecifier: AddEdge<t.ImportSpecifier> = (node, graph) => {
  const parentNode = node.path.parent as t.ImportDeclaration
  const newNode = new ImportStatement(
    parentNode.source.value,
    graph.createNode(getSnippetFromNode(node.node), node.path),
  )
  graph.setNode(newNode)
  return []
}

const addMappedExpressionEdge: AddEdge<t.Node> = (node, graph) => {
  if (!isMappedExpression(node)) throw new Error('Must be a mapped expression')

  const memberExpressionPath = (
    node.path.parentPath?.parentPath as NodePath<t.CallExpression>
  ).get('callee') as NodePath<t.MemberExpression>

  const arrayPropertyNode = new ArrayPropertyNode(
    undefined,
    graph.createNode(getSnippetFromNode(node.node), node.path),
  )
  graph.setNode(arrayPropertyNode)
  graph.pushMappedDependency(
    graph.nodes.get(arrayPropertyNode.id) as ArrayPropertyNode,
  )

  const objectPath = memberExpressionPath.get('object') as NodePath
  const objectNode = graph.createNode(
    getSnippetFromNode(objectPath.node),
    objectPath,
  )
  addDataEdge(objectNode, graph)

  return [objectNode.id]
}

const isMappedExpression = (node: Node) =>
  (t.isFunctionExpression(node.path.parent) ||
    t.isArrowFunctionExpression(node.path.parent)) &&
  t.isCallExpression(node.path.parentPath?.parent) &&
  t.isMemberExpression(
    (node.path.parentPath.parentPath as NodePath<t.CallExpression>).node.callee,
  ) &&
  t.isIdentifier(
    (
      (node.path.parentPath.parentPath as NodePath<t.CallExpression>).node
        .callee as t.MemberExpression
    ).property,
  ) &&
  (
    (
      (node.path.parentPath.parentPath as NodePath<t.CallExpression>).node
        .callee as t.MemberExpression
    ).property as t.Identifier
  ).name === 'map'
