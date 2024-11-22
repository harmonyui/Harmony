import type * as t from '@babel/types'
import type { NodeBase, ObjectNode } from '../types'
import { Node } from '../types'

export class ObjectExpressionNode
  extends Node<t.ObjectExpression>
  implements ObjectNode
{
  constructor(
    private properties: Node[],
    base: NodeBase<t.ObjectExpression>,
  ) {
    super(base)
  }

  public getAttributes() {
    return this.properties
  }
}
