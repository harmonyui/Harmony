import type * as t from '@babel/types'
import type { NodeBase, ObjectNode, ObjectProperty } from '../types'
import { Node } from '../types'
import { getNameValue } from '../utils'
import { isObject } from '../predicates/simple-predicates'

export abstract class AbstractObjectProperty<T extends t.Node = t.Node>
  extends Node<T>
  implements ObjectProperty
{
  constructor(
    private key: Node,
    private value: Node,
    base: NodeBase<T>,
    private useBaseGetValues = false,
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
    return String(getNameValue(this.key))
  }

  public getValueNode() {
    return this.value
  }
}

export class ObjectPropertyNode extends AbstractObjectProperty<t.ObjectProperty> {}

//For object expressions, we do not want the getValues method in the AbstractObjectProperty
//because the dependencies are going the opposite way
export class ObjectPropertyExpressionNode
  extends Node<t.ObjectProperty>
  implements ObjectProperty
{
  constructor(
    private key: Node,
    private value: Node,
    base: NodeBase<t.ObjectProperty>,
  ) {
    super(base)
  }
  public getName() {
    return String(getNameValue(this.key))
  }

  public getValueNode() {
    return this.value
  }
}
