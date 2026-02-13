import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { translateUpdatesToCss } from '@harmony/util/src/utils/component'
import type { BranchItem, PullRequest } from '@harmony/util/src/types/branch'
import type prettier from 'prettier'
import type { GitRepository } from '../../repository/git/types'
import { createPullRequest } from '../../repository/database/pull-request'
import { getCodeUpdates } from './code-updator'
import type { PublisherOptions, BuildContext, PublisherMode } from './types'
import { formatPRD } from './prd-formatter'

export class Publisher<T extends PublisherMode = 'code-update'> {
  constructor(private gitRepository: GitRepository) {}

  public async publishChanges(
    updatesRaw: ComponentUpdate[],
    branch: BranchItem,
    pullRequest: { title: string; body: string },
    options: PublisherOptions<T> = {
      mode: 'code-update',
    } as PublisherOptions<T>,
  ): Promise<
    T extends 'code-update' ? PullRequest : { prd: string } | undefined
  > {
    const updates = prepareUpdatesForGenerator(updatesRaw)

    const configOptions = this.gitRepository.repository.config
      .prettierConfig as prettier.Options
    const result = await getCodeUpdates({
      updates,
      gitRepository: this.gitRepository,
      prettierOptions: configOptions,
      mode: options.mode,
    })

    // In build-context mode, generate and return PRD
    if (options.mode === 'build-context') {
      const prd = formatPRD(result as BuildContext)
      return { prd } as T extends 'code-update' ? PullRequest : { prd: string }
    }

    // In code-update mode, commit and create PR
    const fileUpdates = result as Record<
      string,
      { filePath: string; newContent: string }
    >

    await this.gitRepository.createBranch(branch.name)
    await this.gitRepository.updateFilesAndCommit(
      branch.name,
      Object.values(fileUpdates),
    )

    const newPullRequest = await createPullRequest({
      branch,
      pullRequest,
      gitRepository: this.gitRepository,
    })

    await this.gitRepository.createComment(
      newPullRequest.number,
      `<p><a href="${branch.url}?branch-id=${branch.id}">View Changes</a></p>`,
    )

    return newPullRequest as T extends 'code-update'
      ? PullRequest
      : { prd: string }
  }

  public async updateChanges(
    updatesRaw: ComponentUpdate[],
    options: PublisherOptions<T> = {
      mode: 'code-update',
    } as PublisherOptions<T>,
  ): Promise<
    T extends 'code-update'
      ? { oldContent: string; newContent: string; filePath: string }[]
      : { prd: string }
  > {
    const _updates = prepareUpdatesForGenerator(updatesRaw)

    const configOptions = this.gitRepository.repository.config
      .prettierConfig as prettier.Options
    const result = await getCodeUpdates({
      updates: _updates,
      gitRepository: this.gitRepository,
      prettierOptions: configOptions,
      mode: options.mode,
    })

    // In build-context mode, generate and return PRD
    if (options.mode === 'build-context') {
      const prd = formatPRD(result as BuildContext)
      return { prd } as T extends 'code-update'
        ? { oldContent: string; newContent: string; filePath: string }[]
        : { prd: string }
    }

    // In code-update mode, return file diffs
    const fileUpdates = result as Record<
      string,
      { filePath: string; newContent: string }
    >

    const updates: {
      oldContent: string
      newContent: string
      filePath: string
    }[] = []
    for (const change of Object.values(fileUpdates)) {
      const contentText = await this.gitRepository.getContent(change.filePath)

      const newContent = change.newContent

      updates.push({
        oldContent: contentText,
        newContent,
        filePath: change.filePath,
      })
    }

    return updates as T extends 'code-update'
      ? { oldContent: string; newContent: string; filePath: string }[]
      : { prd: string }
  }
}

export function prepareUpdatesForGenerator(
  updates: ComponentUpdate[],
): ComponentUpdate[] {
  //TODO: old value is not updated properly for size and spacing
  const updatesTranslated = translateUpdatesToCss(updates)

  return updatesTranslated
}
