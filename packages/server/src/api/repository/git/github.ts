/* eslint-disable no-nested-ternary -- ok*/

/* eslint-disable no-await-in-loop -- ok*/
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import type { Octokit } from 'octokit'
import { App } from 'octokit'
import type { CommitItem, Repository } from '@harmony/util/src/types/branch'
import type { Change } from 'diff'
import { diffLines } from 'diff'
import type { components } from '@octokit/openapi-types'
import type { GithubCache } from '../cache/types'
import type {
  ContentOrDirectory,
  GitRepository,
  GitRepositoryFactory,
  UpdateFile,
} from './types'

const privateKeyPath = process.env.PRIVATE_KEY_PATH
const privateKeyEnv = process.env.PRIVATE_KEY
const privateKeyRaw = privateKeyEnv
  ? atob(privateKeyEnv)
  : fs.readFileSync(privateKeyPath || '')
const appId = process.env.GITHUB_APP_ID || ''

const privateKey = crypto.createPrivateKey(privateKeyRaw).export({
  type: 'pkcs8',
  format: 'pem',
}) as string

const app = new App({
  appId,
  privateKey,
})

export const appOctokit: Octokit = app.octokit

export class GithubRepositoryFactory implements GitRepositoryFactory {
  constructor(private githubCache: GithubCache) {}

  public createGitRepository(repository: Repository) {
    return new GithubRepository(repository, this.githubCache)
  }

  public createGithubCache(): GithubCache {
    return this.githubCache
  }
}

export class GithubRepository implements GitRepository {
  private octokit: Octokit | undefined
  private diffedFiles: Record<string, Change[]> = {}

  private async getOctokit(): Promise<Octokit> {
    if (this.octokit === undefined) {
      this.octokit = await app.getInstallationOctokit(
        this.repository.installationId,
      )
    }

    return this.octokit
  }

  constructor(
    public repository: Repository,
    private gitCache: GithubCache,
  ) {}

  public async getStarCount() {
    const octokit = await this.getOctokit()
    const { data } = await octokit.rest.repos.get({
      owner: this.repository.owner,
      repo: this.repository.name,
    })

    return data.stargazers_count
  }

  public async getProjectUrl() {
    const octokit = await this.getOctokit()
    const { data } = await octokit.rest.repos.get({
      owner: this.repository.owner,
      repo: this.repository.name,
    })

    return data.html_url
  }

  public async getContentOrDirectory(filePath: string, branchName?: string) {
    const octokit = await this.getOctokit()
    const refKey = branchName
      ? await this.getBranchRef(branchName)
      : this.repository.ref
    const cacheKey = {
      repo: this.repository.name,
      path: filePath,
      ref: refKey,
    }

    const cachedFile = await this.gitCache.getFileOrDirectoryContents(cacheKey)
    if (cachedFile) {
      if (typeof cachedFile === 'string') {
        return { content: this.decodeContent(cachedFile), path: filePath }
      }

      return cachedFile
    }

    const { data: fileInfo } = await octokit.rest.repos.getContent({
      owner: this.repository.owner,
      repo: this.repository.name,
      path: filePath,
      ref: branchName || this.repository.branch,
    })

    const cacheContent =
      'content' in fileInfo
        ? fileInfo.content
        : Array.isArray(fileInfo)
          ? fileInfo
          : [fileInfo]
    await this.gitCache.setFileOrDirectoryContents(cacheKey, cacheContent)

    return 'content' in fileInfo
      ? { content: this.decodeContent(fileInfo.content), path: fileInfo.path }
      : fileInfo
  }

  public async createBranch(newBranch: string) {
    const octokit = await this.getOctokit()
    // Get the latest commit SHA from the base branch
    const { data: baseBranchInfo } = await octokit.rest.repos.getBranch({
      owner: this.repository.owner,
      repo: this.repository.name,
      branch: this.repository.branch,
    })

    // Create a new branch based on the latest commit SHA
    await octokit.rest.git.createRef({
      owner: this.repository.owner,
      repo: this.repository.name,
      ref: `refs/heads/${newBranch}`,
      sha: baseBranchInfo.commit.sha,
    })
  }

  public async getBranchRef(branch: string): Promise<string> {
    const octokit = await this.getOctokit()
    const { data: refInfo } = await octokit.rest.git.getRef({
      ref: `heads/${branch}`,
      owner: this.repository.owner,
      repo: this.repository.name,
    })

    return refInfo.object.sha
  }

  public async diffFiles(branch: string, oldRef: string, file: string) {
    const hash = `${branch}:${oldRef}:${file}`
    const oldDiffs = this.diffedFiles[hash]
    if (oldDiffs) {
      return oldDiffs
    }

    const oldContent = await this.getContent(file, oldRef)
    const newContent = await this.getContent(file, branch)

    const diffs = diffLines(oldContent, newContent)

    this.diffedFiles[hash] = diffs

    return diffs
  }

  public async getUpdatedFiles(branch: string, oldRef: string) {
    const octokit = await this.getOctokit()
    const { data: commitData } = await octokit.rest.repos.compareCommits({
      owner: this.repository.owner,
      repo: this.repository.name,
      base: oldRef,
      head: branch,
    })
    const mapping: Record<
      components['schemas']['diff-entry']['status'],
      UpdateFile['type']
    > = {
      added: 'add',
      removed: 'remove',
      changed: 'change',
      copied: 'add',
      modified: 'change',
      renamed: 'add',
      unchanged: 'change',
    }

    const updateFiles: UpdateFile[] = []
    for (const file of commitData.files || []) {
      updateFiles.push({ path: file.filename, type: mapping[file.status] })
      if (file.status === 'renamed' && file.previous_filename) {
        updateFiles.push({ path: file.previous_filename, type: 'remove' })
      }
    }

    return updateFiles
  }

