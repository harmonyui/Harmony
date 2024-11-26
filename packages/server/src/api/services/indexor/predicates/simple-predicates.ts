import * as t from '@babel/types'
import type { Node, ObjectNode } from '../types'
import type { LiteralNode } from '../utils'
import { isLiteralNode } from '../utils'

export const isIdentifier = (node: Node): node is Node<t.Identifier> =>
  t.isIdentifier(node.node)
export const isCallExpression = (node: Node): node is Node<t.CallExpression> =>
  t.isCallExpression(node.node)
export const isObjectPattern = (node: Node): node is Node<t.ObjectPattern> =>
  t.isObjectPattern(node.node)
export const isFunctionDeclaration = (
  node: Node,
): node is Node<t.FunctionDeclaration> => t.isFunctionDeclaration(node.node)
export const isArrowFunctionExpression = (
  node: Node,
): node is Node<t.ArrowFunctionExpression> =>
  t.isArrowFunctionExpression(node.node)
export const isVariableDeclarator = (
  node: Node,
): node is Node<t.VariableDeclarator> => t.isVariableDeclarator(node.node)
export const isTemplateLiteral = (
  node: Node,
): node is Node<t.TemplateLiteral> => t.isTemplateLiteral(node.node)
export const isMemberExpression = (
  node: Node,
): node is Node<t.MemberExpression> => t.isMemberExpression(node.node)
export const isObjectExpression = (
  node: Node,
): node is Node<t.ObjectExpression> => t.isObjectExpression(node.node)
export const isObject = (node: Node): node is ObjectNode => {
  return 'getAttributes' in node
}
export const isExpression = (node: Node): node is Node<t.Expression> =>
  t.isExpression(node.node)
export const isLiteral = (node: Node): node is Node<LiteralNode> =>
  isLiteralNode(node.node)
export const isFunctionExpression = (
  node: Node,
): node is Node<t.FunctionExpression> => t.isFunctionExpression(node.node)
