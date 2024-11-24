import type * as t from '@babel/types'
import type { NodeBase, ObjectNode } from '../types'
import { Node } from '../types'
import { JSXSpreadAttributeNode } from './jsxspread-attribute'
import { JSXAttribute } from './jsx-attribute'
import type { ComponentNode } from './component'

export class JSXElementNode extends Node<t.JSXElement> implements ObjectNode {
  constructor(
    private attributes: JSXAttribute[],
    private parentComponent: ComponentNode,
    private definitionComponent: ComponentNode | undefined,
    private openingElement: Node<t.JSXOpeningElement>,
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
            _attribute instanceof JSXAttribute
              ? _attribute.getChildIndex()
              : -1,
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

  public getRootInstances(): JSXElementNode[][] {
    const parentElements = traverseInstances(this)
    if (parentElements.length === 0) return [[this]]

    return parentElements.map((parentInstance) => [this, ...parentInstance])
  }

  public getDefinitionComponent() {
    return this.definitionComponent
  }
  public setDefinitionComponent(component: ComponentNode) {
    if (
      this.definitionComponent &&
      component.id !== this.definitionComponent.id
    )
      throw new Error('Definition component already set')

    this.definitionComponent = component
  }

  public addAttribute(attribute: JSXAttribute) {
    this.attributes.push(attribute)
  }

  public getOpeningElement(): Node<t.JSXOpeningElement> {
    return this.openingElement
  }
}

const traverseInstances = (element: JSXElementNode): JSXElementNode[][] => {
  const parentInstances = element.getParentComponent().getInstances()

  const instances: JSXElementNode[][] = parentInstances.map(
    (parentInstance) => [parentInstance],
  )

  instances.forEach((_instances) => {
    const newParentInstances = traverseInstances(
      _instances[_instances.length - 1],
    )
    newParentInstances.forEach((newParentInstance) => {
      _instances.push(...[..._instances, ...newParentInstance])
    })
  })

  return instances
}