  public async getContent(file: string, ref?: string, rawContent = false) {
    const decodeContent = (content: string) => {
      if (rawContent) return content
      return this.decodeContent(content)
    }
    const octokit = await this.getOctokit()

    const cleanFile = file.startsWith('/') ? file.substring(1) : file

    const refKey = ref ? ref : this.repository.ref
    const cacheKey = {
      repo: this.repository.name,
      path: cleanFile,
      ref: refKey,
    }

    const cachedFile = await this.gitCache.getFileContents(cacheKey)
    if (cachedFile) {
      try {
        return decodeContent(cachedFile)
      } catch (err) {
        console.log(err)
      }
    }

    const { data: fileInfo } = await octokit.rest.repos.getContent({
      owner: this.repository.owner,
      repo: this.repository.name,
      path: cleanFile,
      ref: refKey,
    })

    if (Array.isArray(fileInfo)) {
      throw new Error('The given file path is a directory')
    }

    if (!('content' in fileInfo)) {
      throw new Error('File info does not have content')
    }

    await this.gitCache.setFileContents(cacheKey, fileInfo.content)

    const contentText = decodeContent(fileInfo.content)

    return contentText
  }

  public async updateFilesAndCommit(
    branch: string,
    changes: {
      filePath: string
      newContent: string
    }[],
  ) {
    const octokit = await this.getOctokit()

    // Get the latest commit SHA from the branch
    const { data: branchInfo } = await octokit.rest.repos.getBranch({
      owner: this.repository.owner,
      repo: this.repository.name,
      branch,
    })

    // Get the tree SHA associated with the latest commit
    const { data: commitInfo } = await octokit.rest.git.getCommit({
      owner: this.repository.owner,
      repo: this.repository.name,
      commit_sha: branchInfo.commit.sha,
    })

    // Create an array to store changes
    const treeChanges: {
      path: string
      mode: '100644'
      type: 'blob'
      sha: string
    }[] = []

    // Iterate through each change and update the files
    for (const change of changes) {
      // Get the content SHA of the existing file
      const contentText = change.newContent

      const { data: updatedFileInfo } = await octokit.rest.git.createBlob({
        owner: this.repository.owner,
        repo: this.repository.name,
        content: contentText, //Buffer.from(newContent).toString('base64'),
        encoding: 'utf-8',
      })

      // Update the content of the existing file
      // const { data: updatedFileInfo } = await octokit.rest.repos.createOrUpdateFileContents({
      //     owner: this.repository.owner,
      //     repo: this.repository.name,
      //     path: change.filePath,
      //     message: 'Update file content',
      //     content: Buffer.from(newContent).toString('base64'),
      //     branch,
      //     sha: fileInfo.sha,
      // });

      // Push changes to the array
      treeChanges.push({
        path: change.filePath,
        mode: '100644', // File mode
        type: 'blob',
        sha: updatedFileInfo.sha,
      })
    }

    // Create a new tree with all the changes
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: this.repository.owner,
      repo: this.repository.name,
      base_tree: commitInfo.tree.sha,
      tree: treeChanges,
    })

    // Create a new commit with the updated files
    const commit = await octokit.rest.git.createCommit({
      owner: this.repository.owner,
      repo: this.repository.name,
      message: 'Update files content',
      tree: newTree.sha,
      parents: [commitInfo.sha],
      committer: {
        name: 'Your Name',
        email: 'your.email@example.com',
      },
      author: { ...commitInfo.author },
    })

    // Update the branch reference to point to the new commit
    await octokit.rest.git.updateRef({
      owner: this.repository.owner,
      repo: this.repository.name,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
    })
  }

  public async getCommits(branch: string): Promise<CommitItem[]> {
    const octokit = await this.getOctokit()
    // Get the latest commit SHA of the master branch
    const masterBranch = 'master'
    const masterBranchResponse = await octokit.rest.repos.getBranch({
      owner: this.repository.owner,
      repo: this.repository.name,
      branch: masterBranch,
    })
    const masterCommitSha = masterBranchResponse.data.commit.sha

    // Get the latest commit SHA of the specified branch
    const branchResponse = await octokit.rest.repos.getBranch({
      owner: this.repository.owner,
      repo: this.repository.name,
      branch,
    })
    const branchCommitSha = branchResponse.data.commit.sha

    // Compare the two commits to get the list of commits in the branch that are ahead of master
    const comparisonResponse = await octokit.rest.repos.compareCommits({
      owner: this.repository.owner,
      repo: this.repository.name,
      base: masterCommitSha,
      head: branchCommitSha,
    })

    //return comparisonResponse.data.commits;

    const aheadCommits = comparisonResponse.data.commits.map<CommitItem>(
      (commit) => ({
        message: commit.commit.message,
        author: commit.commit.author?.name || '',
        date: new Date(commit.commit.author?.date || ''),
      }),
    )

    return aheadCommits
  }

  public async createPullRequest(branch: string, title: string, body: string) {
    const octokit = await this.getOctokit()
    const response = await octokit.rest.pulls.create({
      owner: this.repository.owner,
      repo: this.repository.name,
      title,
      body,
      base: this.repository.branch,
      head: branch,
    })

    return response.data.html_url
  }

  private decodeContent(content: string): string {
    //We have to do this fancy decoding because some special characters do not decode right
    //with atob
    return decodeURIComponent(
      atob(content)
        .split('')
        .map(function map(c) {
          return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`
        })
        .join(''),
    )
  }
}

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
    const updates = this.commits[branch]
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
