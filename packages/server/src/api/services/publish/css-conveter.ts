import { TailwindConverter } from 'css-to-tailwindcss'
import { camelToKebab } from '@harmony/util/src/utils/common'

export const converter = new TailwindConverter({
  remInPx: 16, // set null if you don't want to convert rem to pixels
  //postCSSPlugins: [], // add any postcss plugins to this array
  tailwindConfig: {
    // your tailwind config here
    content: [],
    theme: {
      extend: {},
    },
  },
})

export const convertCSSToTailwind = async (
  propertyName: string,
  value: string,
): Promise<string> => {
  // This converter has a bug where border color does not work
  if (propertyName === 'borderColor') {
    const classes = await convertToCSSBase('color', value)
    return classes.replace('text', 'border')
  }

  return convertToCSSBase(propertyName, value)
}

const convertToCSSBase = async (
  propertyName: string,
  value: string,
): Promise<string> => {
  const converted = await converter.convertCSS(`.example {
    ${camelToKebab(propertyName)}: ${value}
}`)
  return converted.nodes.reduce(
    (prev, curr) => prev + curr.tailwindClasses.join(' '),
    '',
  )
}

export function addPrefixToClassName(
  className: string,
  prefix: string,
): string {
  const classes = className.split(' ')
  const listClass: [string, string][] = classes.map((_classes) => {
    if (_classes.includes(':')) {
      const [before, after] = _classes.split(':')
      if (!before || !after) {
        throw new Error(`Invalid class ${_classes}`)
      }
      return [`${before}:`, after]
    } else if (_classes.startsWith('-')) {
      return ['-', _classes.substring(1)]
    }
    return ['', _classes]
  })

  const withPrefix: [string, string][] = listClass.map((_classes) => {
    if (!_classes.includes(prefix)) {
      return [_classes[0], prefix + _classes[1]]
    }
    return _classes
  })

  const final = withPrefix.map((str) => `${str[0]}${str[1]}`).join(' ')

  return final
}
