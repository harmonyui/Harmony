import { createUpdate, parseUpdate } from '@harmony/util/src/updates/utils'
import type { StyleUpdate } from '@harmony/util/src/updates/component'
import { styleUpdateSchema } from '@harmony/util/src/updates/component'
import type * as t from '@babel/types'
import {
  classNameValueSchema,
  type ClassNameValue,
} from '@harmony/util/src/updates/classname'
import { isObject } from '../../indexor/predicates/simple-predicates'
import type { Node } from '../../indexor/types'
import type { FlowGraph } from '../../indexor/graph'
import { getGraph } from '../../indexor/graph'
import type { TransformedTailwindConfig } from '../../../repository/openai'
import {
  generateTailwindAnimations,
  refactorTailwindClasses,
} from '../../../repository/openai'
import type { JSXElementNode } from '../../indexor/nodes/jsx-element'
import { isJSXElement } from '../../indexor/nodes/jsx-element'
import { getLiteralValue, getSnippetFromNode } from '../../indexor/utils'
import type { UpdateComponent } from './types'
import { updateClassName, updateElementClassName } from './classname'
import {
  getClassNameValue,
  getElementInstanceNodes,
  getInstanceFromElement,
  getJSXElementFromLevels,
  parseJSXElementText,
  parseText,
} from './utils'

export const updateStyle: UpdateComponent = async (info, graph, repository) => {
  const { type, properties } = parseUpdate(styleUpdateSchema, info.value)
  if (type === 'animation') {
    await updateAnimationStyle(info, graph, repository)
  } else {
    await updateHoverStyle(info, graph, repository)
  }

  await Promise.all(
    properties.map(async (property) => {
      const {
        componentId,
        childIndex,
        property: propertyName,
        value,
      } = property

      const update = parseUpdate(
        classNameValueSchema,
        await getClassNameValue(
          propertyName,
          value,
          '',
          repository.cssFramework,
          repository.tailwindConfig,
        ),
      )
      updateElementClassName({
        componentId,
        childIndex,
        graph,
        repository,
        propertyName,
        oldValue: '',
        ...update,
      })
    }),
  )
}

const updateAnimationStyle: UpdateComponent = async (info, graph, ...rest) => {
  const { css } = parseUpdate(styleUpdateSchema, info.value)

  const transformInfo = await transformCSSAnimationsToTailwind(css)

  const tailwindProgram = graph.files['tailwind.config.ts']
  const configFile = tailwindProgram.getDefaultExport()
  if (!configFile) {
    throw new Error('Expected tailwind.config.ts to have a default export')
  }
  const extendProperty = graph.evaluatePropertyOrAdd(configFile, 'theme.extend')
  const animationProperty = graph.evaluatePropertyOrAdd(
    extendProperty,
    'animation',
  )
  if (!isObject(animationProperty)) {
    throw new Error('Expected animation property to be an object')
  }
  Object.entries(transformInfo['theme.extend.animation']).forEach(
    ([key, value]) => {
      animationProperty.addProperty(key, value)
    },
  )
  const keyframeProperty = graph.evaluatePropertyOrAdd(
    extendProperty,
    'keyframes',
  )
  if (!isObject(keyframeProperty)) {
    throw new Error('Expected animation property to be an object')
  }
  Object.entries(transformInfo['theme.extend.keyframes']).forEach(
    ([key, value]) => {
      const node = parseText(
        JSON.stringify(value),
        isObject,
      )[0] as Node<t.Expression>
      keyframeProperty.addProperty(key, node)
    },
  )

  await updateClassName(
    {
      ...info,
      value: createUpdate<ClassNameValue>({
        value: transformInfo.classes,
        type: 'class',
      }),
      oldValue: createUpdate<ClassNameValue>({
        value: '',
        type: 'class',
      }),
    },
    graph,
    ...rest,
  )
}

const updateHoverStyle: UpdateComponent = async (info, graph, repository) => {
  const { css, classes } = parseUpdate(styleUpdateSchema, info.value)

  const { snippet: reducedClassElements, elements } = buildReducedClassElement(
    classes,
    graph,
  )
  const transformedCSS = await transformCSSToTailwind(css, reducedClassElements)

  const transformedElements = parseJSXElementText(transformedCSS)
  if (transformedElements.length !== elements.length) {
    throw new Error('Number of elements changed')
  }
  transformedElements.forEach((element, i) => {
    const oldElement = elements[i]
    if (element.getName() !== oldElement.getName()) {
      throw new Error("Element's name changed")
    }

    const classNameAttribute = element
      .getAttributes()
      .find((attr) => attr.name === 'className')
    const classNameValueNode = classNameAttribute?.getDataFlow()[0]
    if (!classNameValueNode) {
      return
    }

    const classNameValue = getLiteralValue(classNameValueNode.node)

    updateElementClassName({
      graph,
      repository,
      value: classNameValue,
      type: 'class',
      oldValue: '',
      propertyName: '',
      componentId: oldElement.id,
      childIndex: oldElement.getChildIndex(),
    })
  })
}

const buildReducedClassElement = (
  classes: StyleUpdate['classes'],
  graph: FlowGraph,
) => {
  interface ClassInfo {
    element: JSXElementNode
    className: string
  }
  type TreeLike<T> = {
    children: TreeLike<T>[]
  } & T
  const classesWithElements: ClassInfo[] = classes.map((classInfo) => ({
    className: classInfo.className,
    element:
      getJSXElementFromLevels(
        classInfo.componentId,
        classInfo.childIndex,
        graph,
      ) ??
      (() => {
        throw new Error('Element not found')
      })(),
  }))
  const findDescendant = (
    tree: TreeLike<ClassInfo>[],
    element: JSXElementNode,
  ): TreeLike<ClassInfo> | undefined => {
    for (const info of tree) {
      const found = findDescendant(info.children, element)
      if (found) return found

      if (element.isDescendantOf(info.element)) return info
    }

    return undefined
  }

  const elementTree: TreeLike<ClassInfo>[] = []
  classesWithElements.forEach((classInfo) => {
    const parent = findDescendant(elementTree, classInfo.element)
    if (parent) {
      parent.children.push({ children: [], ...classInfo })
    } else {
      elementTree.push({ ...classInfo, children: [] })
    }
  })

  const newGraph = getGraph({
    file: 'file',
    code: `
      export const App = () => <div id="root"></div>
    `,
    importMappings: {},
  })
  const rootElement = newGraph.getNodes().find(isJSXElement)
  if (!rootElement) throw new Error('What happened here')

  const allElements: JSXElementNode[] = []
  const addElements = (
    tree: TreeLike<ClassInfo>[],
    parentElement: JSXElementNode,
  ) => {
    tree.forEach(({ element, className, children }, i) => {
      allElements.push(element)
      const newElement = getElementInstanceNodes<JSXElementNode>(
        'file',
        getInstanceFromElement(element.getName(), className),
        graph.importMappings,
      )
      const el = newGraph.addChildElement(
        newElement,
        element.id,
        0,
        i,
        parentElement,
      )
      addElements(children, el)
    })
  }
  addElements(elementTree, rootElement)
  const snippet = rootElement
    .getJSXChildren()
    .map((child) => getSnippetFromNode(child.node))
    .join('\n')

  return { snippet, elements: allElements }
}

const transformCSSAnimationsToTailwind = async (
  _css: string,
): Promise<TransformedTailwindConfig> => {
  return generateTailwindAnimations(_css)
}

const transformCSSToTailwind = async (
  css: string,
  elements: string,
): Promise<string> => {
  return refactorTailwindClasses(css, elements)
}
