import { describe, expect, it, vi } from 'vitest'
import type { Repository } from '@harmony/util/src/types/branch'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type {
  AddComponent,
  DeleteComponent,
  ReorderComponent,
  StyleUpdate,
  UpdateAttributeValue,
  WrapUnwrapComponent,
} from '@harmony/util/src/updates/component'
import { createUpdate } from '@harmony/util/src/updates/utils'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import * as prettier from 'prettier'
import type { UpdateProperty } from '@harmony/util/src/updates/property'
import type { GitRepository } from '../../repository/git/types'
import { indexFiles } from '../indexor/indexor'
import { CodeUpdator } from './code-updator'

vi.mock('../../repository/openai', () => ({
  generateTailwindAnimations() {
    return {
      'theme.extend.animation': {
        'slide-in': 'slideIn 0.6s cubic-bezier(0, 0, 0.3, 1) forwards',
      },
      'theme.extend.keyframes': {
        slideIn: {
          '0%': { transform: 'translateY(2rem)', opacity: '0.01' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
      },
      classes:
        'opacity-0 animate-slide-in [animation-delay:calc(var(--animation-order)*75ms)]',
    }
  },
  refactorTailwindClasses() {
    return `
      <div className="group">
        <h1 className="group-hover:underline"></h1>
      </div>
    `
  },
}))

describe('code-updator', () => {
  const _expectLocationOfString = (
    file: TestFile,
    actualLocation: { start: number; end: number; diff: number },
    expectedString: string,
    _removeLines = false,
  ): void => {
    const content = testFiles[file]
    const substr = content.substring(
      actualLocation.start - (actualLocation.diff || 0),
      actualLocation.end - (actualLocation.diff || 0),
    )
    const actual = _removeLines ? removeLines(substr) : substr
    expect(actual).toBe(expectedString)
  }

  const _expectLocationOfChangedLine = (
    file: TestFile,
    actualLocation: {
      start: number
      end: number
      diff: number
      snippet: string
    },
    expectedLine: string,
  ) => {
    const content = testFiles[file]
    const changedContent = replaceByIndex(
      content,
      actualLocation.snippet,
      actualLocation.start - actualLocation.diff,
      actualLocation.end - actualLocation.diff,
    )
    let substr = changedContent.slice(
      actualLocation.start - (actualLocation.diff || 0),
    )
    const indexOfNextLine = substr.indexOf('\n')
    substr = substr.slice(0, indexOfNextLine)
    const actual = substr
    expect(actual).toBe(expectedLine)
  }

  const setupGitRepo = async (
    files: TestFile[],
    {
      tailwindPrefix,
      cssFramework,
    }: { tailwindPrefix?: string; cssFramework?: string } = {
      tailwindPrefix: '',
      cssFramework: 'tailwind',
    },
  ) => {
    const repository: Repository = {
      id: '',
      name: 'Repo',
      branch: 'MyBranch',
      owner: '',
      ref: 'oldRef',
      installationId: 123,
      cssFramework: cssFramework || 'tailwind',
      defaultUrl: '',
      tailwindPrefix,
      tailwindConfig: testFiles['tailwind.config.ts'],
      prettierConfig: JSON.stringify({
        trailingComma: 'es5',
        semi: false,
        tabWidth: 2,
        singleQuote: true,
        jsxSingleQuote: true,
        parser: 'typescript',
      }),
      registry: {
        Button: {
          name: 'Button',
          implementation: '<Button>Click me</Button>',
          dependencies: [
            {
              isDefault: false,
              name: 'Button',
              path: '@/components/button',
            },
          ],
          props: [],
        },
      },
      config: {
        tailwindPath: 'tailwind.config.ts',
        packageResolution: {
          ui: 'packages/ui',
        },
      },
    }
    const gitRepository: GitRepository = {
      async getBranchRef() {
        return ''
      },
      async getCommits() {
        return []
      },
      async getContent(file) {
        return (testFiles as Record<string, string>)[file]
      },
      async getContentOrDirectory() {
        return []
      },
      async getUpdatedFiles() {
        return []
      },
      async createBranch() {
        return undefined
      },
      async createPullRequest() {
        return ''
      },
      async updateFilesAndCommit() {
        return undefined
      },
      async diffFiles() {
        return []
      },
      async getStarCount() {
        return 0
      },
      async getProjectUrl() {
        return ''
      },
      repository,
    }

    const result = await indexFiles(
      files,
      async (file) => testFiles[file as TestFile],
      repository.config.packageResolution,
    )
    expect(result).toBeTruthy()
    if (!result) throw new Error()

    const codeUpdator = new CodeUpdator(gitRepository, {
      trailingComma: 'es5',
      semi: false,
      tabWidth: 2,
      singleQuote: true,
      jsxSingleQuote: true,
      parser: 'typescript',
    })
    return { codeUpdator, elementInstances: result.elementInstance }
  }

  const formatCode = (str: string): Promise<string> => {
    return prettier.format(str, {
      trailingComma: 'es5',
      semi: false,
      tabWidth: 2,
      singleQuote: true,
      jsxSingleQuote: true,
      parser: 'typescript',
    })
  }

  const removeLines = (str: string): string => {
    return str.replace(/\n/g, '').replace(/\s+/g, ' ').trim()
  }

  describe('updateFiles', () => {
    it('Should add on tailwind prefix correctly', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        tailwindPrefix: 'hw-',
      })
      const updateInfos: ComponentUpdate[] = [
        {
          value: 'margin-right:10px;margin-left:10px;display:block;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'flex-direction:row;padding-left:10px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updateInfos)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const TailwindComponent = ({ label, innerClassName, noOp, noWhere }) => {
            return (
                <div className='hw-group hw-py-2 hw-block hw-mx-2.5'>
                    <h1 className='hw-flex hw-flex-row hw-pl-2.5'>Hello there</h1>
                    <h2 className={innerClassName}>{label}</h2>
                    <h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }
        const UseTailwindComponent = ({ noWhere }) => {
          return (
            <TailwindComponent label='Thank you' innerClassName='hw-p-2' noWhere={noWhere} />
          )
        }
        `),
      )
    })

    it('Should handle non tailwind classes', async () => {
      const file: TestFile = 'nonTailwindClass'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])
      const updateInfos: ComponentUpdate[] = [
        {
          value: '3px',
          oldValue: '',
          type: 'className',
          name: 'margin-left',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updateInfos)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()
      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const NonTailwindClass = () => {
            return (
                <div className='flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm ml-[3px]'>
                    Bob
                </div>
            )
        }
        `),
      )
    })

    it('Should update text literals and comments for dynamic text', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])
      const updates: ComponentUpdate[] = [
        {
          value: 'Hello',
          oldValue: 'Hello there',
          type: 'text',
          name: '0',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'Yes sir',
          oldValue: 'Thank you',
          type: 'text',
          name: '0',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'This is new text',
          oldValue: 'This is old text',
          type: 'text',
          name: '0',
          componentId: elementInstances[3].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const TailwindComponent = ({label, innerClassName, noOp, noWhere}) => {
            return (
                <div className='hw-group hw-flex hw-py-2'>
                    <h1 className='hw-flex hw-flex-col'>Hello</h1>
                    <h2 className={innerClassName}>{label}</h2>
                    /*Change inner text for h3 tag from This is old text to This is new text*/<h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }
        const UseTailwindComponent = ({noWhere}) => {
          return (
            <TailwindComponent label='Yes sir' innerClassName='hw-p-2' noWhere={noWhere}/>
          )
        }
        `),
      )
    })

    it('Should apply className literals and comments for dynamic classes', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        tailwindPrefix: 'hw-',
      })
      const updateInfos: ComponentUpdate[] = [
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'padding-left',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'padding-left',
          componentId: elementInstances[3].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updateInfos)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const TailwindComponent = ({label, innerClassName, noOp, noWhere}) => {
            return (
                <div className='hw-group hw-flex hw-py-2'>
                    <h1 className='hw-flex hw-flex-col'>Hello there</h1>
                    <h2 className={innerClassName}>{label}</h2>
                    <h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }
        const UseTailwindComponent = ({noWhere}) => {
          return (
            /*Add class hw-pl-2.5 to h3 tag*/<TailwindComponent label='Thank you' innerClassName='hw-p-2 hw-pl-2.5' noWhere={noWhere}/>
          )
        }
        `),
      )
    })

    it('Should apply className to parent when parent does not already have class name but can', async () => {
      const file: TestFile = 'classNameParent'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])
      const updates: ComponentUpdate[] = [
        {
          value: '#000',
          oldValue: '',
          type: 'className',
          name: 'background-color',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '4px',
          oldValue: '',
          type: 'className',
          name: 'padding-left',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates.classNameParent).toBeTruthy()

      const codeUpdates = fileUpdates.classNameParent
      expect(codeUpdates.filePath).toBe('classNameParent')
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const Child = ({className, innerClass}) => {
            return (
                <div className={cn('flex mx-2', className)}>
                    <div className={innerClass}>
                        Thank you
                    </div>
                </div>
            )
        }
        const Parent = () => {
            return (
                <Child className='bg-black' innerClass='pl-1' />
            )
        }
        `),
      )
    })

    it('Should apply className and children updates to spread prop', async () => {
      const file: TestFile = 'spreadProp'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])
      const updates: ComponentUpdate[] = [
        {
          value: 'Bobby Boi',
          oldValue: 'Bob',
          type: 'text',
          name: '0',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'font-size:15px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[3].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'More children',
          oldValue: 'Some Children',
          type: 'text',
          name: '0',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'background-color:#000;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[0].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'Label you',
          oldValue: 'Label me',
          type: 'text',
          name: '0',
          componentId: elementInstances[4].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const ChildWithoutChildren = ({className, ...rest}) => {
            return (
                <h1 className={className} {...rest}/>
            )
        }
        const ChildWithoutClass = ({label, ...rest}) => {
            return (
                <div {...rest}>
                    <h1>{label}</h1>
                </div>
            )
        }
        const ParentWithSpread = ({temp, ...rest}) => {
            return (
                <div>
                    <ChildWithoutChildren {...rest}/>
                    <ChildWithoutClass {...rest}/>
                </div>
            )
        }
        const Parent = () => {
            return (
                <div>
                    <ChildWithoutChildren className='mx-1'>Bobby Boi</ChildWithoutChildren>
                    <ChildWithoutClass className='text-[15px]' label='Hello there'/>
                    <ParentWithSpread label='Label you' className='bg-black'>More children</ParentWithSpread>
                </div>
            )
        }
        `),
      )
    })

    it('Should add style for non supported framework', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'bootstrap',
      })
      const updates: ComponentUpdate[] = [
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'paddingLeft',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const TailwindComponent = ({label, innerClassName, noOp, noWhere}) => {
            return (
                <div className='hw-group hw-flex hw-py-2'>
                    <h1 className='hw-flex hw-flex-col'>Hello there</h1>
                    <h2 className={innerClassName} style={{
                      paddingLeft: '10px'
                    }}>{label}</h2>
                    <h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }
        const UseTailwindComponent = ({noWhere}) => {
          return (
            <TailwindComponent label='Thank you' innerClassName='hw-p-2' noWhere={noWhere}/>
          )
        }
        `),
      )
    })

    it('Should update image src', async () => {
      const file: TestFile = 'imageSrc'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'bootstrap',
      })
      const updates: ComponentUpdate[] = [
        {
          value: JSON.stringify({
            action: 'update',
            value: 'https://another-image.com/image.jpg',
            name: 'src',
          } satisfies UpdateAttributeValue),
          oldValue: JSON.stringify({
            action: 'update',
            value: 'https://google.com/image.jpg',
            name: 'src',
          } satisfies UpdateAttributeValue),
          type: 'component',
          name: 'update-attribute',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const ImageSrc = ({image}) => {
          return <img src={image} />
        }
        const Home = () => {
          const image = 'https://another-image.com/image.jpg'
          return <ImageSrc image={image} />
        }
        `),
      )
    })

    it('Should update array data', async () => {
      const file: TestFile = 'arrayStuff'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          value: 'Hello good sir',
          oldValue: 'Hello',
          type: 'text',
          name: '0',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'There good sir',
          oldValue: 'There',
          type: 'text',
          name: '0',
          componentId: elementInstances[2].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: '#000',
          oldValue: '',
          type: 'className',
          name: 'background-color',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '#000',
          oldValue: '',
          type: 'className',
          name: 'color',
          componentId: elementInstances[2].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'Goodbye sir',
          oldValue: 'Hello sir',
          type: 'text',
          name: '0',
          componentId: elementInstances[4].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'Thank you sir',
          oldValue: 'There sir',
          type: 'text',
          name: '0',
          componentId: elementInstances[4].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'block',
          oldValue: 'flex',
          type: 'className',
          name: 'display',
          componentId: elementInstances[4].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '10px',
          oldValue: '8px',
          type: 'className',
          name: 'gap',
          componentId: elementInstances[4].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'name1-changed',
          oldValue: 'name1',
          type: 'text',
          name: '0',
          componentId: elementInstances[8].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'name2-changed',
          oldValue: 'name2',
          type: 'text',
          name: '0',
          componentId: elementInstances[8].id,
          childIndex: 1,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const ComponentArrays = ({array1, array2}) => {
        const [first, second] = array2;
            return <div>
                <h1 className={first.start}>{array1[0]}</h1>
                <h2 className={second.end}>{array1[1]}</h2>
            </div>
        }
        const ComponentMapping = ({categories}) => {
            return <div>
                {categories.map((category) => {
                    return <h1 className={category.style}>{category.name}</h1>
                })}
            </div>
        }
        const App = () => {
            const categories = [
              {
                name: 'Goodbye sir',
                style: 'block',
              },
              {
                name: 'Thank you sir',
                style: 'gap-2.5',
              },
            ]
            const classes = [
              {
                start: 'bg-black',
              },
              {
                end: 'text-black',
              },
            ]
            const inHouseMapping = [
              {
                name: 'name1-changed',
              },
              {
                name: 'name2-changed',
              },
            ]
            return <>
                <ComponentArrays array1={['Hello good sir', 'There good sir']} array2={classes}/>
                <ComponentMapping categories={categories}/>
                {inHouseMapping.map((category) => <div key={category.name}>{category.name}</div>)}
            </>
        }
        `),
      )
    })

    it('Should add component', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          value: 'Change Hello',
          oldValue: 'Hello',
          type: 'text',
          name: '0',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'Change There',
          oldValue: 'There',
          type: 'text',
          name: '0',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            action: 'create',
            component: 'frame',
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 1,
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-frame-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            action: 'create',
            component: 'text',
            parentId: 'new-frame-1',
            parentChildIndex: 0,
            index: 0,
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-frame-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            action: 'create',
            component: 'text',
            parentId: elementInstances[3].id,
            parentChildIndex: 0,
            index: 0,
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-frame-3',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'Change this',
          oldValue: 'Label',
          type: 'text',
          name: '0',
          componentId: 'new-frame-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '20px',
          oldValue: '10px',
          type: 'className',
          name: 'padding',
          componentId: 'new-frame-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '8px',
          oldValue: '',
          type: 'className',
          name: 'padding',
          componentId: 'new-frame-2',
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const AddComponent = () => {
          const error = ''
          return (
            <div>
              <h1>Change Hello</h1>
              <div className='flex p-5'>
                <span className='p-2'>Change this</span>
              </div>
              {error ? <h2>Change There</h2> : null}
              <div>
                <span>Label</span>
              </div>
            </div>
          )
        }
        const App = () => {
          return <AddComponent />
        }
        `),
      )
    })

    it('Should delete components', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          value: createUpdate<DeleteComponent>({
            action: 'delete',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'Change There',
          oldValue: 'There',
          type: 'text',
          name: '0',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            action: 'create',
            component: 'text',
            parentId: elementInstances[3].id,
            parentChildIndex: 0,
            index: 0,
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-frame-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<DeleteComponent>({
            action: 'delete',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-frame-1',
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const AddComponent = () => {
          const error = ''
          return (
            <div>
              {error ? <h2>Change There</h2> : null}
              <div></div>
            </div>
          )
        }
        const App = () => {
          return <AddComponent />
        }
        `),
      )
    })

    it('Should reorder components', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          value: createUpdate<ReorderComponent>({
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 1,
          }),
          oldValue: '',
          type: 'component',
          name: 'reorder',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: '8px',
          oldValue: '',
          type: 'className',
          name: 'padding',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<ReorderComponent>({
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 2,
          }),
          oldValue: '',
          type: 'component',
          name: 'reorder',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
        const AddComponent = () => {
          const error = ''
          return (
            <div>
              {error ? <h2>There</h2> : null}
              <div></div>
              <h1 className='p-2'>Hello</h1>
            </div>
          )
        }
        const App = () => {
          return <AddComponent />
        }
        `),
      )
    })

    it('Should add component with dependencies', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          value: createUpdate<AddComponent>({
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 1,
            action: 'create',
            component: 'Button',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: elementInstances[0].id,
          childIndex: 1,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
          import { Button } from '@/components/button'
          const AddComponent = () => {
            const error = ''
            return (
              <div>
                <h1>Hello</h1>
                <Button>Click me</Button>
                {error ? <h2>There</h2> : null}
                <div></div>
              </div>
            )
          }
          const App = () => {
            return <AddComponent />
          }
        `),
      )
    })

    it('Should update property', async () => {
      const file: TestFile = 'updateProperty'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          value: createUpdate<UpdateProperty>({
            name: 'variant',
            value: 'secondary',
            valueMapping: '',
            type: 'classNameVariant',
          }),
          oldValue: createUpdate<UpdateProperty>({
            name: 'variant',
            value: 'default',
            valueMapping: '',
            type: 'classNameVariant',
          }),
          type: 'property',
          name: 'variant',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<UpdateProperty>({
            name: 'size',
            value: 'sm',
            valueMapping: '',
            type: 'classNameVariant',
          }),
          oldValue: createUpdate<UpdateProperty>({
            name: 'size',
            value: 'default',
            valueMapping: '',
            type: 'classNameVariant',
          }),
          type: 'property',
          name: 'size',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
          const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
            (
              { className, variant, size, asChild = false, children, loading, ...props },
              ref
            ) => {
              const Comp = asChild ? Slot : 'button';
              return (
                <Comp
                  className={getClass(
                    buttonVariants({
                      variant,
                      size,
                      className,
                    })
                  )}
                  ref={ref}
                  {...props}
                >
                  {loading ? (
                    <Spinner className='rounded' sizeClass='w-5 h-5' />
                  ) : (
                    children
                  )}
                </Comp>
              );
            }
          );
          const UpdateProperty = () => {
            const variant = 'secondary';
            return (
              <div>
                <Button variant={variant} size="sm">Click me</Button>
              </div>
              )
          } 
        `),
      )
    })

    it('Should copy paste', async () => {
      const file: TestFile = 'copyPaste'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          type: 'text',
          name: '0',
          value: 'Tbere',
          oldValue: 'Hello',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            parentId: elementInstances[1].id,
            parentChildIndex: 0,
            index: 1,
            action: 'create',
            component: 'Button',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-button',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'component',
          name: 'delete-create',
          value: createUpdate<AddComponent>({
            action: 'create',
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 1,
            copiedFrom: {
              componentId: elementInstances[1].id,
              childIndex: 0,
            },
          }),
          oldValue: '',
          componentId: 'copy-paste-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'text',
          name: '0',
          value: 'Change this',
          oldValue: 'Click me',
          componentId: 'new-button',
          childIndex: 1,
          isGlobal: false,
        },
        {
          type: 'text',
          name: '0',
          value: 'Changed',
          oldValue: 'Tbere',
          componentId: elementInstances[2].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          type: 'className',
          name: 'padding',
          value: '8px',
          oldValue: 'Hello',
          componentId: 'copy-paste-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'component',
          name: 'delete-create',
          value: createUpdate<DeleteComponent>({
            action: 'delete',
          }),
          oldValue: '',
          componentId: 'new-button',
          childIndex: 1,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
          import { Button } from '@/components/button'
          const CopyPaste = () => {
            return (
              <div>
                <div>
                  <h1>Tbere</h1>
                  <Button>Click me</Button>
                  <h2>There</h2>
                </div>
                <div className="p-2">
                  <h1>Changed</h1>
                  <h2>There</h2>
                </div>
                <p>Here is some text</p>
              </div>
            )
          }
        `),
      )
    })

    it('Should do updates with multple layers', async () => {
      const { codeUpdator, elementInstances } = await setupGitRepo(
        ['file1', 'file2'],
        {
          cssFramework: 'tailwind',
        },
      )
      const updates: ComponentUpdate[] = [
        {
          type: 'component',
          name: 'reorder',
          value: createUpdate<ReorderComponent>({
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 0,
          }),
          oldValue: '',
          componentId: elementInstances[4].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'component',
          name: 'delete-create',
          value: createUpdate<AddComponent>({
            action: 'create',
            parentId: elementInstances[1].id,
            parentChildIndex: 0,
            index: 1,
            copiedFrom: {
              componentId: elementInstances[0].id,
              childIndex: 0,
            },
          }),
          oldValue: '',
          componentId: 'new-button',
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates.file2).toBeTruthy()

      const codeUpdates = fileUpdates.file2
      expect(codeUpdates.filePath).toBe('file2')
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
              import { Button } from './file1'
              const App = () => {
                return <div>
                  <Button>
                    <span>Content2</span>
                    <span>Content1</span>
                  </Button>
                  <Button>
                    <span>Content2</span>
                    <span>Content1</span>
                  </Button>
                </div>
              }
            `),
      )
    })

    it('Should add jsx attributes', async () => {
      const file: TestFile = 'file2'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          type: 'className',
          name: 'display',
          value: 'flex',
          oldValue: '',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'className',
          name: 'padding',
          value: '12px',
          oldValue: '',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            parentId: elementInstances[0].id,
            parentChildIndex: 0,
            index: 1,
            action: 'create',
            element: 'div',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-button',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'className',
          name: 'display',
          value: 'block',
          oldValue: '',
          componentId: 'new-button',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            parentId: 'new-button',
            parentChildIndex: 0,
            index: 0,
            action: 'create',
            element: 'div',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-button-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'className',
          name: 'padding',
          value: '12px',
          oldValue: '',
          componentId: 'new-button-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'className',
          name: 'backgroundImage',
          value:
            'url("https://maeflowerswim.com/cdn/shop/files/IMG_8836.jpg?v=1721103505")',
          oldValue: '',
          componentId: 'new-button-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'text',
          name: '0',
          value: 'New Content',
          oldValue: '',
          componentId: 'new-button-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            parentId: elementInstances[1].id,
            parentChildIndex: 0,
            index: 1,
            action: 'create',
            element: 'a',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-link-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<UpdateAttributeValue>({
            action: 'update',
            value: 'https://google.com',
            name: 'href',
          }),
          oldValue: '',
          type: 'component',
          name: 'update-attribute',
          componentId: 'new-link-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'I <3 You',
          oldValue: '',
          type: 'text',
          name: '0',
          componentId: 'new-link-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            parentId: elementInstances[1].id,
            parentChildIndex: 0,
            index: 2,
            action: 'create',
            element: 'a',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-link-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'Link 2',
          oldValue: '',
          type: 'text',
          name: '0',
          componentId: 'new-link-2',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            parentId: elementInstances[1].id,
            parentChildIndex: 0,
            index: 3,
            action: 'create',
            element: 'img',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: 'new-image-1',
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: createUpdate<UpdateAttributeValue>({
            action: 'update',
            value: 'https://google.com/image.jpg',
            name: 'src',
          }),
          oldValue: '',
          type: 'component',
          name: 'update-attribute',
          componentId: 'new-image-1',
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
          import { Button } from './file1'
          const App = () => {
            return <div className="flex p-3">
              <Button>
                <span>Content1</span>
                <a href="https://google.com">I &lt;3 You</a>
                <a>Link 2</a>
                <img src="https://google.com/image.jpg" />
                <span>Content2</span>
              </Button>
              <div className="block">
                <div className="p-3 bg-[url('https://maeflowerswim.com/cdn/shop/files/IMG_8836.jpg?v=1721103505')]">New Content</div>
              </div>
            </div>
          }
        `),
      )
    })

    it('Should update tailwind config with animation style update', async () => {
      const { codeUpdator, elementInstances } = await setupGitRepo(['file2'], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
        {
          type: 'component',
          name: 'style',
          value: createUpdate<StyleUpdate>({
            css: ``,
            classes: [],
            type: 'animation',
            styleCss: '',
            properties: [],
          }),
          oldValue: createUpdate<StyleUpdate>({
            css: ``,
            classes: [],
            type: 'animation',
            styleCss: '',
            properties: [],
          }),
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)

      expect(fileUpdates['tailwind.config.ts']).toBeTruthy()

      const tailwindUpdates = fileUpdates['tailwind.config.ts']
      expect(tailwindUpdates.filePath).toBe('tailwind.config.ts')
      expect(await formatCode(tailwindUpdates.newContent)).toBe(
        await formatCode(`
              const config = {
                theme: {
                  extend: {
                    colors: {
                      'slate-200': '#f5f7fa',
                    },
                    keyframes: {
                      'fade-in': {
                        from: { 
                          opacity: '0', 
                          transform: 'translateY(-10px)' 
                        },
                        to: { 
                          opacity: '1', 
                          transform: 'none' 
                        },
                      },
                      'fade-up': {
                        from: { 
                          opacity: '0', 
                          transform: 'translateY(20px)' 
                        },
                        to: { 
                          opacity: '1', 
                          transform: 'none' 
                        },
                      },
                      'slideIn': {
                        '0%': { 
                          'transform': 'translateY(2rem)', 
                          'opacity': '0.01' 
                        },
                        '100%': { 
                          'transform': 'translateY(0px)', 
                          'opacity': '1' 
                        }
                      }
                    },
                    animation: {
                      'fade-in': 'fade-in 1s var(--animation-delay,0ms) ease forwards',
                      'fade-up': 'fade-up 1s var(--animation-delay,0ms) ease forwards',
                      'slide-in': 'slideIn 0.6s cubic-bezier(0, 0, 0.3, 1) forwards'
                    },
                  },
                },
              }
              export default config
            `),
      )

      expect(fileUpdates.file2).toBeTruthy()

      const codeUpdates = fileUpdates.file2
      expect(codeUpdates.filePath).toBe('file2')
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
              import { Button } from './file1'
              const App = () => {
                return <div className="opacity-0 animate-slide-in [animation-delay:calc(var(--animation-order)*75ms)]">
                  <Button>
                    <span>Content1</span>
                    <span>Content2</span>
                  </Button>
                </div>
              }
            `),
      )
    })

    it('Should update classes for hover style update', async () => {
      const { codeUpdator, elementInstances } = await setupGitRepo(
        ['hoverStyle'],
        {
          cssFramework: 'tailwind',
        },
      )
      const updates: ComponentUpdate[] = [
        {
          type: 'component',
          name: 'style',
          value: createUpdate<StyleUpdate>({
            css: `.card-wrapper:hover .card-information__text {
                    text-decoration-line: underline;
                  }`,
            classes: [
              {
                componentId: elementInstances[0].id,
                className: 'card-wrapper',
                childIndex: 0,
              },
              {
                componentId: elementInstances[2].id,
                childIndex: 0,
                className: 'card-information__text',
              },
            ],
            type: 'hover',
            styleCss: '',
            properties: [],
          }),
          oldValue: createUpdate<StyleUpdate>({
            css: ``,
            classes: [],
            type: 'hover',
            styleCss: '',
            properties: [],
          }),
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)

      expect(fileUpdates.hoverStyle).toBeTruthy()

      const tailwindUpdates = fileUpdates.hoverStyle
      expect(tailwindUpdates.filePath).toBe('hoverStyle')
      expect(await formatCode(tailwindUpdates.newContent)).toBe(
        await formatCode(`
              const App = () => {
                return <div className="group">
                  <div>
                    <h1 className="group-hover:underline">Hello there</h1>
                  </div>
                </div>
              }
            `),
      )
    })

    it('Should wrap a component with a new component', async () => {
      const { codeUpdator, elementInstances } = await setupGitRepo(
        ['file1', 'file2'],
        {
          cssFramework: 'tailwind',
        },
      )
      const updates: ComponentUpdate[] = [
        {
          type: 'component',
          name: 'wrap-unwrap',
          value: createUpdate<WrapUnwrapComponent>({
            action: 'wrap',
            elements: [
              {
                componentId: elementInstances[0].id,
                childIndex: 0,
              },
            ],
          }),
          oldValue: '',
          componentId: btoa('file2:new-component'),
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'component',
          name: 'wrap-unwrap',
          value: createUpdate<WrapUnwrapComponent>({
            action: 'wrap',
            elements: [
              {
                componentId: elementInstances[3].id,
                childIndex: 0,
              },
            ],
          }),
          oldValue: '',
          componentId: btoa('file1:new-wrapped-component-2'),
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'component',
          name: 'wrap-unwrap',
          value: createUpdate<WrapUnwrapComponent>({
            action: 'wrap',
            elements: [
              {
                componentId: elementInstances[3].id,
                childIndex: 0,
              },
            ],
          }),
          oldValue: '',
          componentId: 'new-wrapped-component-3',
          childIndex: 0,
          isGlobal: false,
        },
        {
          type: 'component',
          name: 'wrap-unwrap',
          value: createUpdate<WrapUnwrapComponent>({
            action: 'unwrap',
          }),
          oldValue: '',
          componentId: btoa('file1:new-wrapped-component-2'),
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)

      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates.file2).toBeTruthy()

      const codeUpdates = fileUpdates.file2
      expect(codeUpdates.filePath).toBe('file2')
      expect(await formatCode(codeUpdates.newContent)).toBe(
        await formatCode(`
              import { Button } from './file1'
              const App = () => {
                return <div>
                  <div className="flex">
                    <Button>
                      <div className="flex">
                        <span>Content1</span>
                      </div>
                      <span>Content2</span>
                    </Button>
                  </div>
                </div>
              }
            `),
      )
    })
  })
})

