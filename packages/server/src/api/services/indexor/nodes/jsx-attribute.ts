import * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import { Node } from '../types'
import type { ArrayProperty, NodeBase, ObjectProperty } from '../types'
import type { LiteralNode } from '../utils'
import { createNode, getSnippetFromNode, isChildNode } from '../utils'
import {
  isArray,
  isArrayProperty,
  isIdentifier,
  isLiteral,
} from '../predicates/simple-predicates'
import { isJSXElement, type JSXElementNode } from './jsx-element'
import { UndefinedNode } from './undefined'

export class JSXAttribute<T extends t.Node = t.Node>
  extends Node<T>
  implements ObjectProperty
{
  public isMappedExpression = false

  constructor(
    private parentElement: JSXElementNode,
    private value: Node,
    private childIndex: number,
    base: NodeBase<T>,
  ) {
    super(base)
    if (value.id === this.id) {
      this.value.id = `${this.id}-value`
    }
  }

  public getValueNode() {
    return this.value
  }
  public setValueNode(value: Node) {
    this.value = value
  }

  public getParentElement() {
    return this.parentElement
  }

  public getDataFlow(): Node<LiteralNode>[] {
    const values = this.value.getValues()
    const literalValues = values.filter((value) => isLiteral(value))

    return literalValues
  }

  public getJSXAttributes(): JSXAttribute[] {
    return [this]
  }

  public getDataFlowWithParents(componentTreeId?: string): {
    parent: JSXElementNode
    values: Node[]
  }[] {
    const ret = this.value.getValuesWithParents(
      (node): node is Node => node.dataDependencies.size === 0,
      isJSXElement,
      (node) => node,
      [],
    )
    return ret.filter((v) =>
      componentTreeId ? componentTreeId.includes(v.parent.id) : true,
    )
  }

  public getChildIndex(): number {
    return this.childIndex
  }

  public getName(): string {
    return this.name
  }

  public getArgumentReferences(filterByInstance?: JSXElementNode): {
    identifiers: Node<t.Identifier>[]
    argument: Node | undefined
  } {
    const definitionComponent = this.parentElement.getParentComponent()
    const argument = definitionComponent.getArguments()[0] as Node | undefined
    if (!argument) return { identifiers: [], argument }

    const identifiers = this.value.getValues((node) =>
      isIdentifier(node),
    ) as Node<t.Identifier>[]

    return {
      identifiers: identifiers
        .filter(
          (identifier) =>
            identifier.getValues((node) => isChildNode(node, argument)).length >
            0,
        )
        .filter((ident) =>
          filterByInstance
            ? ident.getValues((_node) => isChildNode(_node, filterByInstance))
                .length === 0
            : true,
        ),
      argument,
    }
  }

  public getMappedIndexes(): {
    parent: JSXElementNode
    values: { index: number; values: Node[] }[]
  }[] {
    const values = this.value.getValues(
      (node) => isArrayProperty(node) && node.getIndex() === undefined,
    ) as ArrayProperty[]
    if (values.length > 1)
      throw new Error('Should not have more than one array property')

    const value = values[0]
    const ret = value.getValuesWithParents(
      isArray,
      isJSXElement,
      (node, parents) => {
        const elements = node.getArrayElements()

        const elementValues = elements.map((element) =>
          element.getValuesWithParents(
            (_node): _node is Node => node.dataDependencies.size === 0,
            isJSXElement,
            (_node) => _node,
            parents,
          ),
        )

        return elementValues.map((elementValue, index) => ({
          index,
          values: elementValue,
        }))
      },
      [],
    )
    const actualRet: {
      parent: JSXElementNode
      values: { index: number; values: Node[] }[]
    }[] = []
    ret.forEach((ret1) => {
      ret1.values.forEach((ret2) => {
        ret2.forEach((ret3) => {
          ret3.values.forEach((ret4) => {
            const found = actualRet.find(
              (actual) => actual.parent === ret1.parent,
            )
            if (found) {
              const foundIndex = found.values.find(
                (v) => v.index === ret3.index,
              )
              if (foundIndex) {
                foundIndex.values.push(...ret4.values)
              } else {
                found.values.push({ index: ret3.index, values: ret4.values })
              }
            } else {
              actualRet.push({
                parent: ret1.parent,
                values: [{ index: ret3.index, values: ret4.values }],
              })
            }
          })
        })
      })
    })

    return actualRet
  }
}

export class JSXAttributeNode extends JSXAttribute<
  t.JSXAttribute | t.JSXText | t.JSXExpressionContainer
> {
  constructor(
    parentElement: JSXElementNode,
    childIndex: number,
    content: string,
    base: NodeBase<t.JSXAttribute | t.JSXText | t.JSXExpressionContainer>,
  ) {
    super(
      parentElement,
      createValue(base.path, base.location.file, content),
      childIndex,
      base,
    )
  }
}

function createValue(
  path: NodePath,
  fileLocation: string,
  fileContent: string,
) {
  const arg = path.node
  const attributePath = path

  const getValueKey = () => {
    if (t.isJSXAttribute(arg)) {
      return t.isJSXExpressionContainer(arg.value)
        ? `value.expression`
        : `value`
    }

    if (t.isJSXExpressionContainer(arg)) {
      return `expression`
    }

    return ''
  }
  const key = getValueKey()

  const value = key ? attributePath.get(key) : attributePath
  if (Array.isArray(value)) throw new Error('Should not be array')
  if (!(value.node as Node | null)) {
    return new UndefinedNode(
      createNode('', attributePath, fileLocation, fileContent),
    )
  }
  const valueNode = createNode(
    getSnippetFromNode(value.node),
    value,
    fileLocation,
    fileContent,
  )

  return valueNode
}
