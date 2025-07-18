import type {
  CommitItem,
  Repository,
  RepositoryConfig,
} from '@harmony/util/src/types/branch'
import type { Change } from 'diff'
import type { ContentOrDirectory, GitRepository, UpdateFile } from './types'

type FileAndContent = {
  path: string
  content: string
}[]
export class CachedGitRepository implements GitRepository {
  public repository: Repository
  constructor(
    repositoryConfig: RepositoryConfig,
    private files: FileAndContent,
  ) {
    this.repository = {
      id: '',
      name: '',
      owner: '',
      branch: '',
      ref: '',
      installationId: 0,
      cssFramework: 'tailwind',
      defaultUrl: '',
      registry: {},
      config: repositoryConfig,
    }
  }
  public async getContentOrDirectory(): Promise<
    | ContentOrDirectory
    | ContentOrDirectory[]
    | { content: string; path: string }
  > {
    return []
  }
  public async createBranch(newBranch: string): Promise<void> {}
  public async getBranchRef(branch: string): Promise<string> {
    return ''
  }
  public async diffFiles(
    branch: string,
    oldRef: string,
    file: string,
  ): Promise<Change[]> {
    return []
  }
  public async getContent(file: string): Promise<string> {
    const content = this.files.find((f) => f.path === file)
    if (!content) {
      throw new Error(`File ${file} not found`)
    }
    return content.content
  }
  public async updateFilesAndCommit(
    branch: string,
    changes: { filePath: string; newContent: string }[],
  ): Promise<void> {}
  public async getCommits(branch: string): Promise<CommitItem[]> {
    return []
  }
  public async createPullRequest(
    branch: string,
    title: string,
    body: string,
  ): Promise<{ number: number; url: string }> {
    return {
      number: 0,
      url: '',
    }
  }
  public async getUpdatedFiles(
    branch: string,
    oldRef: string,
  ): Promise<UpdateFile[]> {
    return []
  }
  public async getStarCount(): Promise<number> {
    return 0
  }
  public async getProjectUrl(): Promise<string> {
    return ''
  }
  public async createComment() {}
}
