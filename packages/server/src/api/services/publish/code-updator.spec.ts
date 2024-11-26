import { describe, expect, it } from 'vitest'
import type { Repository } from '@harmony/util/src/types/branch'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { UpdateAttributeValue } from '@harmony/util/src/updates/component'
import type { GitRepository } from '../../repository/git/types'
import { indexFiles } from '../indexor/indexor'
import { CodeUpdator } from './code-updator'

describe('code-updator', () => {
  const expectLocationOfString = (
    file: TestFile,
    actualLocation: { start: number; end: number; diff?: number },
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

    const codeUpdator = new CodeUpdator(gitRepository)
    return { codeUpdator, elementInstances: result.elementInstance }
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

      expect(codeUpdates.locations.length).toBe(2)
      expect(codeUpdates.locations[0].snippet).toBe(
        '"hw-group hw-py-2 hw-block hw-mx-2.5"',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[0],
        '"hw-group hw-flex hw-py-2"',
      )

      expect(codeUpdates.locations[1].snippet).toBe(
        '"hw-flex hw-flex-row hw-pl-2.5"',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[1],
        '"hw-flex hw-flex-col"',
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
      expect(codeUpdates.locations.length).toBe(1)
      expect(codeUpdates.locations[0].snippet).toBe(
        '"flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm ml-[3px]"',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[0],
        '"flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"',
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

      expect(codeUpdates.locations.length).toBe(3)
      expect(codeUpdates.locations[0].snippet).toBe('Hello')
      expectLocationOfString(file, codeUpdates.locations[0], 'Hello there')

      expect(codeUpdates.locations[2].snippet).toBe('"Yes sir"')
      expectLocationOfString(file, codeUpdates.locations[2], '"Thank you"')

      expect(codeUpdates.locations[1].snippet).toBe(
        '/*Change inner text for h3 tag from This is old text to This is new text*/<h3 className={noWhere}>',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[1],
        '<h3 className={noWhere}>',
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

      expect(codeUpdates.locations.length).toBe(2)
      expect(codeUpdates.locations[0].snippet).toBe(
        '/*hw-pl-2.5*/<h3 className={noWhere}>',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[0],
        '<h3 className={noWhere}>',
      )

      expect(codeUpdates.locations[1].snippet).toBe('"hw-p-2 hw-pl-2.5"')
      expectLocationOfString(file, codeUpdates.locations[1], '"hw-p-2"')
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
      expect(codeUpdates.locations.length).toBe(1)
      expect(codeUpdates.locations[0].snippet).toBe(
        '<Child innerClass="pl-1" className="bg-black" />',
      )
      expectLocationOfString(file, codeUpdates.locations[0], '<Child />')
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
      expect(codeUpdates.locations.length).toBe(5)
      expect(codeUpdates.locations[0].snippet).toBe('Bobby Boi')
      expectLocationOfString(file, codeUpdates.locations[0], 'Bob')

      expect(codeUpdates.locations[1].snippet).toBe('"text-[15px]"')
      expectLocationOfString(file, codeUpdates.locations[1], '"text-sm"')

      expect(codeUpdates.locations[2].snippet).toBe('"Label you"')
      expectLocationOfString(file, codeUpdates.locations[2], '"Label me"')

      expect(codeUpdates.locations[3].snippet).toBe('"bg-black"')
      expectLocationOfString(file, codeUpdates.locations[3], '"bg-white"')

      expect(codeUpdates.locations[4].snippet).toBe('More children')
      expectLocationOfString(file, codeUpdates.locations[4], 'Some Children')
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

      expect(codeUpdates.locations.length).toBe(1)
      expect(removeLines(codeUpdates.locations[0].snippet)).toBe(
        '/*padding-left:10px;*/<TailwindComponent label="Thank you" innerClassName="hw-p-2" noWhere={noWhere} />',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[0],
        '<TailwindComponent label="Thank you" innerClassName="hw-p-2" noWhere={noWhere}/>',
        true,
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

      expect(codeUpdates.locations.length).toBe(1)
      expect(removeLines(codeUpdates.locations[0].snippet)).toBe(
        '"https://another-image.com/image.jpg"',
      )
      expectLocationOfString(
        file,
        codeUpdates.locations[0],
        '"https://google.com/image.jpg"',
        true,
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
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates[file]).toBeTruthy()

      const codeUpdates = fileUpdates[file]
      expect(codeUpdates.filePath).toBe(file)

      expect(codeUpdates.locations.length).toBe(8)

      expect(codeUpdates.locations[0].snippet).toBe('"Goodbye sir"')
      expectLocationOfString(file, codeUpdates.locations[0], '"Hello sir"')
      expect(codeUpdates.locations[1].snippet).toBe('"block"')
      expectLocationOfString(file, codeUpdates.locations[1], '"flex"')
      expect(codeUpdates.locations[2].snippet).toBe('"Thank you sir"')
      expectLocationOfString(file, codeUpdates.locations[2], '"There sir"')
      expect(codeUpdates.locations[3].snippet).toBe('"gap-2.5"')
      expectLocationOfString(file, codeUpdates.locations[3], '"gap-2"')

      expect(codeUpdates.locations[4].snippet).toBe('"bg-black"')
      expectLocationOfString(file, codeUpdates.locations[4], '"bg-blue-50"')
      expect(codeUpdates.locations[5].snippet).toBe('"text-black"')
      expectLocationOfString(file, codeUpdates.locations[5], '"text-white"')
      expect(codeUpdates.locations[6].snippet).toBe('"Hello good sir"')
      expectLocationOfString(file, codeUpdates.locations[6], '"Hello"')
      expect(codeUpdates.locations[7].snippet).toBe('"There good sir"')
      expectLocationOfString(file, codeUpdates.locations[7], '"There"')
    })
  })
})

type TestFile = keyof typeof testFiles
const testFiles = {
  tailwindPrefix: `
        const TailwindComponent = ({label, innerClassName, noOp, noWhere}) => {
            return (
                <div className="hw-group hw-flex hw-py-2">
                    <h1 className="hw-flex hw-flex-col">Hello there</h1>
                    <h2 className={innerClassName}>{label}</h2>
                    <h3 className={noWhere}>{noOp}</h3>
                </div>
            )
        }

        const UseTailwindComponent = ({noWhere}) => {
          return (
            <TailwindComponent label="Thank you" innerClassName="hw-p-2" noWhere={noWhere}/>
          )
        }
    `,
  nonTailwindClass: `
        const NonTailwindClass = () => {
            return (
                <div className="flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
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
                    <ChildWithoutChildren className="mx-1">Bob</ChildWithoutChildren>
                    <ChildWithoutClass className="text-sm" label="Hello there"/>
                    <ParentWithSpread label="Label me" className="bg-white">Some Children</ParentWithSpread>
                </div>
            )
        }
    `,
  imageSrc: `
      const ImageSrc = ({image}) => {
        return <img src={image} />
      }

      const Home = () => {
        const image = "https://google.com/image.jpg"
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
            const categories = [{name: "Hello sir", style: "flex"}, {name: "There sir", style: "gap-2"}];
            const classes = [{start: "bg-blue-50"}, {end: "text-white"}];
            return <>
                <ComponentArrays array1={["Hello", "There"]} array2={classes}/>
                <ComponentMapping categories={categories}/>
            </>
        }
  `,
}

const removeLines = (str: string): string => {
  return str.replace(/\n/g, '').replace(/\s+/g, ' ')
}
