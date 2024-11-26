import * as t from '@babel/types'
import type { NodeBase, ObjectNode, ObjectProperty } from '../types'
import { Node } from '../types'
import { getLiteralValue, isLiteralNode } from '../utils'
import { isObject } from '../predicates/simple-predicates'

export abstract class AbstractObjectProperty<T extends t.Node = t.Node>
  extends Node<T>
  implements ObjectProperty
{
  constructor(
    private key: Node,
    private value: Node,
    base: NodeBase<T>,
  ) {
    super(base)
  }

  public override getValues(predicate?: (node: Node) => boolean): Node[] {
    const values: Node[] = []
    if (predicate && predicate(this)) {
      return [this]
    }

    const superValues = super.getValues((node) =>
      isObject(node),
    ) as ObjectNode[]

    if (superValues.length === 0) {
      return super.getValues(predicate)
    }

    superValues.forEach((node) => {
      const attribute = node
        .getAttributes()
        .find((_attribute) => _attribute.getName() === this.getName())
      if (!attribute) return
      values.push(...attribute.getValueNode().getValues(predicate))
    })

    return values
  }

  public getName() {
    const values = this.key.getValues()
    if (values.length !== 1) {
      return ''
    }
    if (isLiteralNode(values[0].node)) {
      return getLiteralValue(values[0].node)
    }

    if (t.isIdentifier(values[0].node)) {
      return values[0].node.name
    }

    return ''
  }

  public getValueNode() {
    return this.value
  }
}

export class ObjectPropertyNode extends AbstractObjectProperty<t.ObjectProperty> {}
