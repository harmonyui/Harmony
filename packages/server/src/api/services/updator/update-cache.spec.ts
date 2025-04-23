import { describe, expect, it } from 'vitest'
import type { Repository } from '@harmony/util/src/types/branch'
import type { GitRepositoryFactory } from '../../repository/git/types'
import type { GithubCache } from '../../repository/cache/types'
import { updateFileCache } from './update-cache'

describe('update-cache', () => {
  const setup = (
    changes: {
      path: string
      type: 'add' | 'remove' | 'change'
      content: string
    }[],
  ) => {
    const repository: Repository = {
      id: '',
      name: 'Repo',
      branch: 'MyBranch',
      owner: '',
      ref: 'oldRef',
      installationId: 123,
      cssFramework: 'tailwind',
      defaultUrl: '',
      tailwindConfig: '',
      prettierConfig: '',
      registry: {},
      config: {
        tailwindPath: '',
        packageResolution: {},
      },
    }
    type Files = 'file1.tsx' | 'file2.tsx' | 'file3.tsx'
    const fileCache: Record<`${string}:indexing`, string[]> &
      Record<`${string}:${Files}`, string> = {
      'oldRef:file1.tsx': 'Here is file 1',
      'oldRef:file2.tsx': 'Here is file 2',
      'oldRef:file3.tsx': 'Here is file 3',
      'oldRef:indexing': ['file1.tsx', 'file2.tsx', 'file3.tsx'],
    }
    const githubCache: GithubCache = {
      async getFileContents({ ref, path }) {
        return fileCache[`${ref}:${path as Files}`]
      },
      async getIndexingFiles({ ref }) {
        return fileCache[`${ref}:indexing`]
      },
      async getFileOrDirectoryContents() {
        return null
      },
      async setFileContents({ ref, path }, content) {
        fileCache[`${ref}:${path as Files}`] = content
      },
      async setIndexingFiles({ ref }, files) {
        fileCache[`${ref}:indexing`] = files
      },
      async setFileOrDirectoryContents() {
        return undefined
      },
    }
    const mockGitRepository: GitRepositoryFactory = {
      createGithubCache() {
        return githubCache
      },
      createGitRepository() {
        return {
          async getBranchRef() {
            return ''
          },
          async getCommits() {
            return []
          },
          async getContent(file, ref) {
            const updatedFile = changes.find((change) => change.path === file)
            if (ref === 'newRef' && updatedFile) {
              return updatedFile.content
            }
            return (
              (await githubCache.getFileContents({
                path: file,
                ref: ref || 'newRef',
                repo: '',
              })) || ''
            )
          },
          async getContentOrDirectory() {
            return []
          },
          async getUpdatedFiles() {
            return changes
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
            return 1000
          },
          async getProjectUrl() {
            return ''
          },
          async createComment() {
            return undefined
          },
          repository,
        }
      },
    }
    return { factory: mockGitRepository, repository }
  }
  it('should update cache when file is changed', async () => {
    const changedText = 'This is an updated file'
    const { factory, repository } = setup([
      { path: 'file1.tsx', type: 'change', content: changedText },
    ])
    await updateFileCache(factory, repository, 'oldRef', 'newRef')
    const gitCache = factory.createGithubCache()

    const indexingFiles = await gitCache.getIndexingFiles({
      ref: 'newRef',
      repo: '',
    })
    expect(indexingFiles).toBeTruthy()
    if (!indexingFiles) return

    expect(indexingFiles.length).toBe(3)
    expect(indexingFiles[0]).toBe('file1.tsx')
    expect(indexingFiles[1]).toBe('file2.tsx')
    expect(indexingFiles[2]).toBe('file3.tsx')

    expect(
      await gitCache.getFileContents({
        path: 'file1.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe(changedText)
    expect(
      await gitCache.getFileContents({
        path: 'file2.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 2')
    expect(
      await gitCache.getFileContents({
        path: 'file3.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 3')
  })

  it('should update cache when file is added', async () => {
    const addedText = 'This is some added text'
    const { factory, repository } = setup([
      { path: 'file4.tsx', type: 'add', content: addedText },
    ])
    await updateFileCache(factory, repository, 'oldRef', 'newRef')
    const gitCache = factory.createGithubCache()

    const indexingFiles = await gitCache.getIndexingFiles({
      ref: 'newRef',
      repo: '',
    })
    expect(indexingFiles).toBeTruthy()
    if (!indexingFiles) return

    expect(indexingFiles.length).toBe(4)
    expect(indexingFiles[0]).toBe('file1.tsx')
    expect(indexingFiles[1]).toBe('file2.tsx')
    expect(indexingFiles[2]).toBe('file3.tsx')
    expect(indexingFiles[3]).toBe('file4.tsx')

    expect(
      await gitCache.getFileContents({
        path: 'file1.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 1')
    expect(
      await gitCache.getFileContents({
        path: 'file2.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 2')
    expect(
      await gitCache.getFileContents({
        path: 'file3.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 3')
    expect(
      await gitCache.getFileContents({
        path: 'file4.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe(addedText)
  })

  it('should update cache when file is added', async () => {
    const { factory, repository } = setup([
      { path: 'file1.tsx', type: 'remove', content: '' },
    ])
    await updateFileCache(factory, repository, 'oldRef', 'newRef')
    const gitCache = factory.createGithubCache()

    const indexingFiles = await gitCache.getIndexingFiles({
      ref: 'newRef',
      repo: '',
    })
    expect(indexingFiles).toBeTruthy()
    if (!indexingFiles) return

    expect(indexingFiles.length).toBe(2)
    expect(indexingFiles[0]).toBe('file2.tsx')
    expect(indexingFiles[1]).toBe('file3.tsx')

    expect(
      await gitCache.getFileContents({
        path: 'file2.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 2')
    expect(
      await gitCache.getFileContents({
        path: 'file3.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe('Here is file 3')
    expect(
      await gitCache.getFileContents({
        path: 'file1.tsx',
        ref: 'newRef',
        repo: '',
      }),
    ).toBe(undefined)
  })

  it('should not update cache with invalid file', async () => {
    const { factory, repository } = setup([
      { path: 'migration.sql', type: 'add', content: '' },
    ])
    await updateFileCache(factory, repository, 'oldRef', 'newRef')
    const gitCache = factory.createGithubCache()

    const indexingFiles = await gitCache.getIndexingFiles({
      ref: 'newRef',
      repo: '',
    })
    expect(indexingFiles).toBeTruthy()
    if (!indexingFiles) return

    expect(indexingFiles.length).toBe(3)
    expect(indexingFiles[0]).toBe('file1.tsx')
    expect(indexingFiles[1]).toBe('file2.tsx')
    expect(indexingFiles[2]).toBe('file3.tsx')
  })
})
