import type * as t from '@babel/types'
import type { ArrayNode, NodeBase } from '../types'
import { Node } from '../types'

export class ArrayExpression
  extends Node<t.ArrayExpression>
  implements ArrayNode
{
  constructor(
    private arrayElements: Node[],
    base: NodeBase<t.ArrayExpression>,
  ) {
    super(base)
  }
  public getArrayElements() {
    return this.arrayElements
  }
}
