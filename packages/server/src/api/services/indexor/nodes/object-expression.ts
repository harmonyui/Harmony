import type * as t from '@babel/types'
import type { NodeBase, ObjectProperty, ObjectNode } from '../types'
import { Node } from '../types'
import type { RestElementNode } from './rest-element'
import { ObjectPropertyNode } from './object-property'

export class ObjectExpressionNode
  extends Node<t.ObjectExpression>
  implements ObjectNode
{
  constructor(
    private properties: (ObjectPropertyNode | RestElementNode)[],
    base: NodeBase<t.ObjectExpression>,
  ) {
    super(base)
  }

  public getAttributes() {
    const attributes: ObjectProperty[] = []
    this.properties.forEach((property) => {
      if (property instanceof ObjectPropertyNode) {
        attributes.push(property)
      } else {
        attributes.push(...property.getNameAndValues())
      }
    })

    return attributes
  }
}
