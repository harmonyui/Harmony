import { TailwindConverter } from 'css-to-tailwindcss'
import { camelToKebab } from '@harmony/util/src/utils/common'

//These css names should not have calculated formatted values
export const nonFormattedCSS = ['borderColor', 'backgroundImage']

export const converter = (tailwindConfig: string) =>
  new TailwindConverter({
    remInPx: 16, // set null if you don't want to convert rem to pixels
    //postCSSPlugins: [], // add any postcss plugins to this array
    tailwindConfig: {
      // your tailwind config here
      content: [],
      theme: {
        extend: JSON.parse(tailwindConfig),
      },
    },
  })

export const convertCSSToTailwind = async (
  propertyName: string,
  value: string,
  formattedValue: string,
  tailwindConfig: string,
): Promise<string> => {
  // This converter has a bug where border color does not work
  if (propertyName === 'borderColor') {
    const classes = await convertToCSSProperty('color', value, tailwindConfig)
    return classes.replace('text', 'border')
    //The converter also has a bug with background images where underscores are escaped
  } else if (propertyName === 'backgroundImage') {
    return `bg-[${value}]`
  }

  return formattedValue
    ? convertToCSSValue(formattedValue, tailwindConfig)
    : convertToCSSProperty(propertyName, value, tailwindConfig)
}

export const convertStyleSheetToTailwind = async (
  css: string,
  tailwindConfig: string,
): Promise<ReturnType<TailwindConverter['convertCSS']>> => {
  return converter(tailwindConfig).convertCSS(css)
}

const convertToCSSProperty = async (
  propertyName: string,
  value: string,
  tailwindConfig: string,
): Promise<string> => {
  return convertToCSSValue(
    `${camelToKebab(propertyName)}: ${value};`,
    tailwindConfig,
  )
}

const convertToCSSValue = async (
  value: string,
  tailwindConfig: string,
): Promise<string> => {
  const converted = await converter(tailwindConfig).convertCSS(`.example {
    ${value}
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
