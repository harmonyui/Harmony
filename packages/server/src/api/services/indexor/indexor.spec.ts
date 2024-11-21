import { describe, it, expect } from 'vitest'
import * as t from '@babel/types'
import { getSnippetFromNode } from '../publish/code-updator'
import type {
  HarmonyComponent,
  HarmonyContainingComponent,
  Node,
} from './types'
import { getCodeInfoAndNormalizeFromFiles } from './indexor'
import type { LiteralNode } from './ast'
import {
  createGraph,
  getCodeInfoFromFile,
  getLiteralValue,
  isLiteralNode,
} from './ast'
import { getGraph } from './graph'
import type { TestFile } from './indexor.test'
import { testCases } from './indexor.test'
import { JSXAttributeNode, JSXElementNode } from './node'

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
    it('should xw', () => {
      const code = `
function Component3({children}) {
  return <div children={children}/>
}
function Component2({label}) {
  return <Component3 children={label} />;
}
function Component1({name}) {
  return <div>
    <Component2 label={name} />
    <Component2 label="bye" />
  </div>
}

function Component0() {
  return <Component1 name="hello" />;
}
`

      const expectedCode = `
function Component3({children}) {
  return <div children={children}/>
}
function Component2({label}) {
  return <Component3 children={label} />;
}
function Component1({name}) {
  return <div>
    <Component2 label={name} />
    <Component2 label="bye" />
  </div>
}

function Component0() {
  return <Component1 name="changed" />;
}
`
      const graph = getGraph(code)

      const attributeFlow = graph.getNodeById('3:14-3:33')
      expect(attributeFlow).toBeTruthy()
      expect(attributeFlow instanceof JSXAttributeNode).toBeTruthy()
      if (!attributeFlow || !(attributeFlow instanceof JSXAttributeNode)) return
      const data = attributeFlow.getDataFlow()
      const literalNode = data[0]
      if (!isLiteralNode(literalNode.node)) expect(true).toBeFalsy()
      graph.changeNodeValue(literalNode as Node<t.StringLiteral>, 'changed')
      graph.saveChanges()
      expect(graph.getCode()).toBe(expectedCode)

      const flow = data.map((node) => getSnippetFromNode(node.node))
      expect(flow.length).toBe(2)
      expect(flow[0]).toBe('"changed"')
      expect(flow[1]).toBe('"bye"')
    })
    it('Should work', () => {
      const graph = createGraph(
        'this is a file',
        `
          const Component0 = ({ className, children }) => {
            return <div className={className}>{children}</div>
          }
          const Component1 = ({ className }) => {
            return <Component0 className={className}>Hello There</Component0>
          }
          const UnlinkComponent1 = () => {
            return <div><Component1/><Component1/></div>
          }
        `,
      )
      graph.connectComponents('Component1', 'Component0')
      graph.connectComponents('UnlinkComponent1', 'Component1')
      graph.unlinkAttribute(
        graph.getComponent('Component1')?.elements[0].id,
        'children',
      )
      const code = graph.getCode()
      const result = `
          const Component0 = ({ className, children }) => {
            return <div className={className}>{children}</div>
          }
          const Component1 = ({ className, children }) => {
            return <Component0 className={className}>{children}</Component0>
          }
          const UnlinkComponent1 = () => {
            return <div><Component1>Hello there</Component1><Component1>Hello there</Component1></div>
          }
        `
      expect(code).toBe(result)
    })
    it('Should index dynamic text with multiple children properly', () => {
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(11)
      expect(componentElements[1].name).toBe('p')

      const textAttributes = componentElements[1]
        .getAttributes()
        .filter((a) => a.name === 'children')
      expect(textAttributes.length).toBe(2)
      const text0ValueNode = textAttributes[0].getValueNode()
      expect(text0ValueNode.name).toBe('label')
      expect(text0ValueNode.type).toBe('Identifier')
      expectLocationOfString(file, textAttributes[0].location, '{label}')
      const text1ValueNode = textAttributes[1].getValueNode()
      expect(text1ValueNode.type).not.toBe('Identifier')
    })

    it('Should index attributes properly', () => {
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(11)
      expect(componentElements[5].name).toBe('StatCard')
      expect(componentElements[5].getAttributes().length).toBe(5)

      //static classes look like this (StatCard #1)
      expect(componentElements[5].getAttributes()[0].name).toBe('className')
      expect(componentElements[5].getAttributes()[0].getValueNode().type).toBe(
        'StringLiteral',
      )
      expect(
        getLiteralValue(
          componentElements[5].getAttributes()[0].getValueNode()
            .node as LiteralNode,
        ),
      ).toBe('bg-gray-50')
      expectLocationOfString(
        file,
        componentElements[5].getAttributes()[0].location,
        'className="bg-gray-50"',
      )

      expect(componentElements[7].getAttributes().length).toBe(5)
      expect(componentElements[7].getAttributes()[0].name).toBe('className')
      expect(
        componentElements[7].getAttributes()[0].getValueNode().type,
      ).not.toBe('string')
      expect(componentElements[7].getAttributes()[0].getDataFlow().length).toBe(
        3,
      )
      expect(
        componentElements[7].getAttributes()[0].getDataFlow()[0].type,
      ).toBe('StringLiteral')
      expect(
        getLiteralValue(
          componentElements[7].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('text-sm')
      expectLocationOfString(
        file,
        componentElements[7].getAttributes()[0].getDataFlow()[0].location,
        '"text-sm"',
      )

      expect(
        componentElements[7].getAttributes()[0].getDataFlow()[1].type,
      ).toBe('StringLiteral')
      expect(
        getLiteralValue(
          componentElements[7].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('bg-blue-50')
      expectLocationOfString(
        file,
        componentElements[7].getAttributes()[0].getDataFlow()[1].location,
        '"bg-blue-50"',
      )

      expect(
        componentElements[7].getAttributes()[0].getDataFlow()[2].type,
      ).toBe('StringLiteral')
      expect(
        getLiteralValue(
          componentElements[7].getAttributes()[0].getDataFlow()[2]
            .node as LiteralNode,
        ),
      ).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[7].getAttributes()[0].getDataFlow()[2].location,
        '"flex"',
      )

      //static properties have value propName:propValue
      expect(componentElements[5].getAttributes()[1].name).toBe('label')
      expect(componentElements[5].getAttributes()[1].getValueNode().type).toBe(
        'StringLiteral',
      )
      expectLocationOfString(
        file,
        componentElements[5].getAttributes()[1].getValueNode().location,
        '"Displays"',
      )

      //dynamic properties look like this
      expect(componentElements[5].getAttributes()[3].name).toBe('value')
      expect(
        componentElements[5].getAttributes()[3].getValueNode().type,
      ).not.toBe('StringLiteral')
      expectLocationOfString(
        file,
        componentElements[5].getAttributes()[3].getValueNode().location,
        'displayCount === 0 ? <span>-</span> : displayCount',
      )
    })

    it('Should index strings in containers', () => {
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(11)
      expect(componentElements[9].name).toBe('StatCard')
      expect(componentElements[9].getAttributes().length).toBe(4)

      //(StatCard #3)
      expect(componentElements[9].getAttributes()[0].name).toBe('label')
      expect(componentElements[9].getAttributes()[0].type).not.toBe(
        'StringLiteral',
      )
      expect(componentElements[9].getAttributes()[0].getDataFlow().length).toBe(
        1,
      )
      expect(
        getLiteralValue(
          componentElements[9].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('Responses')
      expectLocationOfString(
        file,
        componentElements[9].getAttributes()[0].getDataFlow()[0].location,
        '"Responses"',
      )
    })

    it('Can find the property in a call and template literal expression', () => {
      const file: TestFile = 'app/harderDyanmic.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(2)
      expect(componentElements[0].name).toBe('div')
      expect(componentElements[0].getAttributes().length).toBe(1)
      expect(componentElements[1].name).toBe('Button')
      expect(componentElements[1].getAttributes().length).toBe(2)

      //div #1
      expect(componentElements[0].getAttributes()[0].name).toBe('className')
      expect(componentElements[0].getAttributes()[0].getValueNode().type).toBe(
        'CallExpression',
      )
      expect(componentElements[0].getAttributes()[0].getDataFlow().length).toBe(
        2,
      )
      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[0].location,
        '"flex"',
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('bg-blue-40')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[1].location,
        '"bg-blue-40"',
      )

      //div #2
      expect(componentElements[1].getAttributes()[0].name).toBe('className')
      expect(componentElements[1].getAttributes()[0].getValueNode().type).toBe(
        'TemplateLiteral',
      )
      expect(componentElements[1].getAttributes()[0].getDataFlow().length).toBe(
        2,
      )
      expect(
        getLiteralValue(
          componentElements[1].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('bg-gray-900 ')
      expectLocationOfString(
        file,
        componentElements[1].getAttributes()[0].getDataFlow()[0].location,
        'bg-gray-900 ',
      )

      expect(
        getLiteralValue(
          componentElements[1].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('text-sm')
      expectLocationOfString(
        file,
        componentElements[1].getAttributes()[0].getDataFlow()[1].location,
        '"text-sm"',
      )
    })

    it('Should index component with multiple text broken up', () => {
      const file: TestFile = 'app/text_stuff.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(10)
      expect(componentElements[3].getAttributes().length).toBe(4)
      const textAttributes = componentElements[3]
        .getAttributes()
        .filter((attr) => attr.name === 'children')
      expect(textAttributes.length).toBe(3)

      expect(textAttributes[0].getValueNode().type).toBe('JSXText')
      expect(
        getLiteralValue(
          textAttributes[0].getValueNode().node as LiteralNode,
        ).trim(),
      ).toBe('The ALSCrowd')
      //expectLocationOfString(file, textAttributes[0].location, 'The ALSCrowd')

      expect(textAttributes[1].getValueNode().type).toBe('JSXText')
      expect(
        getLiteralValue(textAttributes[1].getValueNode().node as LiteralNode),
      ).toBe('Community')
      expectLocationOfString(file, textAttributes[1].location, 'Community')

      expect(textAttributes[2].getValueNode().type).toBe('JSXText')
      expect(
        getLiteralValue(
          textAttributes[2].getValueNode().node as LiteralNode,
        ).trim(),
      ).toBe('Directory')
      //expectLocationOfString(file, textAttributes[2].location, 'Directory')
    })

    it('Should connect to correct parent attributes', () => {
      const file: TestFile = 'app/SummaryMetadata.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(11)
      //expect(componentElements[0].getParent()).toBe(componentElements[5])
      expect(componentElements[0].getAttributes()[0].name).toBe('className')
      expect(componentElements[0].getAttributes()[0].getValueNode().type).toBe(
        'CallExpression',
      )
      expect(componentElements[0].getAttributes()[0].getDataFlow().length).toBe(
        5,
      )
      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe(
        'flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm',
      )
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[0].location,
        '"flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"',
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('bg-gray-50')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[1].location,
        '"bg-gray-50"',
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[2]
            .node as LiteralNode,
        ),
      ).toBe('text-sm')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[2].location,
        '"text-sm"',
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[3]
            .node as LiteralNode,
        ),
      ).toBe('bg-blue-50')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[3].location,
        '"bg-blue-50"',
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[4]
            .node as LiteralNode,
        ),
      ).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[4].location,
        '"flex"',
      )
      //expect(componentElements[0].getAttributes()[1].reference).toBe(componentElements[5])

      expect(componentElements[1].getAttributes().length).toBe(3)
      //expect(componentElements[1].getParent()).toBe(componentElements[5])
      expect(componentElements[1].getAttributes()[1].name).toBe('children')
      expect(componentElements[1].getAttributes()[1].getChildIndex()).toBe(0)
      expect(componentElements[1].getAttributes()[1].getValueNode().type).toBe(
        'Identifier',
      )
      expect(componentElements[1].getAttributes()[1].getDataFlow().length).toBe(
        3,
      )

      expect(
        getLiteralValue(
          componentElements[1].getAttributes()[1].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('Displays')
      expectLocationOfString(
        file,
        componentElements[1].getAttributes()[1].getDataFlow()[0].location,
        '"Displays"',
      )
      //expect(componentElements[1].getAttributes()[0].reference).toBe(componentElements[5])

      expect(
        getLiteralValue(
          componentElements[1].getAttributes()[1].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('Starts')
      expectLocationOfString(
        file,
        componentElements[1].getAttributes()[1].getDataFlow()[1].location,
        '"Starts"',
      )

      expect(
        getLiteralValue(
          componentElements[1].getAttributes()[1].getDataFlow()[2]
            .node as LiteralNode,
        ),
      ).toBe('Responses')
      expectLocationOfString(
        file,
        componentElements[1].getAttributes()[1].getDataFlow()[2].location,
        '"Responses"',
      )
    })

    it('Should handle multiple layers of parents', () => {
      const file: TestFile = 'app/multipleLayers1.tsx'
      const content = testCases[file]

      const result = getGraph(content)
      const componentElements = result
        .getNodes()
        .filter((node) => node instanceof JSXElementNode)
      expect(componentElements.length).toBe(5)

      //Layer 2
      //Component1:1 -> div
      expect(componentElements[2].getAttributes().length).toBe(1)
      expect(componentElements[2].getAttributes()[0].name).toBe('className')
      expect(componentElements[2].getAttributes()[0].getDataFlow().length).toBe(
        4,
      )

      expect(
        getLiteralValue(
          componentElements[2].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('m-2')
      expectLocationOfString(
        file,
        componentElements[2].getAttributes()[0].getDataFlow()[0].location,
        '"m-2"',
      )

      expect(
        getLiteralValue(
          componentElements[2].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('p-3')
      expectLocationOfString(
        file,
        componentElements[2].getAttributes()[0].getDataFlow()[1].location,
        'p-3',
      )

      expect(
        getLiteralValue(
          componentElements[2].getAttributes()[0].getDataFlow()[2]
            .node as LiteralNode,
        ),
      ).toBe('m-3')
      expectLocationOfString(
        file,
        componentElements[2].getAttributes()[0].getDataFlow()[2].location,
        '"m-3"',
      )

      expect(
        getLiteralValue(
          componentElements[2].getAttributes()[0].getDataFlow()[3]
            .node as LiteralNode,
        ),
      ).toBe('bg-blue-50 flex flex-col')
      expectLocationOfString(
        file,
        componentElements[2].getAttributes()[0].getDataFlow()[3].location,
        '"bg-blue-50 flex flex-col"',
      )

      expect(componentElements[3].getAttributes().length).toBe(1)
      expect(componentElements[3].getAttributes()[0].name).toBe('children')
      expect(componentElements[3].getAttributes()[0].getDataFlow().length).toBe(
        2,
      )

      expect(
        getLiteralValue(
          componentElements[3].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('Hello there')
      expectLocationOfString(
        file,
        componentElements[3].getAttributes()[0].getDataFlow()[0].location,
        '"Hello there"',
      )

      expect(
        getLiteralValue(
          componentElements[3].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('bob')
      expectLocationOfString(
        file,
        componentElements[3].getAttributes()[0].getDataFlow()[1].location,
        '"bob"',
      )

      expect(componentElements[0].getAttributes().length).toBe(2)
      expect(componentElements[0].getAttributes()[0].name).toBe('className')
      expect(componentElements[0].getAttributes()[0].getDataFlow().length).toBe(
        2,
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('m-2')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[0].location,
        '"m-2"',
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[0].getDataFlow()[1]
            .node as LiteralNode,
        ),
      ).toBe('p-3')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[0].getDataFlow()[1].location,
        'p-3',
      )

      expect(componentElements[0].getAttributes()[1].name).toBe('label')
      expect(componentElements[0].getAttributes()[1].getDataFlow().length).toBe(
        1,
      )

      expect(
        getLiteralValue(
          componentElements[0].getAttributes()[1].getDataFlow()[0]
            .node as LiteralNode,
        ),
      ).toBe('Hello there')
      expectLocationOfString(
        file,
        componentElements[0].getAttributes()[1].getDataFlow()[0].location,
        '"Hello there"',
      )
    })

    it('Should handle inner classNames', () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements.length).toBe(9)

      expect(componentElements[4].props.length).toBe(3)
      expect(componentElements[4].props[1].type).toBe('className')
      expect(componentElements[4].props[1].name).toBe('property')
      expect(componentElements[4].props[1].value).toBe('className:innerClass')
      expectLocationOfString(
        file,
        componentElements[4].props[1].location,
        'innerClass',
      )

      expect(componentElements[8].props.length).toBe(4)
      expect(componentElements[8].props[1].type).toBe('className')
      expect(componentElements[8].props[1].name).toBe('string')
      expect(componentElements[8].props[1].value).toBe('bg-primary')
      expectLocationOfString(
        file,
        componentElements[8].props[1].location,
        '"bg-primary"',
      )
    })

    it('Should handle object properties', () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements.length).toBe(7)

      //div -> layer 1
      expect(componentElements[0].props.length).toBe(3)
      expect(componentElements[0].props[1].type).toBe('className')
      expect(componentElements[0].props[1].name).toBe('string')
      expect(componentElements[0].props[1].value).toBe('bg-white')
      expectLocationOfString(
        file,
        componentElements[0].props[1].location,
        '"bg-white"',
      )
      expect(componentElements[0].props[2].type).toBe('className')
      expect(componentElements[0].props[2].name).toBe('property')
      expect(componentElements[0].props[2].value).toBe('className:className')
      expect(componentElements[0].props[2].locationType).toBe('props')
      expectLocationOfString(
        file,
        componentElements[0].props[2].location,
        'className',
      )

      //h1 -> layer 1
      expect(componentElements[1].props.length).toBe(2)
      expect(componentElements[1].props[1].type).toBe('className')
      expect(componentElements[1].props[1].name).toBe('string')
      expect(componentElements[1].props[1].value).toBe('text-lg')
      expectLocationOfString(
        file,
        componentElements[1].props[1].location,
        '"text-lg"',
      )

      expect(componentElements[1].props[0].type).toBe('text')
      expect(componentElements[1].props[0].name).toBe('property')
      expect(componentElements[1].props[0].value).toBe('label')
      expectLocationOfString(
        file,
        componentElements[1].props[0].location,
        'props.label',
      )

      //h2
      expect(componentElements[2].props.length).toBe(2)
      expect(componentElements[2].props[0].type).toBe('text')
      expect(componentElements[2].props[0].name).toBe('string')
      expect(componentElements[2].props[0].value).toBe('Yes')
      expectLocationOfString(
        file,
        componentElements[2].props[0].location,
        '"Yes"',
      )

      expect(componentElements[2].props.length).toBe(2)
      expect(componentElements[2].props[1].type).toBe('className')
      expect(componentElements[2].props[1].name).toBe('string')
      expect(componentElements[2].props[1].value).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[2].props[1].location,
        '"flex"',
      )

      //div -> layer 2
      expect(componentElements[4].props.length).toBe(4)
      expect(componentElements[4].props[1].type).toBe('className')
      expect(componentElements[4].props[1].name).toBe('string')
      expect(componentElements[4].props[1].value).toBe('bg-white')
      expectLocationOfString(
        file,
        componentElements[4].props[1].location,
        '"bg-white"',
      )
      expect(componentElements[4].props[2].type).toBe('className')
      expect(componentElements[4].props[2].name).toBe('string')
      expect(componentElements[4].props[2].value).toBe('bg-blue-50')
      expectLocationOfString(
        file,
        componentElements[4].props[2].location,
        '"bg-blue-50"',
      )

      //h1
      expect(componentElements[5].props.length).toBe(3)
      expect(componentElements[5].props[0].type).toBe('text')
      expect(componentElements[5].props[0].name).toBe('string')
      expect(componentElements[5].props[0].value).toBe('Hello there')
      expectLocationOfString(
        file,
        componentElements[5].props[0].location,
        '"Hello there"',
      )
    })

    it('Should be able to handle complex dynamic instances', () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements[2].props.length).toBe(8)
      expect(componentElements[2].props[0].type).toBe('property')
      expect(componentElements[2].props[0].name).toBe('string')
      expect(componentElements[2].props[0].value).toBe('variant:outline')
      expectLocationOfString(
        file,
        componentElements[2].props[0].location,
        '"outline"',
      )

      expect(componentElements[2].props[3].type).toBe('className')
      expect(componentElements[2].props[3].name).toBe('string')
      expect(componentElements[2].props[3].value).toBe('bg-sky-50')
      expectLocationOfString(
        file,
        componentElements[2].props[3].location,
        '"bg-sky-50"',
      )

      expect(componentElements[2].props[7].type).toBe('text')
      expect(componentElements[2].props[7].name).toBe('string')
      expect(componentElements[2].props[7].value).toBe('This is a child')
      expect(componentElements[2].props[7].index).toBe(0)
      expectLocationOfString(
        file,
        componentElements[2].props[7].location,
        'This is a child',
      )

      //ScrollView
      expect(componentElements[5].props.length).toBe(4)
      expect(componentElements[5].props[3].type).toBe('property')
      expect(componentElements[5].props[3].name).toBe('property')
      expect(componentElements[5].props[3].value).toBe('id:params')
      expect(componentElements[5].props[3].locationType).toBe('props')
      expectLocationOfString(
        file,
        componentElements[5].props[3].location,
        '_params',
      )

      //div -> ScrollView
      expect(componentElements[6].props.length).toBe(5)
      expect(componentElements[6].props[2].type).toBe('className')
      expect(componentElements[6].props[2].name).toBe('string')
      expect(componentElements[6].props[2].value).toBe('flex')
      expectLocationOfString(
        file,
        componentElements[6].props[2].location,
        '"flex"',
      )
      expect(componentElements[6].props[4].type).toBe('className')
      expect(componentElements[6].props[4].name).toBe('string')
      expect(componentElements[6].props[4].value).toBe('dark:hover:text-sm')
      expectLocationOfString(
        file,
        componentElements[6].props[4].location,
        '"dark:hover:text-sm"',
      )

      expect(componentElements[7].props.length).toBe(7)
      expect(componentElements[7].props[4].type).toBe('className')
      expect(componentElements[7].props[4].name).toBe('string')
      expect(componentElements[7].props[4].value).toBe('styles')
      expectLocationOfString(
        file,
        componentElements[7].props[4].location,
        '"styles"',
      )

      expect(componentElements[7].props[0].type).toBe('text')
      expect(componentElements[7].props[0].name).toBe('string')
      expect(componentElements[7].props[0].value).toBe('Hello')
      expectLocationOfString(
        file,
        componentElements[7].props[0].location,
        '"Hello"',
      )
    })

    it("Should not include classNames that are params and don't have 'class' in the name of the property", () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements.length).toBe(8)

      expect(componentElements[0].props.length).toBe(4)
      expect(componentElements[0].props[0].type).toBe('property')
      expect(componentElements[0].props[0].name).toBe('property')
      expect(componentElements[0].props[0].value).toBe('variant:variant')
      expect(componentElements[0].props[0].locationType).toBe('props')
      expectLocationOfString(
        file,
        componentElements[0].props[0].location,
        'variant',
      )
      expect(componentElements[0].props[2].type).toBe('className')
      expect(componentElements[0].props[2].name).toBe('property')
      expect(componentElements[0].props[2].value).toBe(
        'buttonClass:buttonClass',
      )
      expect(componentElements[0].props[2].locationType).toBe('props')
      expectLocationOfString(
        file,
        componentElements[0].props[2].location,
        'buttonClass',
      )

      expect(componentElements[4].props.length).toBe(8)
      expect(componentElements[4].props[0].type).toBe('property')
      expect(componentElements[4].props[0].name).toBe('string')
      expect(componentElements[4].props[0].value).toBe('variant:secondary')
      expect(componentElements[4].props[0].locationType).toBe('component')
      expectLocationOfString(
        file,
        componentElements[4].props[0].location,
        '"secondary"',
      )
      expect(componentElements[4].props[4].type).toBe('className')
      expect(componentElements[4].props[4].name).toBe('string')
      expect(componentElements[4].props[4].value).toBe('border')
      expect(componentElements[4].props[4].locationType).toBe('component')
      expectLocationOfString(
        file,
        componentElements[4].props[4].location,
        '"border"',
      )
    })

    it('Should add className to element if has props className', () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements.length).toBe(8)

      //h1
      expect(componentElements[2].props.length).toBe(2)
      expect(componentElements[2].props[1].type).toBe('className')
      expect(componentElements[2].props[1].name).toBe('string')
      expect(componentElements[2].props[1].value).toBe('')
      expect(componentElements[2].props[1].locationType).toBe('add')
      expect(
        t.isJSXOpeningElement(componentElements[2].props[1].node),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[2].props[1].location,
        '<h1>',
      )

      //Text child should have the correct index
      expect(componentElements[5].props.length).toBe(2)
      expect(componentElements[5].props[0].type).toBe('text')
      expect(componentElements[5].props[0].name).toBe('string')
      expect(componentElements[5].props[0].value.trim()).toBe("You're welcome")
      expect(componentElements[5].props[0].locationType).toBe('component')
      expect(componentElements[5].props[0].index).toBe(1)

      expect(componentElements[6].props.length).toBe(7)
      expect(componentElements[6].props[0].type).toBe('property')
      expect(componentElements[6].props[0].name).toBe('property')
      expect(componentElements[6].props[0].value).toBe('variant:variant')
      expect(componentElements[6].props[0].locationType).toBe('props')
      expectLocationOfString(
        file,
        componentElements[6].props[0].location,
        'variant',
      )
      expect(componentElements[6].props[3].type).toBe('className')
      expect(componentElements[6].props[3].name).toBe('string')
      expect(componentElements[6].props[3].value).toBe('buttonClass')
      expect(componentElements[6].props[3].locationType).toBe('add')
      expect(
        t.isJSXOpeningElement(componentElements[6].props[3].node),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[6].props[3].location,
        '<Button size="lg">',
      )
    })

    it('Should keep parent index of text element', () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements.length).toBe(20)

      expect(componentElements[3].props.length).toBe(3)
      expect(componentElements[3].props[0].type).toBe('text')
      expect(componentElements[3].props[0].name).toBe('string')
      expect(componentElements[3].props[0].value).toContain('Filter')
      expect(componentElements[3].props[0].index).toBe(1)

      expect(componentElements[12].props.length).toBe(3)
      expect(componentElements[12].props[0].type).toBe('text')
      expect(componentElements[12].props[0].name).toBe('string')
      expect(componentElements[12].props[0].value).toContain('Hello')
      expect(componentElements[12].props[0].index).toBe(2)
    })

    it('Should give the parent a classname when given a spread parameter', () => {
      const componentElements: HarmonyComponent[] = []
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
      expect(componentElements.length).toBe(20)

      //Spread -> h1
      expect(componentElements[1].props.length).toBe(3)
      expect(componentElements[1].props[2].type).toBe('className')
      expect(componentElements[1].props[2].name).toBe('string')
      expect(componentElements[1].props[2].value).toBe('')
      expect(componentElements[1].props[2].locationType).toBe('add')
      expect(
        t.isJSXOpeningElement(componentElements[1].props[2].node),
      ).toBeTruthy()
      expectLocationOfString(
        file,
        componentElements[1].props[2].location,
        '<h1 {...rest}>',
      )

      //Spread 1 -> h1
      expect(componentElements[8].props.length).toBe(5)
      expect(componentElements[8].props[4].type).toBe('className')
      expect(componentElements[8].props[4].name).toBe('string')
      expect(componentElements[8].props[4].value).toBe('className')
      expect(componentElements[8].props[4].locationType).toBe('add')
      expect(
        t.isJSXOpeningElement(componentElements[8].props[4].node),
      ).toBeTruthy()

      //Spread 2 -> h1
      expect(componentElements[10].props.length).toBe(5)
      expect(componentElements[10].props[0].type).toBe('text')
      expect(componentElements[10].props[0].name).toBe('string')
      expect(componentElements[10].props[0].value).toBe(
        'This is a spread: label::',
      )
      expect(componentElements[10].props[0].locationType).toBe('component')

      expect(componentElements[10].props.length).toBe(5)
      expect(componentElements[10].props[4].type).toBe('className')
      expect(componentElements[10].props[4].name).toBe('string')
      expect(componentElements[10].props[4].value).toBe('border-1')
      expect(componentElements[10].props[4].locationType).toBe('component')
    })

    //TODO: Finish this
    it('Should handle imports from various files', () => {
      const componentElements: HarmonyComponent[] = []
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
