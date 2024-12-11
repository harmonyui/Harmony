import * as t from '@babel/types'
import type { NodeBase, ObjectProperty, ObjectNode } from '../types'
import { Node } from '../types'
import { isObjectProperty } from '../predicates/simple-predicates'
import { getSnippetFromNode } from '../utils'
import type { RestElementNode } from './rest-element'
import { ObjectPropertyNode } from './object-property'

export class ObjectExpressionNode
  extends Node<t.ObjectExpression>
  implements ObjectNode
{
  constructor(
    private properties: (ObjectProperty | RestElementNode)[],
    base: NodeBase<t.ObjectExpression>,
  ) {
    super(base)
  }

  public getAttributes() {
    const attributes: ObjectProperty[] = []
    this.properties.forEach((property) => {
      if (isObjectProperty(property)) {
        attributes.push(property)
      } else {
        attributes.push(...property.getNameAndValues())
      }
    })

    return attributes
  }

  public addProperty(name: string, value: string | Node<t.Expression>) {
    const newNode = t.objectProperty(
      t.stringLiteral(name),
      typeof value === 'string' ? t.stringLiteral(value) : value.node,
    )
    const newKeyNode = new Node(
      this.graph.createNodeAndPath(name, newNode.key, this),
    )
    const newValueNode = new Node(
      this.graph.createNodeAndPath(
        getSnippetFromNode(newNode.value),
        newNode.value,
        this,
      ),
    )
    const newPropertyNode = new ObjectPropertyNode(
      newKeyNode,
      newValueNode,
      this.graph.createNodeAndPath(getSnippetFromNode(newNode), newNode, this),
    )

    this.path.node.properties.push(newPropertyNode.path.node)
    this.properties.push(newPropertyNode)
    this.graph.dirtyNode(this)
  }
}
