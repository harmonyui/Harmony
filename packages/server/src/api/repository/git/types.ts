import type { CommitItem, Repository } from '@harmony/util/src/types/branch'
import type { Change } from 'diff'
import type { GithubCache } from '../cache/types'

export interface GitRepositoryFactory {
  createGitRepository: (repository: Repository) => GitRepository
  createGithubCache: () => GithubCache
}

export interface ContentOrDirectory {
  type: string
  path: string
}
export interface UpdateFile {
  type: 'add' | 'remove' | 'change'
  path: string
}
export interface GitRepository {
  getContentOrDirectory: (
    filePath: string,
    branchName?: string,
  ) => Promise<
    | ContentOrDirectory
    | ContentOrDirectory[]
    | { content: string; path: string }
  >
  createBranch: (newBranch: string) => Promise<void>
  getBranchRef: (branch: string) => Promise<string>
  diffFiles: (branch: string, oldRef: string, file: string) => Promise<Change[]>
  getContent: (
    file: string,
    ref?: string,
    rawContent?: boolean,
  ) => Promise<string>
  updateFilesAndCommit: (
    branch: string,
    changes: {
      filePath: string
      locations: { snippet: string; start: number; end: number }[]
    }[],
  ) => Promise<void>
  getCommits: (branch: string) => Promise<CommitItem[]>
  createPullRequest: (
    branch: string,
    title: string,
    body: string,
  ) => Promise<string>
  getUpdatedFiles: (branch: string, oldRef: string) => Promise<UpdateFile[]>
  repository: Repository
}
