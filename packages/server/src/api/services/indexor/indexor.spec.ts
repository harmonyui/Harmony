import { describe, it, expect } from 'vitest'
import * as t from '@babel/types'
import type {
  ElementNode,
  HarmonyComponent,
  HarmonyContainingComponent,
} from './types'
import { getCodeInfoAndNormalizeFromFiles } from './indexor'
import { getCodeInfoFromFile, getPropertyValue, getPropertyValues } from './ast'

describe('indexor', () => {
  const expectLocationOfString = (
    file: TestFile,
    actualLocation: { start: number; end: number },
    expectedString: string,
  ): void => {
    const content = testCases[file]
    const substr = content.substring(actualLocation.start, actualLocation.end)
    expect(substr).toBe(expectedString)
  }
  describe('getCodeInfoFromFile', () => {
    it('Should index dynamic text with multiple children properly', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(10)
      expect(componentElements[1].name).toBe('p')

      const textAttributes = componentElements[1].attributes.filter(
        (a) => a.name === 'children',
      )
      expect(textAttributes.length).toBe(2)
      expect(textAttributes[0].properties.length).toBe(1)
      expect(textAttributes[0].properties[0].name).toBe('label')
      expectLocationOfString(file, textAttributes[0].location, 'label')
      expect(textAttributes[1].properties.length).toBe(1)
      expect(textAttributes[1].properties[0].name).toBe('undefined')
    })

    it('Should index attributes properly', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(10)

      expect(componentElements[0].name).toBe('div')
      expect(componentElements[0].attributes.length).toBe(1)
      expect(componentElements[0].attributes[0].name).toBe('className')
      expect(componentElements[0].attributes[0].properties.length).toBe(2)
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[0].location,
        '"flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"',
      )
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[1].location,
        'className',
      )

      expect(componentElements[0].next.length).toBe(3)
      expect(componentElements[0].prev.length).toBe(0)
      expect(componentElements[0].next[0]).toBe(componentElements[5])
      expect(componentElements[0].attributes[0].next.length).toBe(3)
      expect(componentElements[0].attributes[0].next[0]).toBe(
        componentElements[5].attributes[0],
      )
      expect(componentElements[0].attributes[0].properties[1].next[0]).toBe(
        componentElements[0].parent.props[3],
      )
      expect(
        componentElements[0].attributes[0].properties[1].next[0].next[0],
      ).toBe(componentElements[5].attributes[0].properties[0])

      expect(componentElements[5].name).toBe('StatCard')
      expect(componentElements[5].attributes.length).toBe(5)

      //static classes look like this (StatCard #1)
      expect(componentElements[5].attributes[0].name).toBe('className')
      expect(
        t.isStringLiteral(
          componentElements[5].attributes[0].properties[0].node,
        ),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[5].attributes[0].properties[0].location,
        '"bg-gray-50"',
      )

      expect(componentElements[7].attributes.length).toBe(5)
      expect(componentElements[7].attributes[0].name).toBe('className')
      expect(componentElements[7].attributes[0].properties.length).toBe(3)

      expect(
        getPropertyValue(componentElements[7].attributes[0].properties[0])[0],
      ).toBe('text-sm')
      expectLocationOfString(
        file,
        componentElements[7].attributes[0].properties[0].location,
        '"text-sm"',
      )

      expect(componentElements[7].attributes[0].properties[1].name).toBe(
        'variant',
      )
      expect(
        getPropertyValue(componentElements[7].attributes[0].properties[1])[0],
      ).toBe('bg-blue-50')
      expectLocationOfString(
        file,
        componentElements[7].attributes[0].properties[1].next[0].location,
        '"bg-blue-50"',
      )

      expect(componentElements[7].attributes[0].properties[2].name).toBe(
        'otherThing',
      )
      expect(
        getPropertyValue(componentElements[7].attributes[0].properties[2])[0],
      ).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[7].attributes[0].properties[2].next[0].location,
        '"flex"',
      )
    })

    it('Should index strings in containers', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(10)
      expect(componentElements[9].name).toBe('StatCard')
      expect(componentElements[9].attributes.length).toBe(5)

      //(StatCard #3)
      expect(componentElements[9].attributes[0].name).toBe('label')
      expect(componentElements[9].attributes[0].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[9].attributes[0].properties[0])[0],
      ).toBe('Responses')
      expectLocationOfString(
        file,
        componentElements[9].attributes[0].properties[0].location,
        '"Responses"',
      )
    })

    it('Can find the property in a call and template literal expression', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/harderDyanmic.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(2)
      expect(componentElements[0].name).toBe('div')
      expect(componentElements[0].attributes.length).toBe(1)
      expect(componentElements[1].name).toBe('Button')
      expect(componentElements[1].attributes.length).toBe(2)

      //div #1
      expect(componentElements[0].attributes[0].name).toBe('className')
      expect(componentElements[0].attributes[0].properties.length).toBe(2)
      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[0]),
      ).toBe(['flex'])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[0].location,
        '"flex"',
      )

      expect(componentElements[0].attributes[0].properties[1].name).toBe(
        'className',
      )
      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[1]),
      ).toBe([])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[1].location,
        'className',
      )

      //div #2
      expect(componentElements[1].attributes[0].name).toBe('className')
      expect(componentElements[1].attributes[0].properties.length).toBe(2)
      expect(
        getPropertyValues(componentElements[1].attributes[0].properties),
      ).toBe(['bg-gray-900 ', 'text-sm'])
      expectLocationOfString(
        file,
        componentElements[1].attributes[0].properties[0].location,
        'bg-gray-900 ',
      )
      expectLocationOfString(
        file,
        componentElements[1].attributes[0].properties[1].location,
        'variant',
      )
      expectLocationOfString(
        file,
        componentElements[1].attributes[0].properties[1].next[0].location,
        '"text-sm"',
      )
    })

    it('Should index component with multiple text broken up', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/text_stuff.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(10)
      expect(componentElements[3].attributes.length).toBe(4)
      const textAttributes = componentElements[3].attributes.filter(
        (attr) => attr.name === 'children',
      )
      expect(textAttributes.length).toBe(3)
      expect(getPropertyValue(textAttributes[0])[0].trim()).toBe(
        'The ALS Crowd',
      )
      expect(textAttributes[0].index).toBe(0)

      expect(getPropertyValue(textAttributes[0])[1].trim()).toBe('Community')
      expect(textAttributes[1].index).toBe(1)
      expectLocationOfString(file, textAttributes[1].location, 'Community')

      expect(getPropertyValue(textAttributes[0])[2].trim()).toBe('Directory')
      expect(textAttributes[2].index).toBe(2)
    })

    it('Should connect to correct parent attributes', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements[6].props.length).toBe(3)
      expect(componentElements[6].getParent()).toBe(componentElements[5])
      expect(componentElements[6].props[0].type).toBe('className')
      expect(componentElements[6].props[0].name).toBe('string')
      expect(componentElements[6].props[0].value).toBe(
        'flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm',
      )
      expectLocationOfString(
        file,
        componentElements[6].props[0].location,
        '"flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"',
      )

      expect(componentElements[6].props[1].type).toBe('className')
      expect(componentElements[6].props[1].name).toBe('string')
      expect(componentElements[6].props[1].value).toBe('bg-gray-50')
      expectLocationOfString(
        file,
        componentElements[6].props[1].location,
        '"bg-gray-50"',
      )
      expect(componentElements[6].props[1].reference).toBe(componentElements[5])

      expect(componentElements[7].props.length).toBe(4)
      expect(componentElements[7].getParent()).toBe(componentElements[5])
      expect(componentElements[7].props[0].type).toBe('text')
      expect(componentElements[7].props[0].name).toBe('string')
      expect(componentElements[7].props[0].value).toBe('Displays')
      expect(componentElements[7].props[0].index).toBe(0)
      expectLocationOfString(
        file,
        componentElements[7].props[0].location,
        '"Displays"',
      )
      expect(componentElements[7].props[0].reference).toBe(componentElements[5])

      expect(componentElements[12].props.length).toBe(5)
      expect(componentElements[12].getParent()).toBe(componentElements[11])
      expect(componentElements[12].props[1].type).toBe('className')
      expect(componentElements[12].props[1].name).toBe('string')
      expect(componentElements[12].props[1].value).toBe('text-sm')
      expectLocationOfString(
        file,
        componentElements[12].props[1].location,
        '"text-sm"',
      )

      expect(componentElements[12].props.length).toBe(5)
      expect(componentElements[12].props[2].type).toBe('className')
      expect(componentElements[12].props[2].name).toBe('string')
      expect(componentElements[12].props[2].value).toBe('bg-blue-50')
      expectLocationOfString(
        file,
        componentElements[12].props[2].location,
        '"bg-blue-50"',
      )

      expect(componentElements[12].props.length).toBe(5)
      expect(componentElements[12].props[3].type).toBe('className')
      expect(componentElements[12].props[3].name).toBe('string')
      expect(componentElements[12].props[3].value).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[12].props[3].location,
        '"flex"',
      )
    })

    it('Should handle multiple layers of parents', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/multipleLayers1.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(5)

      //Layer 1 div
      expect(componentElements[2].attributes.length).toBe(1)
      expect(componentElements[2].attributes[0].name).toBe('className')
      expect(componentElements[2].attributes[0].properties.length).toBe(2)
      expect(
        getPropertyValue(componentElements[2].attributes[0].properties[0]),
      ).toBe(['m-2', 'p-3', 'm-3'])
      expect(componentElements[2].next.length).toBe(2)
      expect(componentElements[2].next[0]).toBe(componentElements[0])
      expect(componentElements[2].next[1]).toBe(componentElements[1])

      //Layer 2 Component1
      expect(componentElements[0].attributes.length).toBe(1)
      expect(componentElements[0].attributes[0].name).toBe('className')
      expect(componentElements[0].attributes[0].properties.length).toBe(2)
      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[0]),
      ).toBe(['m-2', 'p-3'])
      expect(componentElements[0].prev.length).toBe(2)
      expect(componentElements[0].prev[0]).toBe(componentElements[2])
      expect(componentElements[0].prev[1]).toBe(componentElements[3])
      expect(componentElements[0].next.length).toBe(1)
      expect(componentElements[0].next[0]).toBe(componentElements[4])

      //Layer 2 Component2
      expect(componentElements[4].attributes.length).toBe(1)
      expect(componentElements[4].attributes[0].name).toBe('className')
      expect(componentElements[4].next.length).toBe(0)
      expect(componentElements[4].prev.length).toBe(2)
      expect(componentElements[4].prev[0]).toBe(componentElements[0])
      expect(componentElements[4].prev[1]).toBe(componentElements[1])

      //Layer 1 h1
      expect(componentElements[3].attributes.length).toBe(2)
      expect(componentElements[3].attributes[1].name).toBe('children')
      expect(componentElements[3].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[3].attributes[1].properties[0]),
      ).toBe(['Hello there'])
    })

    it('Should handle inner classNames', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/innerClassName.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(4)

      expect(componentElements[1].attributes.length).toBe(2)
      expect(componentElements[1].attributes[0].name).toBe('className')
      expect(componentElements[1].attributes[0].properties.length).toBe(1)
      expect(
        componentElements[1].attributes[0].properties[0].next[0].next[0],
      ).toBe(componentElements[2].attributes[1].properties[0])
      expect(
        getPropertyValue(componentElements[1].attributes[0].properties[0]),
      ).toBe(['bg-primary'])

      expect(componentElements[1].attributes[1].name).toBe('children')
      expect(componentElements[1].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[1].attributes[1].properties[0]),
      ).toBe(['Hello'])

      expectLocationOfString(
        file,
        componentElements[2].attributes[1].properties[0].location,
        'innerClass',
      )
      expect(
        componentElements[2].attributes[1].properties[0].next[0].next[0],
      ).toBe(componentElements[3].attributes[0].properties[0])
    })

    it('Should handle object properties', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/objectProperties.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(4)

      //div -> layer 1
      expect(componentElements[0].attributes.length).toBe(1)
      expect(componentElements[0].attributes[0].name).toBe('className')
      expect(componentElements[0].attributes[0].properties.length).toBe(3)
      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[0]),
      ).toBe(['flex'])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[0].location,
        '"flex"',
      )

      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[1]),
      ).toBe(['bg-white'])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[1].next[0].location,
        '"bg-white"',
      )

      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[2]),
      ).toBe(['bg-blue-50'])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[2].next[0].next[0]
          .location,
        '"bg-blue-50"',
      )

      //h1 -> layer 1
      expect(componentElements[1].attributes.length).toBe(2)
      expect(componentElements[1].attributes[0].name).toBe('className')
      expect(componentElements[1].attributes[0].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[1].attributes[0].properties[0]),
      ).toBe(['text-lg'])
      expectLocationOfString(
        file,
        componentElements[1].attributes[0].properties[0].location,
        'classes[headerId]',
      )
      expectLocationOfString(
        file,
        componentElements[1].attributes[0].properties[0].next[0].location,
        '"text-lg"',
      )

      expect(componentElements[1].attributes[1].name).toBe('children')
      expect(componentElements[1].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[1].attributes[1].properties[0]),
      ).toBe(['Hello there'])
      expectLocationOfString(
        file,
        componentElements[1].attributes[1].properties[0].location,
        'props.label',
      )
      expectLocationOfString(
        file,
        componentElements[1].attributes[1].properties[0].next[0].location,
        '"Hello there"',
      )

      //h2
      expect(componentElements[2].attributes.length).toBe(2)
      expect(componentElements[2].attributes[1].name).toBe('children')
      expect(componentElements[2].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[2].attributes[1].properties[0]),
      ).toBe(['Yes'])
      expectLocationOfString(
        file,
        componentElements[2].attributes[1].properties[0].location,
        'anotherLabel',
      )
      expectLocationOfString(
        file,
        componentElements[2].attributes[1].properties[0].next[0].location,
        '"Yes"',
      )

      expect(componentElements[2].attributes.length).toBe(2)
      expect(componentElements[2].attributes[0].name).toBe('className')
      expect(componentElements[2].attributes[0].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[2].attributes[0].properties[0]),
      ).toBe(['flex'])
      expectLocationOfString(
        file,
        componentElements[2].attributes[0].properties[0].next[0].location,
        '"flex"',
      )
    })

    it('Should be able to handle complex dynamic instances', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/complexDynamicCases.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()

      //Comp
      expect(componentElements[0].attributes.length).toBe(3)
      expect(componentElements[0].attributes[0].name).toBe('className')
      expect(componentElements[0].attributes[0].properties.length).toBe(3)
      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[0]),
      ).toBe(['outline'])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[0].next[0].next[0]
          .location,
        '"outline"',
      )

      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[2]),
      ).toBe(['bg-sky-50'])
      expectLocationOfString(
        file,
        componentElements[0].attributes[0].properties[2].next[0].next[0].next[0]
          .location,
        '"bg-sky-50"',
      )

      expect(componentElements[0].attributes[2].name).toBe('children')
      expect(componentElements[0].attributes[2].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[0].attributes[2].properties[0]),
      ).toBe('This is a child')
      expect(componentElements[0].attributes[2].index).toBe(0)
      expectLocationOfString(
        file,
        componentElements[0].attributes[2].next[0].location,
        'This is a child',
      )

      //ScrollView
      expect(componentElements[4].attributes.length).toBe(4)
      expect(componentElements[4].attributes[2].name).toBe('id')
      expect(componentElements[4].attributes[2].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[4].attributes[2].properties[0]),
      ).toBe([])
      expectLocationOfString(
        file,
        componentElements[4].attributes[2].properties[0].next[0].location,
        '_params',
      )

      //div -> ScrollView
      expect(componentElements[2].attributes.length).toBe(1)
      expect(componentElements[2].attributes[2].name).toBe('className')
      expect(componentElements[2].attributes[2].properties.length).toBe(4)
      expect(
        getPropertyValue(componentElements[2].attributes[2].properties[2]),
      ).toBe(['flex'])
      expectLocationOfString(
        file,
        componentElements[2].attributes[2].properties[2].next[0].next[0].next[0]
          .location,
        '"flex"',
      )

      expect(componentElements[2].attributes[2].properties[3]).toBe(
        'dark:hover:text-sm',
      )
      expectLocationOfString(
        file,
        componentElements[2].attributes[2].properties[3].next[0].location,
        '"dark:hover:text-sm"',
      )

      expect(componentElements[3].attributes.length).toBe(2)
      expect(componentElements[3].attributes[0].name).toBe('className')
      expect(componentElements[3].attributes[0].properties.length).toBe(4)
      expect(
        getPropertyValue(componentElements[3].attributes[0].properties[2]),
      ).toBe(['styles'])
      expectLocationOfString(
        file,
        componentElements[3].attributes[0].properties[2].next[0].next[0].next[0]
          .location,
        '"styles"',
      )

      expect(componentElements[3].attributes[1].name).toBe('children')
      expect(componentElements[3].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[3].attributes[1].properties[0]),
      ).toBe(['Hello'])
      expectLocationOfString(
        file,
        componentElements[3].attributes[1].properties[0].next[0].next[0].next[0]
          .location,
        '"Hello"',
      )
    })

    //TODO: Figure out variants
    // it("Should not include classNames that are params and don't have 'class' in the name of the property", () => {
    //   const componentElements: HarmonyComponent[] = []
    //   const componentDefinitions: Record<string, HarmonyContainingComponent> =
    //     {}
    //   const file: TestFile = 'app/classNameTests.tsx'
    //   const content = testCases[file]

    //   const result = getCodeInfoFromFile(
    //     file,
    //     content,
    //     componentDefinitions,
    //     componentElements,
    //     {},
    //   )
    //   expect(result).toBeTruthy()
    //   expect(componentElements.length).toBe(8)

    //   expect(componentElements[0].props.length).toBe(4)
    //   expect(componentElements[0].props[0].type).toBe('property')
    //   expect(componentElements[0].props[0].name).toBe('property')
    //   expect(componentElements[0].props[0].value).toBe('variant:variant')
    //   expect(componentElements[0].props[0].locationType).toBe('props')
    //   expectLocationOfString(
    //     file,
    //     componentElements[0].props[0].location,
    //     'variant',
    //   )
    //   expect(componentElements[0].props[2].type).toBe('className')
    //   expect(componentElements[0].props[2].name).toBe('property')
    //   expect(componentElements[0].props[2].value).toBe(
    //     'buttonClass:buttonClass',
    //   )
    //   expect(componentElements[0].props[2].locationType).toBe('props')
    //   expectLocationOfString(
    //     file,
    //     componentElements[0].props[2].location,
    //     'buttonClass',
    //   )

    //   expect(componentElements[4].props.length).toBe(8)
    //   expect(componentElements[4].props[0].type).toBe('property')
    //   expect(componentElements[4].props[0].name).toBe('string')
    //   expect(componentElements[4].props[0].value).toBe('variant:secondary')
    //   expect(componentElements[4].props[0].locationType).toBe('component')
    //   expectLocationOfString(
    //     file,
    //     componentElements[4].props[0].location,
    //     '"secondary"',
    //   )
    //   expect(componentElements[4].props[4].type).toBe('className')
    //   expect(componentElements[4].props[4].name).toBe('string')
    //   expect(componentElements[4].props[4].value).toBe('border')
    //   expect(componentElements[4].props[4].locationType).toBe('component')
    //   expectLocationOfString(
    //     file,
    //     componentElements[4].props[4].location,
    //     '"border"',
    //   )
    // })

    it('Should add className to element if has props className', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/classNameTests.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(6)

      //h1
      expect(componentElements[2].attributes.length).toBe(2)
      expect(componentElements[2].attributes[0].name).toBe('className')
      expect(componentElements[2].attributes[0].properties.length).toBe(0)
      expect(
        t.isJSXOpeningElement(componentElements[2].attributes[0].node),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[2].attributes[0].location,
        '<h1>',
      )

      expect(componentElements[4].attributes.length).toBe(2)
      expect(componentElements[4].attributes[1].name).toBe('buttonClass')
      expect(componentElements[4].attributes[1].properties.length).toBe(1)
      expect(
        t.isJSXOpeningElement(componentElements[4].attributes[1].node),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[4].attributes[1].location,
        '<Button size="lg">',
      )
    })

    it('Text should have the correct index', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/classNameTests.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(6)

      //Text child should have the correct index
      expect(componentElements[0].attributes.length).toBe(2)
      expect(componentElements[0].attributes[1].name).toBe('children')
      expect(componentElements[0].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(
          componentElements[0].attributes[1].properties[0],
        )[0].trim(),
      ).toBe("You're welcome")
      expect(componentElements[0].attributes[1].index).toBe(1)
    })

    it('Should keep parent index of text element', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/complexText.tsx'
      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(12)

      expect(componentElements[0].attributes.length).toBe(2)
      expect(componentElements[0].attributes[1].name).toBe('children')
      expect(componentElements[0].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[0].attributes[1].properties[0])[0],
      ).toContain('Filter')
      expect(componentElements[0].attributes[1].index).toBe(1)

      //Complex Component div
      expect(componentElements[8].attributes.length).toBe(2)
      expect(componentElements[8].attributes[1].name).toBe('children')
      expect(componentElements[8].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[8].attributes[1].properties[0])[0],
      ).toContain('Hello')
      expect(componentElements[8].attributes[1].index).toBe(2)
    })

    it('Should give the parent a classname when given a spread parameter', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/complexText.tsx'

      const content = testCases[file]

      const result = getCodeInfoFromFile(
        file,
        content,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      expect(componentElements.length).toBe(12)

      //Spread -> h1
      expect(componentElements[1].attributes.length).toBe(2)
      expect(componentElements[1].attributes[1].name).toBe('className')
      expect(componentElements[1].attributes[1].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[1].attributes[1].properties[0]),
      ).toBe(['border-1'])
      expect(
        t.isJSXOpeningElement(componentElements[1].attributes[1].node),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[1].attributes[1].location,
        '<h1 {...rest}>',
      )

      expect(componentElements[0].attributes[0].name).toBe('text')
      expect(componentElements[0].attributes[0].properties.length).toBe(1)
      expect(
        getPropertyValue(componentElements[0].attributes[0].properties[0]),
      ).toBe(['This is a spread: label::'])
    })

    //TODO: Finish this
    it('Should handle imports from various files', () => {
      const componentElements: ElementNode[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file1: TestFile = 'app/multipleLayers1.tsx'
      const content1 = testCases[file1]

      const result1 = getCodeInfoFromFile(
        file1,
        content1,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result1).toBeTruthy()

      const file2: TestFile = 'app/multipleLayers2.tsx'
      const content2 = testCases[file2]

      const result2 = getCodeInfoFromFile(
        file2,
        content2,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result2).toBeTruthy()
    })
  })

  describe('getCodeInfoAndNormalizeFromFiles', () => {
    it('Should index dynamic text with multiple children properly', () => {
      const componentElements: HarmonyComponent[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getCodeInfoAndNormalizeFromFiles(
        [{ file, content }],
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      if (!result) return

      const parentIds = [
        'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NDU6ODo1MToxMA==',
        'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NTI6ODo1ODoxMA==',
        'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NTk6ODo2NDoxMA==',
      ]

      const pTags = result.filter(
        (r) =>
          r.id.includes('YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6Mjc6NDozMjo4') &&
          r.getParent(),
      )
      expect(pTags.length).toBe(parentIds.length)
      for (let i = 0; i < parentIds.length; i++) {
        const parentId = parentIds[i]
        const pTag = pTags[i]
        const pTagParentId = pTag.id.split('#')[0]
        expect(pTagParentId).toBe(parentId)
        const parents = result.filter((r) => r.id === parentId)
        expect(parents.length).toBe(1)
        const parent = parents[0]

        const textAttributes = pTag.props.filter((attr) => attr.type === 'text')
        expect(textAttributes.length).toBe(3)
        const textAttribute = textAttributes[0]

        expect(textAttribute.name).toBe('string')
        expect('id' in textAttribute.reference).toBe(true)
        if (!('id' in textAttribute.reference)) return
        expect(textAttribute.reference.id).toBe(parent.id)
        //expect(textAttribute.reference.parentId).toBe(parent.parentId);
      }
    })

    it('Should index and normalize across files', () => {
      const componentElements: HarmonyComponent[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const contents: { file: TestFile; content: string }[] = [
        {
          file: 'app/multipleLayers1.tsx',
          content: testCases['app/multipleLayers1.tsx'],
        },
        {
          file: 'app/multipleLayers2.tsx',
          content: testCases['app/multipleLayers2.tsx'],
        },
      ]

      const result = getCodeInfoAndNormalizeFromFiles(
        contents,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      if (!result) return

      expect(result.length).toBe(30)
      expect(componentElements[16].props.length).toBe(5)
      expect(componentElements[16].props[1].type).toBe('className')
      expect(componentElements[16].props[1].name).toBe('string')
      expect(componentElements[16].props[1].value).toBe('bg-white')
      expectLocationOfString(
        'app/multipleLayers2.tsx',
        componentElements[16].props[1].location,
        '"bg-white"',
      )
      expect(componentElements[16].props[1].reference.id).toBe(
        componentElements[16].getParent()?.id,
      )

      expect(componentElements[16].props[2].type).toBe('className')
      expect(componentElements[16].props[2].reference.id).toBe(
        componentElements[16].id,
      )

      expect(componentElements[16].props[3].type).toBe('property')
      expect(componentElements[16].props[3].name).toBe('string')
      expect(componentElements[16].props[3].value).toBe('label:A Name')
      expectLocationOfString(
        'app/multipleLayers2.tsx',
        componentElements[16].props[3].location,
        '"A Name"',
      )

      expect(componentElements[18].props.length).toBe(4)
      expect(componentElements[18].props[0].type).toBe('text')
      expect(componentElements[18].props[0].name).toBe('string')
      expect(componentElements[18].props[0].value).toBe('A Name')
      expectLocationOfString(
        'app/multipleLayers2.tsx',
        componentElements[18].props[0].location,
        '"A Name"',
      )
    })

    it('Should index and normalize across files reverse', () => {
      const componentElements: HarmonyComponent[] = []
      const componentDefinitions: Record<string, HarmonyContainingComponent> =
        {}
      const contents: { file: TestFile; content: string }[] = [
        {
          file: 'app/multipleLayers2.tsx',
          content: testCases['app/multipleLayers2.tsx'],
        },
        {
          file: 'app/multipleLayers1.tsx',
          content: testCases['app/multipleLayers1.tsx'],
        },
      ]

      const result = getCodeInfoAndNormalizeFromFiles(
        contents,
        componentDefinitions,
        componentElements,
        {},
      )
      expect(result).toBeTruthy()
      if (!result) return

      expect(result.length).toBe(30)
    })
  })
})

const testCases = {
  'app/SummaryMetadata.tsx': `import React from "react";

import { cn } from "@formbricks/lib/cn";
import { TSurveySummary } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";

interface SummaryMetadataProps {
    survey: TSurvey;
    setShowDropOffs: React.Dispatch<React.SetStateAction<boolean>>;
    showDropOffs: boolean;
    surveySummary: TSurveySummary["meta"];
    className?: string;
}

const StatCard: React.FunctionComponent<{
    label: string;
    percentage: string;
    value: React.ReactNode;
    tooltipText: string;
    className?: string;
}> = ({ label, percentage, value, className }) => (
    <div
    className={cn(
        "flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm",
        className
    )}>
    <p className="flex text-sm text-slate-600">
        {label}
        {percentage && percentage !== "NaN%" && (
        <span className="ml-1 rounded-xl bg-slate-100 px-2 py-1 text-xs">{percentage}</span>
        )}
    </p>
    <p className="px-0.5 text-2xl font-bold text-slate-800">{value}</p>
    </div>
);

export default function SummaryMetadata({ surveySummary, className }: SummaryMetadataProps) {
    const { completedPercentage, completedResponses, displayCount, startsPercentage, totalResponses } =
    surveySummary;

    const variant = "bg-blue-50";
    const otherThing = "flex";
    return (
    <div className={cn("flex flex-col-reverse gap-y-2 py-4 lg:flex-row lg:gap-x-2", className)}>
        <StatCard
        className="bg-gray-50"
        label="Displays"
        percentage="100%"
        value={displayCount === 0 ? <span>-</span> : displayCount}
        tooltipText="Number of times the survey has been viewed."
        />
        <StatCard
        className={cn("text-sm", variant, otherThing)}
        label="Starts"
        percentage={\`\${Math.round(startsPercentage)}%\`}
        value={totalResponses === 0 ? <span>-</span> : totalResponses}
        tooltipText="Number of times the survey has been started."
        />
        <StatCard
        label={"Responses"}
        percentage={\`\${Math.round(completedPercentage)}%\`}
        value={completedResponses === 0 ? <span>-</span> : completedResponses}
        tooltipText="Number of times the survey has been completed."
        />
    </div>
    );
}
    `,
  'app/harderDyanmic.tsx': `
        const App = ({className}) => {
            const variant = "text-sm";
            return (
                <div className={cn("flex", className)}>
                    <Button className={\`bg-gray-900 \${variant}\`} children="Hello there"/>
                </div>
            )
        }
    `,
  'app/text_stuff.tsx': `
    import HomepageMap from "@/components/shared/HomepageMap";

    export default function HomepageSaasLanding() {
        return (
            <div className="max-w-[95%] mx-auto">
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 pl-4 md:pl-16">
                        <div className="text-5xl md:text-7xl !important leading-[1.15] text-center md:text-left">
                            The ALSCrowd<br />Community<br />Directory
                        </div>
                        <div className="text-xl md:text-4xl leading-[1.15] mt-4 md:mt-8 text-center md:text-left">
                            A central directory for the ALS community.
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 mt-8 md:mt-0 ml-auto mr-auto flex justify-center">
                        <HomepageMap />
                    </div>
                </div>
                <div className="text-2xl md:text-4xl leading-[1.15] mt-12 md:mt-20 text-center">
                    Find, compare, and connect with organizations, clinics, and resources near you!
                </div>
            </div>
    
        );
    
    }`,
  'app/multipleLayers1.tsx': `
    const Component2 = ({className, name}) => {
        const bob = name;
        return (<>
            <Component1 className={cn("m-2", className)} label={bob}/>
            <Component1 className="m-3" label="bob"/>
        </>)
    }

    function Component1({className, label}) {
        const thisMightMessThingsUp = () => true;
        return (
            <div className={cn(className, "bg-blue-50 flex flex-col")}>
                <h1>{label}</h1>
            </div>
        )
    } 

    const Component3 = () => {
        const anotherOne = "Hello there";
        return (
            <Component2 className={\`p-3\`} name={\`\${anotherOne}\`}/>
        )
    }

    export default Component2
    `,
  'app/multipleLayers2.tsx': `
    import Component2 from './app/multipleLayers2.tsx';

    const App = () => {
        return (
            <Component2 className="bg-white" name="A Name"/>
        )
    }

    const App2 = () => {
        return (
            <Component3 />
        )
    }
    `,
  'app/innerClassName.tsx': `
    const InnerComponent = ({className, buttonClassName}) => {
        return <div className={\`flex flex-col bg-white \${className}\`}>
            <button className={buttonClassName}>Hello</button>
        </div>
    }

    const InnerComponent2 = ({innerClass}) => {
        return <InnerComponent className={"text-sm"} buttonClassName={innerClass}/>
    }

    const MainComponent = () => {
        return <InnerComponent2 innerClass={"bg-primary"}/>
    }
    `,
  'app/objectProperties.tsx': `
    const JourneyCard = (props) => {
        const {className, other} = props;
        const container = "this might mess things up";
        const classesActual = {
            header: "text-lg",
            container: "bg-white",
            otherClass: "flex",
            idThing: 'header',
        }
        const classes = {
            header: classesActual.header,
            container: classesActual.container
        }
        const {otherClass} = classesActual;
        const headerId = classesActual.idThing;
        const labelId = "label";
        const {[labelId]: anotherLabel} = {
            label: "Yes"
        }
        return <div className={cn("flex", classes.container, buttonVariants({className}))}>
            <h1 className={classes[headerId]}>{props.label}</h1>
            <h2 className={otherClass}>{anotherLabel}</h2>
        </div>
    }

    const App = () => {
        return (
            <JourneyCard className="bg-blue-50" label="Hello there"/>
        )
    }
    `,
  'app/complexDynamicCases.tsx': `
    import * as React from "react"
    import { Slot } from "@radix-ui/react-slot"
    import { cva, type VariantProps } from "class-variance-authority"
    import styles from './scroll-view.module.css'

    import { cn } from "@/lib/utils"

    const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:!shadow-none",
    {
        variants: {
        variant: {
            default:
            "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive:
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline:
            "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary:
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            xl: "h-12 text-md rounded-md px-8",
            icon: "h-9 w-9",
        },
        },
        defaultVariants: {
        variant: "default",
        size: "default",
        },
    }
    )

    export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
    }

    const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        const _className = className;
        return (
        <Comp
            className={cn(buttonVariants({ variant, size, _className }))}
            ref={ref}
            {...props}
        />
        )
    }
    )
    Button.displayName = "Button"

    export { Button, buttonVariants }

    const ButtonInstance = () => {
        return (<Button className="bg-sky-50" variant="outline">This is a child</Button>)
    }

    type Props = {
        className?: string
        contentClass?: string
        children: React.ReactNode
    }

    export function ScrollView({ children, className, contentClass }: Props) {
        const classStyles = \`\${styles.ScrollView} \${className ?? "dark:hover:text-sm"}\`
        const contentStyles = \`\${styles.Content} \${contentClass ?? ''}\`

        return (
            <div className={classStyles}>
                <div className={contentStyles}>{children}</div>
            </div>
        )
    }

    const ScrollViewInstance = ({params: _params}) => {
        const child = "Hello"
        const id = _params.id;
        const params = 'hello';
        return (
            <ScrollView className="flex" contentClass={"styles"} id={_params.id}>{child}</ScrollView>
        )
    }

    `,
  'app/classNameTests.tsx': `
    import {cva} from 'class-variant-authority';
    import {cn} from 'merger';

    const buttonVariants = cva(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:!shadow-none",
        {
          variants: {
            variant: {
              default:
                "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              destructive:
                "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
              outline:
                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
              secondary:
                "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
              ghost: "hover:bg-accent hover:text-accent-foreground",
              link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
              default: "h-9 px-4 py-2",
              sm: "h-8 rounded-md px-3 text-xs",
              lg: "h-10 rounded-md px-8",
              xl: "h-12 text-md rounded-md px-8",
              icon: "h-9 w-9",
            },
          },
          defaultVariants: {
            variant: "default",
            size: "default",
          },
        }
      )

    const Button = ({ buttonClass, variant, size, asChild = false, ...props }) => {
        const Comp = asChild ? Slot : "button"
        return (
          <Comp
            className={cn(buttonVariants({ variant, size, buttonClass }))}
            {...props}
          />
        )
      }


    const App = () => {
        return (
            <div>
                <h1>This is some html</h1>
                <Button variant="secondary" size="sm" buttonClass="border">
                    Thank you
                </Button>
                <Button size="lg">
                    <Icon/> You're welcome
                </Button>
            </div>
        )
    }
    `,
  'app/complexText.tsx': `
    const Component = ({children}) => {
        return (
            <div>{children}</div>
        )
    }

    const SpreadComponent = ({label, ...rest}) => {
        return <h1 {...rest}>{label}</h1>
    }

   const App = () => {
        const spreadLabel = "This is a spread: label::";
        return (<>
            <Component><Icon/> Filter</Component>
            <ComponentComplex><Icon/> Hello</ComponentComplex>
            <SpreadComponent label="Thank you friend" />
            <SpreadComponent label={spreadLabel} className="border-1"/>
        </>)
    }

    const ComponentComplex = ({children}) => {
        return (
            <div><Icon/> {children}</div>
        )
    }

    const RecursiveComponent = ({label}) => {
        const newLabel = label + 'bob';
        return (
            <div>
                <RecursiveComponent label={newLabel}/>
            </div>
        )
    }
    `,
} as const

type TestFile = keyof typeof testCases
