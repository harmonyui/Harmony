import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { Node } from './types'
import { isLiteralNode } from './ast'

export function createNode<T extends t.Node>(
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

export function getComponentName(path: NodePath): string | undefined {
  // Check if the function is assigned to a variable or exported
  if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
    return path.parent.id.name
  } else if (
    t.isExportDeclaration(path.parent) &&
    path.parent.type !== 'ExportAllDeclaration' &&
    path.parent.declaration &&
    'id' in path.parent.declaration &&
    t.isIdentifier(path.parent.declaration.id)
  ) {
    return path.parent.declaration.id.name
  } else if (
    t.isFunctionDeclaration(path.node) &&
    t.isIdentifier(path.node.id)
  ) {
    return path.node.id.name
  } else if (
    t.isCallExpression(path.parent) &&
    t.isVariableDeclarator(path.parentPath?.parent) &&
    t.isIdentifier(path.parentPath.parent.id)
  ) {
    return path.parentPath.parent.id.name
  }

  return undefined
}

// Utility function to generate unique IDs based on code location
export function getLocationId(node: t.Node): string {
  const loc = node.loc
  return loc
    ? `${loc.start.line}:${loc.start.column}-${loc.end.line}:${loc.end.column}`
    : 'unknown-location'
}
