import * as t from '@babel/types'
import { isObject } from '../node-predicates'
import type { NodeBase, ObjectNode } from '../types'
import { Node } from '../types'
import { getLiteralValue, isLiteralNode } from '../ast'

export abstract class AbstractObjectProperty<
  T extends t.Node = t.Node,
> extends Node<T> {
  constructor(
    private key: Node,
    base: NodeBase<T>,
  ) {
    super(base)
  }

  public override getValues() {
    const values: Node[] = []
    const superValues = super.getValues((node) =>
      isObject(node),
    ) as ObjectNode[]

    superValues.forEach((node) => {
      const attribute = node
        .getAttributes()
        .find((_attribute) => _attribute.name === this.getName())
      if (!attribute) return
      values.push(...attribute.getValues())
    })

    return values
  }

  private getName() {
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
}

export class ObjectPropertyNode extends AbstractObjectProperty<t.ObjectProperty> {}
