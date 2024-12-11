import { createUpdate, parseUpdate } from '@harmony/util/src/updates/utils'
import { styleUpdateSchema } from '@harmony/util/src/updates/component'
import type * as t from '@babel/types'
import type { ClassNameValue } from '@harmony/util/src/updates/classname'
import { isObject } from '../../indexor/predicates/simple-predicates'
import type { Node } from '../../indexor/types'
import { getGraph } from '../../indexor/graph'
import type { TransformedTailwindConfig } from '../../../repository/openai'
import { generateTailwindAnimations } from '../../../repository/openai'
import type { UpdateComponent } from './types'
import { updateClassName } from './classname'

export const updateStyle: UpdateComponent = async (info, graph, ...rest) => {
  const { css } = parseUpdate(styleUpdateSchema, info.value)

  const transformInfo = await transformCSSToTailwind(css)

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
      const node = parseText(JSON.stringify(value))
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

const parseText = (text: string): Node<t.Expression> => {
  const graph = getGraph(
    'file',
    `
      export const temp = ${text}
    `,
  )

  return graph.getNodes().filter(isObject)[0] as Node<t.Expression>
}

const transformCSSToTailwind = async (
  _css: string,
): Promise<TransformedTailwindConfig> => {
  return generateTailwindAnimations(_css)
}
