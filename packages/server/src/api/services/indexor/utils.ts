import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import type { ComponentLocation } from '@harmony/util/src/types/component'
import {
  getLineAndColumn,
  hashComponentId,
} from '@harmony/util/src/utils/component'
import generator from '@babel/generator'
import type { Attribute } from './types'
import { Node } from './types'
import { ComponentNode } from './nodes/component'
import type { FlowGraph } from './graph'

export function createNode<T extends t.Node>(
  name: string,
  path: NodePath<T>,
  file: string,
  content: string,
  graph: FlowGraph,
): Node<T> {
  const _node = path.node
  const id = getLocationId(_node, file, content)
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
    dataDependencies: new Set(),
    dataDependents: new Set(),
    path,
    location,
    content: getSnippetFromNode(_node),
    graph,
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
      current.dataDependencies.forEach((depId) => dfs(depId))
    }
  }

  dfs(node)
  return origins
}

export function getComponentName(path: NodePath): t.Node | undefined {
  // Check if the function is assigned to a variable or exported
  if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
    return path.parent.id
  } else if (
    t.isExportDeclaration(path.parent) &&
    path.parent.type !== 'ExportAllDeclaration' &&
    path.parent.declaration &&
    'id' in path.parent.declaration &&
    t.isIdentifier(path.parent.declaration.id)
  ) {
    return path.parent.declaration.id
  } else if (
    t.isFunctionDeclaration(path.node) &&
    t.isIdentifier(path.node.id)
  ) {
    return path.node.id
  } else if (
    t.isCallExpression(path.parent) &&
    t.isVariableDeclarator(path.parentPath?.parent) &&
    t.isIdentifier(path.parentPath.parent.id)
  ) {
    return path.parentPath.parent.id
  }

  return undefined
}

function getLocation(node: t.Node, _file: string) {
  if (!node.loc) {
    return undefined
  }

  return {
    file: _file,
    start: node.loc.start.index,
    end: node.loc.end.index,
  }
}

// Utility function to generate unique IDs based on code location
export function getLocationId(
  node: t.Node,
  file: string,
  content: string,
): string {
  const location = getLocation(node, file)
  if (!location) throw new Error('Node does not have location information')
  return getHashFromLocation(location, content)
}

export type LiteralNode = t.JSXText | t.StringLiteral | t.TemplateElement
export const isLiteralNode = (
  node: t.Node | undefined,
): node is LiteralNode => {
  return (
    t.isJSXText(node) || t.isStringLiteral(node) || t.isTemplateElement(node)
  )
}
export const getLiteralValue = (node: LiteralNode): string => {
  if (typeof node.value === 'string') {
    return node.value
  }

  return node.value.raw
}
export const getHashFromLocation = (
  location: ComponentLocation,
  codeSnippet: string,
): string => {
  const { file: _file, start, end } = location
  const { line: startLine, column: startColumn } = getLineAndColumn(
    codeSnippet,
    start,
  )
  const { line: endLine, column: endColumn } = getLineAndColumn(
    codeSnippet,
    end,
  )

  return hashComponentId([
    { file: _file, startColumn, startLine, endColumn, endLine },
  ])
}

export const isChildNode = (node: Node, parent: Node): boolean => {
  return (
    node.location.file === parent.location.file &&
    node.location.start >= parent.location.start &&
    node.location.end <= parent.location.end
  )
}

export const getSnippetFromNode = (node: t.Node): string => {
  if (t.isTemplateElement(node)) {
    return node.value.raw
  }
  const result = generator(node, { retainLines: true })

  return result.code
}

export function getAttributeName(attribute: Attribute): string {
  if (attribute.type === 'className') {
    return 'className'
  } else if (attribute.type === 'text') {
    return 'children'
  }

  const [name] = attribute.value.split(':')
  return name
}

export const getNameValue = (node: Node): string => {
  const values = node.getValues()
  if (values.length !== 1) {
    return ''
  }
  if (isLiteralNode(values[0].node)) {
    return getLiteralValue(values[0].node)
  }

  if (t.isIdentifier(values[0].node)) {
    return values[0].node.name
  }

  if (values[0].node instanceof ComponentNode) {
    return values[0].node.name
  }

  return ''
}
