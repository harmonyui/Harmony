/* eslint-disable no-await-in-loop -- ok*/
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { translateUpdatesToCss } from '@harmony/util/src/utils/component'
import type { BranchItem, PullRequest } from '@harmony/util/src/types/branch'
import type prettier from 'prettier'
import type { GitRepository } from '../../repository/git/types'
import { createPullRequest } from '../../repository/database/pull-request'
import { CodeUpdator } from './code-updator'

export class Publisher {
  constructor(private gitRepository: GitRepository) {}

  public async publishChanges(
    updatesRaw: ComponentUpdate[],
    branch: BranchItem,
    pullRequest: { title: string; body: string },
    isLocal: boolean,
  ): Promise<PullRequest | undefined> {
    const updates = prepareUpdatesForGenerator(updatesRaw)

    const configOptions = JSON.parse(
      this.gitRepository.repository.prettierConfig,
    ) as prettier.Options
    const codeUpdator = new CodeUpdator(this.gitRepository, configOptions)
    const fileUpdates = await codeUpdator.updateFiles(updates)

    await this.gitRepository.createBranch(branch.name)
    await this.gitRepository.updateFilesAndCommit(
      branch.name,
      Object.values(fileUpdates),
    )

    if (isLocal) {
      await this.gitRepository.createPullRequest(
        branch.name,
        pullRequest.title,
        pullRequest.body,
      )
    } else {
      const newPullRequest = await createPullRequest({
        branch,
        pullRequest,
        gitRepository: this.gitRepository,
      })

      return newPullRequest
    }
  }

  public async updateChanges(updatesRaw: ComponentUpdate[]) {
    const _updates = prepareUpdatesForGenerator(updatesRaw)

    const codeUpdator = new CodeUpdator(this.gitRepository, {
      trailingComma: 'es5',
      semi: true,
      tabWidth: 2,
      singleQuote: true,
      jsxSingleQuote: true,
    })
    const fileUpdates = await codeUpdator.updateFiles(_updates)

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
