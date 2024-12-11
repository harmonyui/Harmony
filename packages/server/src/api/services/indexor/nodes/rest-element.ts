import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type { NodeBase, ObjectNode, ObjectProperty } from '../types'
import { Node } from '../types'
import { createNode, getSnippetFromNode } from '../utils'
import { isObject } from '../predicates/simple-predicates'

export class RestElement<T extends t.RestElement | t.JSXSpreadAttribute>
  extends Node<T>
  implements ObjectNode
{
  private argument: Node
  constructor(
    private notProperties: ObjectProperty[],
    content: string,
    base: NodeBase<T>,
  ) {
    super(base)
    this.argument = createNode(
      getSnippetFromNode(this.node.argument),
      this.path.get('argument') as NodePath,
      this.location.file,
      content,
      base.graph,
    )
  }

  public getNotProperties() {
    return this.notProperties
  }

  public getArgument() {
    return this.argument
  }

  public setArgument(argument: Node) {
    this.argument = argument
  }

  public getAttributes(): ObjectProperty[] {
    return this.getNameAndValues()
  }

  public addProperty(name: string, value: string | Node<t.Expression>) {
    const objectNodes = this.getObjectNodes()
    objectNodes.forEach((objectNode) => {
      objectNode.addProperty(name, value)
    })
    this.graph.dirtyNode(this)
  }

  public override getValues(predicate?: (node: Node) => boolean): Node[] {
    if (predicate) {
      return super.getValues(predicate)
    }
    const argumentValues = super.getValues(
      (node) => node !== this && isObject(node),
    ) as ObjectNode[]
    const notPropertyNames = this.notProperties.map((notProperty) =>
      notProperty.getName(),
    )
    const values: Node[] = []
    argumentValues.forEach((node) => {
      const attributes = node
        .getAttributes()
        .filter(
          (_attribute) => !notPropertyNames.includes(_attribute.getName()),
        )
      if (attributes.length === 0) return
      values.push(
        ...attributes.flatMap((attribute) =>
          attribute.getValueNode().getValues(predicate),
        ),
      )
    })

    return values
  }

  public getNameAndValues(): ObjectProperty[] {
    const argumentValues = this.getObjectNodes()
    const notPropertyNames = this.notProperties.map((notProperty) =>
      notProperty.getName(),
    )
    const values: ObjectProperty[] = []
    argumentValues.forEach((node) => {
      const attributes = node
        .getAttributes()
        .filter(
          (_attribute) => !notPropertyNames.includes(_attribute.getName()),
        )
      if (attributes.length === 0) return
      values.push(...attributes)
    })

    return values
  }

  private getObjectNodes(): ObjectNode[] {
    return super.getValues(
      (node) => node !== this && isObject(node),
    ) as ObjectNode[]
  }
}

export class RestElementNode extends RestElement<t.RestElement> {}
