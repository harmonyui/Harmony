import type * as t from '@babel/types'
import type { ArrayNode, ArrayProperty, NodeBase } from '../types'
import { Node } from '../types'
import { isArray } from '../predicates/simple-predicates'

export class ArrayPatternNode
  extends Node<t.ArrayPattern>
  implements ArrayProperty
{
  constructor(
    private index: number,
    base: NodeBase<t.ArrayPattern>,
  ) {
    super(base)
  }

  public getIndex() {
    return this.index
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
      const attribute = node.getArrayElements()[this.getIndex()] as
        | ArrayProperty
        | undefined
      if (!attribute) return
      values.push(...attribute.getValues(predicate))
    })

    return values
  }
}
