import { describe, expect, it } from 'vitest'
import type { Repository } from '@harmony/util/src/types/branch'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type {
  AddComponent,
  DeleteComponent,
  ReorderComponent,
  UpdateAttributeValue,
} from '@harmony/util/src/updates/component'
import { createUpdate } from '@harmony/util/src/updates/utils'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import * as prettier from 'prettier'
import type { GitRepository } from '../../repository/git/types'
import { indexFiles } from '../indexor/indexor'
import { CodeUpdator } from './code-updator'

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
    testFile: TestFile,
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
      [testFile],
      async (file) => testFiles[file as TestFile],
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file)
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file)
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file)
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file)
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

    it('Should add comment for non supported framework', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
        cssFramework: 'bootstrap',
      })
      const updates: ComponentUpdate[] = [
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'padding-left',
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
                    <h2 className={innerClassName}>{label}</h2>
                    <h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }
        const UseTailwindComponent = ({noWhere}) => {
          return (
            /*padding-left:10px;*/<TailwindComponent label='Thank you' innerClassName='hw-p-2' noWhere={noWhere}/>
          )
        }
        `),
      )
    })

    it('Should update image src', async () => {
      const file: TestFile = 'imageSrc'
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
          componentId: elementInstances[0].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: createUpdate<AddComponent>({
            action: 'create',
            component: 'text',
            parentId: elementInstances[0].id,
            parentChildIndex: 1,
            index: 0,
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: elementInstances[0].id,
          childIndex: 2,
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
          componentId: elementInstances[3].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'Change this',
          oldValue: 'Label',
          type: 'text',
          name: '0',
          componentId: elementInstances[0].id,
          childIndex: 2,
          isGlobal: false,
        },
        {
          value: '20px',
          oldValue: '10px',
          type: 'className',
          name: 'padding',
          componentId: elementInstances[0].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: '8px',
          oldValue: '',
          type: 'className',
          name: 'padding',
          componentId: elementInstances[0].id,
          childIndex: 2,
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
          return (
            <div>
              <h1>Change Hello</h1>
              <div className='p-5'>
                <span className='p-2'>Change this</span>
              </div>
              <h2>Change There</h2>
              <div>
                <span>Label</span>
              </div>
            </div>
          )
        }
        `),
      )
    })

    it('Should delete components', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
          componentId: elementInstances[3].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: createUpdate<DeleteComponent>({
            action: 'delete',
          }),
          oldValue: '',
          type: 'component',
          name: 'delete-create',
          componentId: elementInstances[3].id,
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
        const AddComponent = () => {
          return (
            <div>
              <h2>Change There</h2>
              <div></div>
            </div>
          )
        }
        `),
      )
    })

    it('Should reorder components', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo(file, {
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
          return (
            <div>
              <h2>There</h2>
              <div></div>
              <h1 className='p-2'>Hello</h1>
            </div>
          )
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
        return (
          <div>
            <h1>Hello</h1>
            <h2>There</h2>
            <div></div>
          </div>
        )
      }
  `,
}
