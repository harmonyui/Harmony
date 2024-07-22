/* eslint-disable no-await-in-loop -- ok*/
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { translateUpdatesToCss } from '@harmony/util/src/utils/component'
import type { BranchItem, PullRequest } from '@harmony/util/src/types/branch'
import { replaceByIndex } from '@harmony/util/src/utils/common'
import type { GitRepository } from '../../repository/git/types'
import { createPullRequest } from '../../repository/database/pull-request'
import { CodeUpdator } from './code-updator'

export type ComponentUpdateWithDate = ComponentUpdate & { dateModified: Date }

export class Publisher {
  constructor(private gitRepository: GitRepository) {}

  public async publishChanges(
    updatesRaw: ComponentUpdateWithDate[],
    branch: BranchItem,
    pullRequest: { title: string; body: string },
  ): Promise<PullRequest> {
    const updates = prepareUpdatesForGenerator(updatesRaw)

    const codeUpdator = new CodeUpdator(this.gitRepository)
    const fileUpdates = await codeUpdator.updateFiles(updates)

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

    return newPullRequest
  }

  public async updateChanges(updatesRaw: ComponentUpdateWithDate[]) {
    const _updates = prepareUpdatesForGenerator(updatesRaw)

    const codeUpdator = new CodeUpdator(this.gitRepository)
    const fileUpdates = await codeUpdator.updateFiles(_updates)

    const updates: {
      oldContent: string
      newContent: string
      filePath: string
    }[] = []
    for (const change of Object.values(fileUpdates)) {
      const contentText = await this.gitRepository.getContent(change.filePath)

      let newContent = contentText
      for (const location of change.locations) {
        newContent = replaceByIndex(
          newContent,
          location.snippet,
          location.start,
          location.end,
        )
      }

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
  updatesRaw: ComponentUpdateWithDate[],
): ComponentUpdate[] {
  const updates = normalizeRecentUpdates(updatesRaw)

  //TODO: old value is not updated properly for size and spacing
  const updatesTranslated = translateUpdatesToCss(updates)

  return updatesTranslated
}

export function normalizeRecentUpdates(
  updates: ComponentUpdateWithDate[],
): ComponentUpdateWithDate[] {
  const ascUpdates = updates
    .slice()
    .sort((a, b) => a.dateModified.getTime() - b.dateModified.getTime())
  return ascUpdates.reduce<ComponentUpdateWithDate[]>((prev, curr) => {
    const prevUpdateIndex = prev.findIndex(
      (p) =>
        p.type === curr.type &&
        p.name === curr.name &&
        p.componentId === curr.componentId,
    )
    //If there isn't a similar update, add this to the list
    if (prevUpdateIndex < 0) {
      prev.push(curr)
    } else {
      //Otherwise replace because we are doing ascending, so last one wins
      prev[prevUpdateIndex] = curr
    }

    return prev
  }, [])
}
