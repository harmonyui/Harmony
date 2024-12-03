import { DEFAULT_WIDTH } from '@harmony/util/src/constants'
import { mergeClassesWithScreenSize } from '@harmony/util/src/utils/tailwind-merge'
import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { LiteralNode } from '../../indexor/utils'
import { getLiteralValue } from '../../indexor/utils'
import type { Node } from '../../indexor/types'
import { addPrefixToClassName } from '../css-conveter'
import {
  addCommentToElement,
  getInstanceInfo,
  replaceAll,
  rotateThroughValuesAndMakeChanges,
} from './utils'
import type { UpdateComponent } from './types'

export const updateClassName: UpdateComponent = (
  { value, oldValue, update: componentUpdate },
  graph,
  repository,
) => {
  const { attributes, instances: graphElements } = getInstanceInfo(
    componentUpdate.componentId,
    componentUpdate.childIndex,
    graph,
  )

  const classNameAttribute = attributes.find(
    (attr) =>
      attr.attribute?.getName() === 'className' || attr.addArguments.length > 0,
  )

  if (!classNameAttribute) {
    const commentValue = `Change class for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
    return
  }

  if (repository.cssFramework === 'tailwind') {
    const removeTailwindPrefix = (classes: string) => {
      return repository.tailwindPrefix
        ? replaceAll(classes, repository.tailwindPrefix, '')
        : classes
    }
    const addTailwindPrefix = (classes: string): string => {
      return repository.tailwindPrefix
        ? addPrefixToClassName(classes, repository.tailwindPrefix)
        : classes
    }

    const mergeTailwindClasses = (
      currentValue: string,
      newClasses: string,
    ): string => {
      const currentWithoutPrefix = removeTailwindPrefix(currentValue)
      const newClassesWithoutPrefix = removeTailwindPrefix(newClasses)

      const merged = mergeClassesWithScreenSize(
        currentWithoutPrefix,
        newClassesWithoutPrefix,
        DEFAULT_WIDTH,
      )
      const mergedWithPrefix = addTailwindPrefix(merged)

      return mergedWithPrefix
    }

    //Figure out which value can accept our new class
    let defaultValue: Node<LiteralNode> | undefined
    if (
      !rotateThroughValuesAndMakeChanges(classNameAttribute, (node, parent) => {
        const addArgument = classNameAttribute.addArguments.find(
          (arg) => arg.propertyName === 'className' && arg.values.length === 0,
        )
        const shouldDoAddArgument =
          addArgument &&
          graphElements.findIndex((el) => el.id === addArgument.parent.id) >
            graphElements.findIndex((el) => el.id === parent.id)

        if (shouldDoAddArgument) {
          const { parent: addArgumentParent, propertyName } = addArgument
          graph.addAttributeToElement(addArgumentParent, propertyName, value)
          return true
        }

        if (isLiteral(node)) {
          //Save off the first value in ciase none of the classes can be merged
          if (!defaultValue) {
            defaultValue = node
          }
          const currClasses = getLiteralValue(node.node)
          const mergedClasses = mergeTailwindClasses(currClasses, value)
          if (
            mergedClasses.split(' ').length === currClasses.split(' ').length
          ) {
            graph.changeLiteralNode(node, mergedClasses)
            return true
          }
        }

        return false
      })
    ) {
      const addArgumet = classNameAttribute.addArguments.find(
        (arg) =>
          arg.propertyName.toLowerCase().includes('class') &&
          arg.values.length === 0,
      )
      //If we can add an attribute to the parent, let's do that
      if (addArgumet) {
        const { parent, propertyName } = addArgumet
        graph.addAttributeToElement(parent, propertyName, value)
        return
      }

      //If we could not find classes to merge with, just add the new classes
      //to the first value we came across
      if (defaultValue) {
        const currClasses = getLiteralValue(defaultValue.node)
        const mergedClasses = mergeTailwindClasses(currClasses, value)
        graph.changeLiteralNode(defaultValue, mergedClasses)
        return
      }

      //If no values are compatible, just add a comment
      const topLevelAttributeParent =
        classNameAttribute.elementValues[
          classNameAttribute.elementValues.length - 1
        ]?.parent ?? graphElements[0]
      const newClassesWithPrefix = addTailwindPrefix(value)
      const commentValue = `Add class ${newClassesWithPrefix} to ${graphElements[0].name} tag`
      addCommentToElement(topLevelAttributeParent, commentValue, graph)
    }
  } else {
    const topLevelAttributeParent =
      classNameAttribute.elementValues[
        classNameAttribute.elementValues.length - 1
      ]?.parent ?? graphElements[0]
    addCommentToElement(
      topLevelAttributeParent,
      `${componentUpdate.name}:${value};`,
      graph,
    )
  }
}
