/* eslint-disable @typescript-eslint/dot-notation -- ok*/
 
import { describe, expect, it } from 'vitest'
import type { Repository } from '@harmony/util/src/types/branch'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { GitRepository } from '../../repository/git/types'
import { indexFiles } from '../indexor/indexor'
import type { UpdateInfo } from './code-updator'
import { CodeUpdator } from './code-updator'

describe('code-updator', () => {
  const expectLocationOfString = (
    file: TestFile,
    actualLocation: { start: number; end: number; diff?: number },
    expectedString: string,
  ): void => {
    const content = testFiles[file]
    const substr = content.substring(
      actualLocation.start - (actualLocation.diff || 0),
      actualLocation.end - (actualLocation.diff || 0),
    )
    expect(substr).toBe(expectedString)
  }

  const setupGitRepo = async (testFile: TestFile, tailwindPrefix?: string) => {
    const repository: Repository = {
      id: '',
      name: 'Repo',
      branch: 'MyBranch',
      owner: '',
      ref: 'oldRef',
      installationId: 123,
      cssFramework: 'tailwind',
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
  describe('getChangeAndLocation', () => {
    it('Should add on tailwind prefix correctly', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo(file, 'hw-')
      const updateInfos: UpdateInfo[] = [
        {
          component: elementInstances[0],
          attributes: elementInstances[0].props,
          value: 'margin-right:10px;margin-left:10px;display:block;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[0].id,
        },
        {
          component: elementInstances[1],
          attributes: elementInstances[1].props,
          value: 'flex-direction:row;padding-left:10px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[1].id,
        },
      ]

      const changes = (
        await Promise.all(
          updateInfos.map((updateInfo) =>
            codeUpdator['getChangeAndLocation'](updateInfo, 'master'),
          ),
        )
      ).flat()

      expect(changes.length).toBe(2)
      expect(changes[0].updatedCode).toBe('hw-group hw-py-2 hw-block hw-mx-2.5')
      expectLocationOfString(
        file,
        changes[0].location,
        'hw-group hw-flex hw-py-2',
      )

      expect(changes[1].updatedCode).toBe('hw-flex hw-flex-row hw-pl-2.5')
      expectLocationOfString(file, changes[1].location, 'hw-flex hw-flex-col')
    })

    it('Should handle non tailwind classes', async () => {
      const file: TestFile = 'nonTailwindClass'
      const { codeUpdator, elementInstances } = await setupGitRepo(file)
      const updateInfos: UpdateInfo[] = [
        {
          component: elementInstances[0],
          attributes: elementInstances[0].props,
          value: 'margin-left:3px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[0].id,
        },
      ]

      const changes = (
        await Promise.all(
          updateInfos.map((updateInfo) =>
            codeUpdator['getChangeAndLocation'](updateInfo, 'master'),
          ),
        )
      ).flat()

      expect(changes.length).toBe(1)
      expect(changes[0].updatedCode).toBe(
        'flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm ml-[3px]',
      )
      expectLocationOfString(
        file,
        changes[0].location,
        'flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm',
      )
    })
  })

  describe('updateFiles', () => {
    it('Should apply className to parent when parent does not already have class name but can', async () => {
      const file: TestFile = 'classNameParent'
      const { codeUpdator, elementInstances } = await setupGitRepo(file)
      const updates: ComponentUpdate[] = [
        {
          value: 'background-color:#000;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[3].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'padding-left:4px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[4].id,
          childIndex: 0,
          isGlobal: false,
        },
      ]

      const fileUpdates = await codeUpdator.updateFiles(updates)
      expect(Object.keys(fileUpdates).length).toBe(1)
      expect(fileUpdates.classNameParent).toBeTruthy()

      const codeUpdates = fileUpdates.classNameParent
      expect(codeUpdates.filePath).toBe('classNameParent')
      expect(codeUpdates.locations.length).toBe(2)
      expect(codeUpdates.locations[0].snippet).toBe(' className="bg-black"')
      expect(codeUpdates.locations[0].start).toBe(368)
      expect(codeUpdates.locations[0].end).toBe(368)

      expect(codeUpdates.locations[1].snippet).toBe(' innerClass="pl-1"')
      expect(codeUpdates.locations[1].start).toBe(389)
      expect(codeUpdates.locations[1].end).toBe(389)
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
          componentId: elementInstances[11].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'font-size:15px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[13].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'More children',
          oldValue: 'Some Children',
          type: 'text',
          name: '0',
          componentId: elementInstances[18].id,
          childIndex: 0,
          isGlobal: false,
        },
        {
          value: 'background-color:#000;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[20].id,
          childIndex: 1,
          isGlobal: false,
        },
        {
          value: 'Label you',
          oldValue: 'Label me',
          type: 'text',
          name: '0',
          componentId: elementInstances[21].id,
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

      expect(codeUpdates.locations[1].snippet).toBe('text-[15px]')
      expectLocationOfString(file, codeUpdates.locations[1], 'text-sm')

      expect(codeUpdates.locations[2].snippet).toBe('Label you')
      expectLocationOfString(file, codeUpdates.locations[2], 'Label me')

      expect(codeUpdates.locations[3].snippet).toBe('bg-black')
      expectLocationOfString(file, codeUpdates.locations[3], 'bg-white')

      expect(codeUpdates.locations[4].snippet).toBe('More children')
      expectLocationOfString(file, codeUpdates.locations[4], 'Some Children')
    })
  })
})

type TestFile = keyof typeof testFiles
const testFiles = {
  tailwindPrefix: `
        const TailwindComponent = () => {
            return (
                <div className="hw-group hw-flex hw-py-2">
                    <h1 className="hw-flex hw-flex-col">Hello there</h1>
                </div>
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
}
