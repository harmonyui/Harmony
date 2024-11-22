import type * as t from '@babel/types'
import type { NodeBase, ObjectNode } from '../types'
import { JSXAttribute, Node } from '../types'
import type { ComponentNode } from '../node'
import { JSXSpreadAttributeNode } from './jsxspread-attribute'

export class JSXElementNode extends Node<t.JSXElement> implements ObjectNode {
  constructor(
    private attributes: JSXAttribute[],
    private parentComponent: ComponentNode,
    private definitionComponent: ComponentNode | undefined,
    base: NodeBase<t.JSXElement>,
  ) {
    super(base)
  }

  public getAttributes() {
    const attributes: JSXAttribute[] = []
    const rawAttributes = Array.from(this.attributes)
    rawAttributes.forEach((attribute) => {
      if (attribute instanceof JSXSpreadAttributeNode) {
        attribute.getNameAndValues().forEach((_attribute) => {
          const newAttribute = new JSXAttribute(
            this,
            _attribute.getValueNode(),
            -1,
            _attribute,
          )
          attributes.push(newAttribute)
        })
      } else {
        attributes.push(attribute)
      }
    })

    return attributes
  }

  public getParentComponent() {
    return this.parentComponent
  }

  public getDefinitionComponent() {
    return this.definitionComponent
  }

  public addAttribute(attribute: JSXAttribute) {
    this.attributes.push(attribute)
  }
}
