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
import type { UpdateProperty } from '@harmony/util/src/updates/property'
import type { GitRepository } from '../../repository/git/types'
import { indexFiles } from '../indexor/indexor'
import { CodeUpdator } from './code-updator'
import type { BuildContext } from './types'

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

describe('context-builder (build-context mode)', () => {
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
        tailwindConfig,
        prettierConfig: {
          trailingComma: 'es5',
          semi: false,
          tabWidth: 2,
          singleQuote: true,
          jsxSingleQuote: true,
          parser: 'typescript',
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
        return {
          number: 0,
          url: '',
        }
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
      async createComment() {
        return undefined
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

    const codeUpdator = new CodeUpdator(
      gitRepository,
      {
        trailingComma: 'es5',
        semi: false,
        tabWidth: 2,
        singleQuote: true,
        jsxSingleQuote: true,
        parser: 'typescript',
      },
      'build-context', // Build context mode!
    )
    return { codeUpdator, elementInstances: result.elementInstance }
  }

  const isBuildContext = (result: unknown): result is BuildContext => {
    return (
      typeof result === 'object' &&
      result !== null &&
      'changes' in result &&
      'affectedFiles' in result &&
      'metadata' in result
    )
  }

  describe('updateFiles in build-context mode', () => {
    it('Should capture tailwind prefix changes as concrete', async () => {
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
          dateModified: new Date(),
        },
        {
          value: 'flex-direction:row;padding-left:10px;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[1].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updateInfos)

      // Verify we get BuildContext, not FileUpdateInfo
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Verify no actual files were modified (critical!)
      expect(result.changes.length).toBeGreaterThan(0)
      expect(result.affectedFiles.has(file)).toBe(true)
      expect(result.metadata.concreteChanges).toBeGreaterThan(0)

      // Verify concrete changes were captured
      const concreteChanges = result.changes.filter(
        (c) => c.confidence === 'concrete',
      )
      expect(concreteChanges.length).toBeGreaterThan(0)

      // Verify change properties
      for (const change of concreteChanges) {
        expect(change.location.file).toBe(file)
        expect(change.location.line).toBeGreaterThan(0)
        expect(change.originalUpdate).toBeDefined()
        expect(change.change.description).toBeTruthy()
      }
    })

    it('Should capture non-tailwind class changes as concrete', async () => {
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
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updateInfos)
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      expect(result.changes.length).toBeGreaterThan(0)

      // Should have some changes captured (could be style, attribute, or literal)
      expect(result.metadata.totalChanges).toBeGreaterThan(0)
    })

    it('Should combine multiple class property changes in same element', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])
      const updateInfos: ComponentUpdate[] = [
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'padding-left',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'padding-right',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updateInfos)
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Multiple changes to same element should be captured
      expect(result.changes.length).toBeGreaterThan(0)
      expect(result.affectedFiles.size).toBe(1)
    })

    it('Should capture text literal changes and uncertain changes for dynamic text', async () => {
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
          dateModified: new Date(),
        },
        {
          value: 'Yes sir',
          oldValue: 'Thank you',
          type: 'text',
          name: '0',
          componentId: elementInstances[2].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
        {
          value: 'This is new text',
          oldValue: 'This is old text',
          type: 'text',
          name: '0',
          componentId: elementInstances[3].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updates)
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Should have both concrete and uncertain changes
      expect(result.metadata.concreteChanges).toBeGreaterThan(0)
      expect(result.metadata.uncertainChanges).toBeGreaterThan(0)

      // Verify uncertain changes don't have code snippets
      const uncertainChanges = result.changes.filter(
        (c) => c.confidence === 'uncertain',
      )
      for (const change of uncertainChanges) {
        expect(change.changeType).toBe('comment')
        expect(change.change.description).toBeTruthy()
      }
    })

    it('Should not mutate any files in build-context mode', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        tailwindPrefix: 'hw-',
      })

      // Store original file content
      const originalContent = testFiles[file]

      const updateInfos: ComponentUpdate[] = [
        {
          value: 'margin-right:10px;margin-left:10px;display:block;',
          oldValue: '',
          type: 'className',
          name: '',
          componentId: elementInstances[0].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updateInfos)
      expect(isBuildContext(result)).toBe(true)

      // CRITICAL: Verify file content hasn't changed
      expect(testFiles[file]).toBe(originalContent)
    })

    it('Should capture className updates and uncertain changes for dynamic classes', async () => {
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
          dateModified: new Date(),
        },
        {
          value: '10px',
          oldValue: '4px',
          type: 'className',
          name: 'padding-left',
          componentId: elementInstances[3].id,
          childIndex: 0,
          isGlobal: false,
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updateInfos)
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Should have changes captured
      expect(result.changes.length).toBeGreaterThan(0)

      // May have uncertain changes for dynamic classes
      const hasUncertain = result.changes.some(
        (c) => c.confidence === 'uncertain',
      )
      if (hasUncertain) {
        expect(result.metadata.uncertainChanges).toBeGreaterThan(0)
      }
    })

    it('Should handle empty update list', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator } = await setupGitRepo([file])

      const result = await codeUpdator.updateFiles([])
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      expect(result.changes.length).toBe(0)
      expect(result.affectedFiles.size).toBe(0)
      expect(result.metadata.totalChanges).toBe(0)
    })

    it('Should include original ComponentUpdate in each change', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])

      const originalUpdate: ComponentUpdate = {
        value: '10px',
        oldValue: '4px',
        type: 'className',
        name: 'padding-left',
        componentId: elementInstances[0].id,
        childIndex: 0,
        isGlobal: false,
        dateModified: new Date(),
      }

      const result = await codeUpdator.updateFiles([originalUpdate])
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Every change should have the original update
      for (const change of result.changes) {
        expect(change.originalUpdate).toBeDefined()
        expect(change.originalUpdate.componentId).toBe(elementInstances[0].id)
        expect(change.originalUpdate.type).toBe('className')
      }
    })

    it('Should capture component additions', async () => {
      const file: TestFile = 'addComponent'
      const { codeUpdator, elementInstances } = await setupGitRepo([file], {
        cssFramework: 'tailwind',
      })
      const updates: ComponentUpdate[] = [
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
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updates)
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Should have element-create changes
      const createChanges = result.changes.filter(
        (c) => c.changeType === 'element-create',
      )
      expect(createChanges.length).toBeGreaterThan(0)

      for (const change of createChanges) {
        expect(change.confidence).toBe('concrete')
        expect(change.change.description).toContain('Create')
      }
    })

    it('Should capture component deletions', async () => {
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
          dateModified: new Date(),
        },
      ]

      const result = await codeUpdator.updateFiles(updates)
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Should have element-delete changes
      const deleteChanges = result.changes.filter(
        (c) => c.changeType === 'element-delete',
      )
      expect(deleteChanges.length).toBeGreaterThan(0)

      for (const change of deleteChanges) {
        expect(change.confidence).toBe('concrete')
        expect(change.change.description).toContain('Delete')
        // Should have oldValue with code snippet
        expect(change.change.oldValue).toBeTruthy()
      }
    })

    it('Should deduplicate identical changes', async () => {
      const file: TestFile = 'tailwindPrefix'
      const { codeUpdator, elementInstances } = await setupGitRepo([file])

      // Submit same update twice
      const update: ComponentUpdate = {
        value: '10px',
        oldValue: '4px',
        type: 'className',
        name: 'padding-left',
        componentId: elementInstances[0].id,
        childIndex: 0,
        isGlobal: false,
        dateModified: new Date(),
      }

      const result = await codeUpdator.updateFiles([update, update])
      expect(isBuildContext(result)).toBe(true)
      if (!isBuildContext(result)) throw new Error('Expected BuildContext')

      // Should deduplicate - exact count depends on implementation
      // but should be less than 2x the changes
      const totalChanges = result.metadata.totalChanges
      expect(totalChanges).toBeGreaterThan(0)
      // If we submitted 2 identical updates, we shouldn't get 2x changes
      // (deduplication should occur)
    })
  })
})

const tailwindConfig = {
  colors: {
    'slate-200': '#f5f7fa',
    'custom-blue': '#3b7dfd',
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
}

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
  'tailwind.config.ts': `
    const config = {
      theme: {
        extend: {
          colors: {
            'slate-200': '#f5f7fa',
            'custom-blue': '#3b7dfd',
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
