/* eslint-disable no-await-in-loop -- ok*/
import path from 'node:path'
import fs from 'node:fs'
import type { Change } from 'diff'
import type { Repository } from '@harmony/util/src/types/branch'
import type { GithubCache } from '../cache/types'
import { GithubRepository } from './github'
import type { GitRepository, ContentOrDirectory } from './types'

interface LocalUpdate {
  oldContent: string
  newContent: string
  filePath: string
}
export class LocalGitRepository implements GitRepository {
  private commits: Record<string, LocalUpdate[]> = {}
  private githubRepo: GithubRepository

  constructor(
    public repository: Repository,
    gitCache: GithubCache,
    private filePath: string,
  ) {
    this.githubRepo = new GithubRepository(repository, gitCache)
  }

  public async getStarCount(): Promise<number> {
    return this.githubRepo.getStarCount()
  }

  public async getProjectUrl(): Promise<string> {
    return this.githubRepo.getProjectUrl()
  }

  public async getContentOrDirectory(
    _path: string,
    branch?: string,
  ): Promise<
    | ContentOrDirectory
    | { content: string; path: string }
    | ContentOrDirectory[]
  > {
    return this.githubRepo.getContentOrDirectory(_path, branch)
    // const content = await this.getContent(_path);
    // return {content, path: _path};
  }
  public async createBranch(): Promise<void> {
    return undefined
  }
  public async getBranchRef(branch: string): Promise<string> {
    return this.githubRepo.getBranchRef(branch)
  }
  public diffFiles(): Promise<Change[]> {
    throw new Error('Not implemented')
  }
  public getContent(file: string): Promise<string> {
    //return this.githubRepo.getContent(file, ref)
    const absolute = path.join(this.filePath, file)
    if (!fs.existsSync(absolute)) {
      throw new Error(`Invalid path ${absolute}`)
    }

    return new Promise<string>((resolve, reject) => {
      fs.readFile(absolute, 'utf-8', (err, data) => {
        if (err) {
          reject(new Error(err.message))
        }

        resolve(data)
      })
    })
  }

  public async getUpdatedFiles(branch: string, oldRef: string) {
    return this.githubRepo.getUpdatedFiles(branch, oldRef)
  }
  public async updateFilesAndCommit(
    branch: string,
    changes: {
      filePath: string
      newContent: string
    }[],
  ): Promise<void> {
    const updates: LocalUpdate[] = []

    for (const change of changes) {
      const contentText = await this.getContent(change.filePath)
      const newContent = change.newContent

      updates.push({
        oldContent: contentText,
        newContent,
        filePath: change.filePath,
      })
    }

    this.commits[branch] = updates
  }
  public getCommits(): Promise<
    { message: string; date: Date; author: string }[]
  > {
    throw new Error('Not implemented')
  }
  public async createPullRequest(branch: string): Promise<string> {
    const updates = this.commits[branch] as LocalUpdate[] | undefined
    if (!updates) {
      throw new Error('Cannot find updates')
    }
    for (const update of updates) {
      const file = path.join(this.filePath, update.filePath)
      fs.writeFileSync(file, update.newContent, 'utf8')
    }

    return ''
  }
}
