import type * as t from '@babel/types'
import type { ArrayProperty, NodeBase, ObjectNode } from '../types'
import { Node } from '../types'
import { isArray } from '../predicates/simple-predicates'
import type { JSXAttribute } from './jsx-attribute'
import type { ComponentNode } from './component'

export class JSXElementNode extends Node<t.JSXElement> implements ObjectNode {
  private mappingExpression: ArrayProperty | undefined

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
      attributes.push(...attribute.getJSXAttributes())
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

  public setMappingExpression(node: ArrayProperty) {
    this.mappingExpression = node
  }

  public setMappingIndex(index: number) {
    if (index < 0 || !this.mappingExpression) return

    this.mappingExpression.setIndex(index)
  }

  public getMappingExpression() {
    if (!this.mappingExpression) return []

    const ret = this.mappingExpression.getValuesWithParents(
      isArray,
      isJSXElement,
      (node) => {
        const elements = node.getArrayElements()

        return Array.from({ length: elements.length }, (_, index) => index)
      },
      [this],
      true,
    )
    const actualRet: {
      parent: JSXElementNode
      values: number[]
    }[] = []
    ret.forEach((ret1) => {
      if (ret1.values.length > 1) {
        throw new Error('Should not have more than one array property')
      }

      const found = actualRet.find((actual) => actual.parent === ret1.parent)
      if (found) {
        found.values.push(...ret1.values[0])
      } else {
        actualRet.push({
          parent: ret1.parent,
          values: ret1.values[0],
        })
      }
    })

    return actualRet
  }
}

export const isJSXElement = (node: Node): node is JSXElementNode =>
  node instanceof JSXElementNode

const traverseInstances = (element: JSXElementNode): JSXElementNode[][] => {
  const parentInstances = element.getParentComponent().getInstances()

  const instances: JSXElementNode[][] = []

  parentInstances
    .map((parentInstance) => [parentInstance])
    .forEach((_instances) => {
      const newParentInstances = traverseInstances(
        _instances[_instances.length - 1],
      )
      if (newParentInstances.length === 0) {
        instances.push(_instances)
        return
      }
      newParentInstances.forEach((newParentInstance) => {
        instances.push([..._instances, ...newParentInstance])
      })
    })

  return instances
}
