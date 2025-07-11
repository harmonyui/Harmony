import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { translateUpdatesToCss } from '@harmony/util/src/utils/component'
import type { BranchItem, PullRequest } from '@harmony/util/src/types/branch'
import type prettier from 'prettier'
import type { GitRepository } from '../../repository/git/types'
import { createPullRequest } from '../../repository/database/pull-request'
import { getCodeUpdates } from './code-updator'

export class Publisher {
  constructor(private gitRepository: GitRepository) {}

  public async publishChanges(
    updatesRaw: ComponentUpdate[],
    branch: BranchItem,
    pullRequest: { title: string; body: string },
  ): Promise<PullRequest | undefined> {
    const updates = prepareUpdatesForGenerator(updatesRaw)

    const configOptions = this.gitRepository.repository.config
      .prettierConfig as prettier.Options
    const fileUpdates = await getCodeUpdates({
      updates,
      gitRepository: this.gitRepository,
      prettierOptions: configOptions,
    })

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

    return newPullRequest
  }

  public async updateChanges(updatesRaw: ComponentUpdate[]) {
    const _updates = prepareUpdatesForGenerator(updatesRaw)

    const configOptions = this.gitRepository.repository.config
      .prettierConfig as prettier.Options
    const fileUpdates = await getCodeUpdates({
      updates: _updates,
      gitRepository: this.gitRepository,
      prettierOptions: configOptions,
    })

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

    return updates
  }
}

export function prepareUpdatesForGenerator(
  updates: ComponentUpdate[],
): ComponentUpdate[] {
  //TODO: old value is not updated properly for size and spacing
  const updatesTranslated = translateUpdatesToCss(updates)

  return updatesTranslated
}
