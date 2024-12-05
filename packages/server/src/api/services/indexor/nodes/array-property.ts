import type * as t from '@babel/types'
import { isArray } from '../predicates/simple-predicates'
import type { ArrayProperty, NodeBase, ArrayNode } from '../types'
import { Node } from '../types'

export class ArrayPropertyNode extends Node implements ArrayProperty {
  constructor(
    private index: number | undefined,
    base: NodeBase<t.Node>,
  ) {
    super(base)
  }

  public getIndex() {
    return this.index
  }

  public setIndex(index: number | undefined) {
    this.index = index
  }

  public override getValues(predicate?: (node: Node) => boolean): Node[] {
    const values: Node[] = []
    if (predicate && predicate(this)) {
      return [this]
    }

    const superValues = super.getValues((node) => isArray(node)) as ArrayNode[]

    if (superValues.length === 0) {
      return super.getValues(predicate)
    }

    superValues.forEach((node) => {
      const index = this.getIndex()
      const attributes =
        index === undefined
          ? node.getArrayElements()
          : [node.getArrayElements()[index]].filter(Boolean)
      values.push(
        ...attributes.flatMap((attribute) => attribute.getValues(predicate)),
      )
    })

    return values
  }

  public getArrayExpression() {
    return super.getValues((node) => isArray(node)) as ArrayNode[]
  }
}
