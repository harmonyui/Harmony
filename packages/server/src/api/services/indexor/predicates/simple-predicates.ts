import * as t from '@babel/types'
import type {
  ArrayNode,
  ArrayProperty,
  Node,
  ObjectNode,
  ObjectProperty,
} from '../types'
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
export const isArray = (node: Node): node is ArrayNode =>
  'getArrayElements' in node
export const isExpression = (node: Node): node is Node<t.Expression> =>
  t.isExpression(node.node)
export const isLiteral = (node: Node): node is Node<LiteralNode> =>
  isLiteralNode(node.node)
export const isFunctionExpression = (
  node: Node,
): node is Node<t.FunctionExpression> => t.isFunctionExpression(node.node)
export const isArrayPattern = (node: Node): node is Node<t.ArrayPattern> =>
  t.isArrayPattern(node.node)
export const isArrayExpression = (
  node: Node,
): node is Node<t.ArrayExpression> => t.isArrayExpression(node.node)
export const isNumericLiteral = (node: Node): node is Node<t.NumericLiteral> =>
  t.isNumericLiteral(node.node)
export const isArrayProperty = (node: Node): node is ArrayProperty =>
  'getIndex' in node
export const isJSXText = (node: Node): node is Node<t.JSXText> =>
  t.isJSXText(node.node)
export const isStringLiteral = (node: Node): node is Node<t.StringLiteral> =>
  t.isStringLiteral(node.node)
export const isTemplateElement = (
  node: Node,
): node is Node<t.TemplateElement> => t.isTemplateElement(node.node)
export const isObjectProperty = (node: Node): node is ObjectProperty =>
  'getName' in node && 'getValueNode' in node
