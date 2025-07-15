import type * as t from '@babel/types'
import { isArray } from '../predicates/simple-predicates'
import type {
  ArrayProperty,
  NodeBase,
  ArrayNode,
  GetValuesOptions,
} from '../types'
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

  public override getValues({
    predicate,
    visitor,
  }: GetValuesOptions = {}): Node[] {
    const values: Node[] = []
    visitor?.(this)
    if (predicate && predicate(this)) {
      return [this]
    }

    const superValues = super.getValues({
      predicate: (node) => isArray(node),
      visitor,
    }) as ArrayNode[]

    if (superValues.length === 0) {
      return super.getValues({ predicate, visitor })
    }

    superValues.forEach((node) => {
      const index = this.getIndex()
      const attributes =
        index === undefined
          ? node.getArrayElements()
          : [node.getArrayElements()[index]].filter(Boolean)
      values.push(
        ...attributes.flatMap((attribute) =>
          attribute.getValues({ predicate, visitor }),
        ),
      )
    })

    return values
  }

  public getArrayExpression() {
    return super.getValues({
      predicate: (node) => isArray(node),
    }) as ArrayNode[]
  }
}
