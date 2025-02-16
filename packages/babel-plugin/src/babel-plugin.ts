/* eslint-disable @typescript-eslint/no-shadow -- ok*/
import type { PluginObj } from '@babel/core'
import type { NodePath } from '@babel/traverse'
import type * as BabelTypes from '@babel/types'
import { isValidPath } from '@harmony/util/src/utils/common'

export interface PluginOptions {
  opts: {
    rootDir: string
    repositoryId?: string
    keepTranspiledCode?: boolean
  }
  filename: string
}

export interface Babel {
  types: typeof BabelTypes
}

export default function harmonyPlugin(babel: Babel): PluginObj<PluginOptions> {
  const t = babel.types
  const hasSpreadOperator = (
    params: BabelTypes.FunctionDeclaration['params'],
  ): boolean => {
    return params.some((param) => t.isRestElement(param))
  }

  const constructPath = (file: string, rootDir: string): string => {
    const indexOfRoot = file.indexOf(rootDir)
    if (!rootDir || indexOfRoot < 0) {
      throw new Error('Please specify valid rootDir property in config')
    }
    let relativeFile = file.substring(indexOfRoot + rootDir.length)

    if (relativeFile.startsWith('/')) {
      relativeFile = relativeFile.substring(1)
    }

    //Make the paths be unix friendly
    return relativeFile.replace('\\', '/')
  }

  const visitFunction = function (
    path: NodePath<
      | BabelTypes.ArrowFunctionExpression
      | BabelTypes.FunctionDeclaration
      | BabelTypes.FunctionExpression
    >,
    state: PluginOptions,
  ) {
    const filePath = state.filename
    if (!filePath) {
      throw new Error('Invalid rootDir path')
    }

    const node = path.node
    if (
      isValidPath(filePath.substring(1)) &&
      node.params.length < 3 &&
      !hasSpreadOperator(node.params)
    ) {
      const params = node.params.slice()

      const newParam = t.restElement(t.identifier('harmonyArguments'))
      if (node.params.length === 0) {
        path.pushContainer('params', newParam)
      } else {
        node.params = [newParam]
      }

      for (let i = params.length - 1; i >= 0; i--) {
        const param = params[i]
        const defaultValue = t.isAssignmentPattern(param)
          ? param.right
          : undefined
        const paramIdent = t.isAssignmentPattern(param) ? param.left : param

        let init: BabelTypes.Expression = t.memberExpression(
          t.identifier('harmonyArguments'),
          t.numericLiteral(i),
          true,
        )
        if (defaultValue) {
          init = t.logicalExpression('||', init, defaultValue)
        }

        const constDeclaration = t.variableDeclaration('let', [
          t.variableDeclarator(paramIdent, init),
        ])
        const pathBody = path.get('body')
        if (t.isExpression(pathBody.node)) {
          const _pathBody = path.get('body') as NodePath<BabelTypes.Expression>
          _pathBody.replaceWith(
            t.blockStatement([t.returnStatement(_pathBody.node)]),
          )
        }
        ;(pathBody as NodePath<BabelTypes.BlockStatement>).unshiftContainer(
          'body',
          constDeclaration,
        )
      }
    }
  }

  const isJSX = (node: BabelTypes.Node | undefined | null): boolean => {
    return (
      [t.isJSXElement, t.isJSXFragment].some((func) => func(node)) ||
      (t.isConditionalExpression(node) &&
        isJSX(node.consequent) &&
        isJSX(node.alternate))
    )
  }

  const nestedFunctions: string[] = []

  return {
    visitor: {
      'FunctionDeclaration|ArrowFunctionExpression|FunctionExpression': {
        enter(path, state) {
          const keepTranspiledCode = state.opts.keepTranspiledCode === true
          if (
            path.type !== 'ArrowFunctionExpression' &&
            path.type !== 'FunctionDeclaration' &&
            path.type !== 'FunctionExpression'
          ) {
            return
          }
          const pathFunction = path as NodePath<
            | BabelTypes.ArrowFunctionExpression
            | BabelTypes.FunctionDeclaration
            | BabelTypes.FunctionExpression
          >
          const returnExpressionOrStatement = t.isExpression(
            pathFunction.node.body,
          )
            ? pathFunction.node.body
            : pathFunction.node.body.body[
                pathFunction.node.body.body.length - 1
              ]
          const returnExpression = t.isReturnStatement(
            returnExpressionOrStatement,
          )
            ? returnExpressionOrStatement.argument
            : returnExpressionOrStatement
          if (!isJSX(returnExpression)) {
            nestedFunctions.push('function')
            return
          }
          //Only declare a harmonyArguments var if we are at a root level function
          if (nestedFunctions.length === 0) {
            visitFunction(pathFunction, state)
          }

          if (nestedFunctions[nestedFunctions.length - 1] === 'function') {
            nestedFunctions.push('function')
            return
          }
          nestedFunctions.push('react')

          path.traverse(
            {
              JSXElement(path, state) {
                if (!path.node.loc) return

                //Only visit this node if it already hasn't been visited
                if (
                  path.node.openingElement.attributes.some(
                    (attr) =>
                      attr.type === 'JSXAttribute' &&
                      attr.name.type === 'JSXIdentifier' &&
                      ['data-harmony-id', 'data-harmony-parent-id'].includes(
                        attr.name.name,
                      ),
                  )
                ) {
                  return
                }
                const attributes = path.get('openingElement')

                if (
                  t.isJSXIdentifier(path.node.openingElement.name) &&
                  state.opts.repositoryId
                ) {
                  const name = path.node.openingElement.name.name
                  if (name === 'body') {
                    const dataRepositoryId = t.jsxAttribute(
                      t.jsxIdentifier('data-harmony-repository-id'),
                      t.stringLiteral(btoa(state.opts.repositoryId)),
                    )
                    attributes.pushContainer('attributes', dataRepositoryId)
                  }
                }

                const relativePath = constructPath(
                  state.filename,
                  state.opts.rootDir,
                )
                const harmonyId = `${relativePath}:${path.node.loc.start.line}:${path.node.loc.start.column}:${path.node.loc.end.line}:${path.node.loc.end.column}`
                const encodedHarmonyId = btoa(harmonyId)

                const parentExpression = t.optionalMemberExpression(
                  t.memberExpression(
                    t.identifier('harmonyArguments'),
                    t.numericLiteral(0),
                    true,
                  ),
                  t.stringLiteral('data-harmony-id'),
                  true,
                  true,
                )

                const dataHarmonyId = t.conditionalExpression(
                  t.logicalExpression(
                    '&&',
                    t.binaryExpression(
                      '!==',
                      t.unaryExpression(
                        'typeof',
                        t.identifier('harmonyArguments'),
                      ),
                      t.stringLiteral('undefined'),
                    ),
                    parentExpression,
                  ),
                  t.binaryExpression(
                    '+',
                    parentExpression,
                    t.binaryExpression(
                      '+',
                      t.stringLiteral('#'),
                      t.stringLiteral(encodedHarmonyId),
                    ),
                  ),
                  t.stringLiteral(encodedHarmonyId),
                )
                const dataHarmonyIdAttribute = t.jsxAttribute(
                  t.jsxIdentifier('data-harmony-id'),
                  t.jsxExpressionContainer(dataHarmonyId),
                )

                attributes.pushContainer('attributes', dataHarmonyIdAttribute)
              },
            },
            state,
          )
          if (keepTranspiledCode) {
            path.skip()
          }
        },
        exit() {
          nestedFunctions.pop()
        },
      },
    },
  }
}
