import type * as t from '@babel/types'
import type { ArrayProperty, NodeBase, ObjectNode } from '../types'
import { Node } from '../types'
import { isArray } from '../predicates/simple-predicates'
import type { JSXAttribute } from './jsx-attribute'
import { ComponentNode } from './component'
import { ImportStatement } from './import-statement'

export class JSXElementNode extends Node<t.JSXElement> implements ObjectNode {
  private mappingExpression: ArrayProperty | undefined
  private children: JSXElementNode[] = []
  private parentElement: JSXElementNode | undefined
  private definitionComponent: ComponentNode | undefined

  constructor(
    private attributes: JSXAttribute[],
    private parentComponent: ComponentNode,
    private openingElement: Node<t.JSXOpeningElement>,
    private closingElement: Node<t.JSXClosingElement> | undefined,
    private nameNode: Node,
    base: NodeBase<t.JSXElement>,
  ) {
    super(base)
  }

  public getName() {
    const referencedComponent = this.nameNode.getValues(
      (node) => node instanceof ComponentNode,
    )
    if (referencedComponent.length > 0) {
      return referencedComponent[0].name
    }

    return this.name
  }

  public getNameNode() {
    return this.nameNode
  }

  public getAttributes(componentIdTree?: string) {
    const attributes: JSXAttribute[] = []
    const rawAttributes = Array.from(this.attributes)
    rawAttributes.forEach((attribute) => {
      attributes.push(...attribute.getJSXAttributes())
    })

    return attributes.filter((attribute) =>
      componentIdTree
        ? componentIdTree.includes(attribute.getParentElement().id)
        : true,
    )
  }

  public getDependencies(): Node[] {
    const dependencies: Node[] = []
    const importStatements = this.nameNode.getValues(
      (node) => node instanceof ImportStatement,
    )
    dependencies.push(...importStatements)

    return dependencies
  }

  public getParentComponent() {
    return this.parentComponent
  }
  public setParentComponent(parentComponent: ComponentNode) {
    this.parentComponent = parentComponent
  }

  public getChildren(traverse = false): JSXElementNode[] {
    if (!traverse) return this.children

    return this.children.reduce<JSXElementNode[]>(
      (prev, curr) => [...prev, ...curr.getChildren(traverse)],
      this.children,
    )
  }

  public getParentElement() {
    return this.parentElement
  }
  public setParentElement(parentElement: JSXElementNode | undefined) {
    this.parentElement = parentElement
  }

  public getRootInstances(): JSXElementNode[][]
  public getRootInstances(componentId: string): JSXElementNode[] | undefined
  public getRootInstances(
    componentId?: string,
  ): (JSXElementNode[] | undefined) | JSXElementNode[][] {
    const parentElements = traverseInstances(this)
    if (parentElements.length === 0) return componentId ? [this] : [[this]]

    const allInstances = parentElements.map((parentInstance) => [
      this,
      ...parentInstance,
    ])
    if (componentId) {
      const ids = componentId.split('#').reverse()
      const instanceSetWithComponentId = allInstances.find((instanceSet) =>
        instanceSet.every((instance, i) => instance.id === ids[i]),
      )

      return instanceSetWithComponentId
    }

    return allInstances
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

  public addChild(child: JSXElementNode) {
    this.children.push(child)
  }

  public insertChild(child: JSXElementNode, index: number) {
    this.children.splice(index, 0, child)
  }

  public getOpeningElement(): Node<t.JSXOpeningElement> {
    return this.openingElement
  }

  public getClosingElement(): Node<t.JSXClosingElement> | undefined {
    return this.closingElement
  }
  public setClosingElement(closingElement: Node<t.JSXClosingElement>) {
    this.closingElement = closingElement
  }

  public setMappingExpression(node: ArrayProperty) {
    this.mappingExpression = node
  }

  public setMappingIndex(index: number) {
    if (index < 0 || !this.mappingExpression) return

    this.mappingExpression.setIndex(index)
  }

  public getMappingExpression(componentIdTree?: string) {
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

    if (componentIdTree) {
      return actualRet.filter((_ret) =>
        componentIdTree.includes(_ret.parent.id),
      )
    }

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