type TestFile = keyof typeof testFiles
const testFiles = {
  tailwindPrefix: `
        const TailwindComponent = ({label, innerClassName, noOp, noWhere}) => {
            return (
                <div className='hw-group hw-flex hw-py-2'>
                    <h1 className='hw-flex hw-flex-col'>Hello there</h1>
                    <h2 className={innerClassName}>{label}</h2>
                    <h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }
        const UseTailwindComponent = ({noWhere}) => {
          return (
            <TailwindComponent label='Thank you' innerClassName='hw-p-2' noWhere={noWhere}/>
          )
        }
    `,
  nonTailwindClass: `
        const NonTailwindClass = () => {
            return (
                <div className='flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm'>
                    Bob
                </div>
            )
        }
    `,
  classNameParent: `
        const Child = ({className, innerClass}) => {
            return (
                <div className={cn('flex mx-2', className)}>
                    <div className={innerClass}>
                        Thank you
                    </div>
                </div>
            )
        }
        const Parent = () => {
            return (
                <Child />
            )
        }
    `,
  spreadProp: `
        const ChildWithoutChildren = ({className, ...rest}) => {
            return (
                <h1 className={className} {...rest}/>
            )
        }
        const ChildWithoutClass = ({label, ...rest}) => {
            return (
                <div {...rest}>
                    <h1>{label}</h1>
                </div>
            )
        }
        const ParentWithSpread = ({temp, ...rest}) => {
            return (
                <div>
                    <ChildWithoutChildren {...rest}/>
                    <ChildWithoutClass {...rest}/>
                </div>
            )
        }
        const Parent = () => {
            return (
                <div>
                    <ChildWithoutChildren className='mx-1'>Bob</ChildWithoutChildren>
                    <ChildWithoutClass className='text-sm' label='Hello there'/>
                    <ParentWithSpread label='Label me' className='bg-white'>Some Children</ParentWithSpread>
                </div>
            )
        }
    `,
  imageSrc: `
      const ImageSrc = ({image}) => {
        return <img src={image} />
      }
      const Home = () => {
        const image = 'https://google.com/image.jpg'
        return <ImageSrc image={image} />
      }
    `,
  arrayStuff: `
      const ComponentArrays = ({array1, array2}) => {
        const [first, second] = array2;
            return <div>
                <h1 className={first.start}>{array1[0]}</h1>
                <h2 className={second.end}>{array1[1]}</h2>
            </div>
        }
        const ComponentMapping = ({categories}) => {
            return <div>
                {categories.map((category) => {
                    return <h1 className={category.style}>{category.name}</h1>
                })}
            </div>
        }
        const App = () => {
            const categories = [{name: 'Hello sir', style: 'flex'}, {name: 'There sir', style: 'gap-2'}];
            const classes = [{start: 'bg-blue-50'}, {end: 'text-white'}];
            const inHouseMapping = [{name: 'name1'}, {name: 'name2'}];
            return <>
                <ComponentArrays array1={['Hello', 'There']} array2={classes}/>
                <ComponentMapping categories={categories}/>
                {inHouseMapping.map((category) => <div key={category.name}>{category.name}</div>)}
            </>
        }
  `,
  addComponent: `
      const AddComponent = () => {
        const error = ''

        return (
          <div>
            <h1>Hello</h1>
            {error ? <h2>There</h2> : null}
            <div></div>
          </div>
        )
      }

      const App = () => {
        return <AddComponent />
      }
  `,
  updateProperty: `
    const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
      (
        { className, variant, size, asChild = false, children, loading, ...props },
        ref
      ) => {
        const Comp = asChild ? Slot : 'button';
        return (
          <Comp
            className={getClass(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
          >
            {loading ? (
              <Spinner className='rounded' sizeClass='w-5 h-5' />
            ) : (
              children
            )}
          </Comp>
        );
      }
    );

    const UpdateProperty = () => {
      const variant = 'default';
      return (
        <div>
          <Button variant={variant}>Click me</Button>
        </div>
        )
    } 
  
  `,
  copyPaste: `
    const CopyPaste = () => {
      return (
        <div>
          <div>
            <h1>Hello</h1>
            <h2>There</h2>
          </div>
          <p>Here is some text</p>
        </div>
      )
    }
  `,
  file1: `
    export const Button = ({children}) => {
        return <button>{children}</button>
    }
  `,
  file2: `
    import { Button } from './file1'

    const App = () => {
      return <div>
        <Button>
          <span>Content1</span>
          <span>Content2</span>
        </Button>
      </div>
    }
  `,
  hoverStyle: `
    const App = () => {
      return <div>
        <div>
          <h1>Hello there</h1>
        </div>
      </div>
    }
  `,
  'tailwind.config.ts': `
    const config = {
      theme: {
        extend: {
          colors: {
            'slate-200': '#f5f7fa',
          },
          keyframes: {
            'fade-in': {
              from: { opacity: '0', transform: 'translateY(-10px)' },
              to: { opacity: '1', transform: 'none' },
            },
            'fade-up': {
              from: { opacity: '0', transform: 'translateY(20px)' },
              to: { opacity: '1', transform: 'none' },
            },
          },
          animation: {
            'fade-in': 'fade-in 1s var(--animation-delay,0ms) ease forwards',
            'fade-up': 'fade-up 1s var(--animation-delay,0ms) ease forwards',
          },
        },
      },
    }

    export default config
  `,
}
