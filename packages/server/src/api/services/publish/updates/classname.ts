import { DEFAULT_WIDTH } from '@harmony/util/src/constants'
import { mergeClassesWithScreenSize } from '@harmony/util/src/utils/tailwind-merge'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import type { ClassNameValue } from '@harmony/util/src/updates/classname'
import { classNameValueSchema } from '@harmony/util/src/updates/classname'
import type { Repository } from '@harmony/util/src/types/branch'
import { isLiteral } from '../../indexor/predicates/simple-predicates'
import type { LiteralNode } from '../../indexor/utils'
import { getLiteralValue } from '../../indexor/utils'
import type { Node } from '../../indexor/types'
import { addPrefixToClassName } from '../css-conveter'
import type { FlowGraph } from '../../indexor/graph'
import {
  addCommentToElement,
  getInstanceInfo,
  replaceAll,
  rotateThroughValuesAndMakeChanges,
} from './utils'
import type { UpdateComponent } from './types'
import { addOnTrim } from '@harmony/util/src/utils/common'

export const updateClassName: UpdateComponent = async (
  { value: unparsedValue, oldValue: unparsedOldValue, update: componentUpdate },
  graph,
  repository,
) => {
  const { value, type } = parseUpdate(classNameValueSchema, unparsedValue)
  const { value: oldValue } = parseUpdate(
    classNameValueSchema,
    unparsedOldValue,
  )

  updateElementClassName({
    childIndex: componentUpdate.childIndex,
    componentId: componentUpdate.componentId,
    value,
    oldValue,
    type,
    propertyName: componentUpdate.name,
    graph,
    repository,
  })
}

export const updateElementClassName = ({
  childIndex,
  componentId,
  value,
  oldValue,
  type,
  propertyName,
  graph,
  repository,
}: {
  value: string
  type: ClassNameValue['type']
  oldValue: string
  propertyName: string
  componentId: string
  childIndex: number
  graph: FlowGraph
  repository: Repository
}) => {
  const { attributes, instances: graphElements } = getInstanceInfo(
    componentId,
    childIndex,
    graph,
  )

  const classNameAttribute = attributes.find(
    (attr) =>
      attr.attribute?.getName() === 'className' ||
      (attr.addArguments.length > 0 &&
        attr.addArguments.some((arg) =>
          arg.propertyName.toLowerCase().includes('class'),
        )),
  )

  if (!classNameAttribute) {
    const commentValue = `Change class for ${graphElements[0].name} tag from ${oldValue} to ${value}`
    addCommentToElement(graphElements[0], commentValue, graph)
    return
  }

  if (repository.cssFramework === 'tailwind' && type === 'class') {
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

    const getMergeInfo = (node: Node<LiteralNode>) => {
      const currClassesOriginal = String(getLiteralValue(node.node))
      const currClasses = currClassesOriginal.trim()
      const mergedClasses = mergeTailwindClasses(currClasses, value)
      const shouldMerge =
        mergedClasses.split(' ').length === currClasses.split(' ').length
      const mergedValue = addOnTrim(mergedClasses, currClassesOriginal)
      return {
        shouldMerge,
        mergedValue,
      }
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
          const { parent: addArgumentParent, propertyName: _propertyName } =
            addArgument
          graph.addAttributeToElement(addArgumentParent, _propertyName, value)
          return true
        }

        if (isLiteral(node)) {
          //Save off the first value in ciase none of the classes can be merged
          if (!defaultValue) {
            defaultValue = node
          }
          const { shouldMerge, mergedValue } = getMergeInfo(node)
          if (shouldMerge) {
            graph.changeLiteralNode(node, mergedValue)
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
        const { parent, propertyName: _propertyName } = addArgumet
        graph.addAttributeToElement(parent, _propertyName, value)
        return
      }

      //If we could not find classes to merge with, just add the new classes
      //to the first value we came across
      if (defaultValue) {
        const { mergedValue } = getMergeInfo(defaultValue)
        graph.changeLiteralNode(defaultValue, mergedValue)
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
    graph.addStyleToElement(graphElements[0], propertyName, value)
  }
}
