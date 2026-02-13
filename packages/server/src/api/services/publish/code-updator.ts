import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { addDeleteComponentSchema } from '@harmony/util/src/updates/component'
import {
  getComponentIdsFromUpdates,
  parseUpdate,
} from '@harmony/util/src/updates/utils'
import type * as prettier from 'prettier'
import type { GitRepository } from '../../repository/git/types'
import { buildGraphForComponents } from '../indexor/indexor'
import { getGraph, type FileUpdateInfo, type FlowGraph } from '../indexor/graph'
import { updateClassName } from './updates/classname'
import type { UpdateInfo } from './updates/types'
import { updateAttribute } from './updates/update-attribute'
import { updateText } from './updates/text'
import { createUpdate } from './updates/create'
import { deleteUpdate } from './updates/delete'
import { reorderUpdate } from './updates/reorder'
import { propertyUpdate } from './updates/property'
import { updateStyle } from './updates/style'
import { getClassNameValue } from './updates/utils'
import { updateWrapUnwrap } from './updates/wrap'
import { camelToKebab, round } from '@harmony/util/src/utils/common'
import { nonFormattedCSS } from './css-conveter'
import { normalizeSortedUpdates } from '../component-update'
import type { PublisherMode, BuildContext } from './types'
import { ContextBuilder } from './context-builder'
import { FlowGraphContextWrapper } from './graph-context-wrapper'

export class CodeUpdator<T extends PublisherMode = 'code-update'> {
  constructor(
    private gitRepository: GitRepository,
    private options: prettier.Options,
    private mode: T = 'code-update' as T,
  ) {}

  public async updateFiles(
    updatesRaw: ComponentUpdate[],
  ): Promise<T extends 'code-update' ? FileUpdateInfo : BuildContext> {
    const updates = normalizeSortedUpdates(updatesRaw)

    const graph = await buildGraphForComponents(
      getComponentIdsFromUpdates(updates),
      this.gitRepository,
    )
    const tailwindFile = await this.gitRepository.getContent(
      this.gitRepository.repository.config.tailwindPath,
    )
    getGraph({
      file: this.gitRepository.repository.config.tailwindPath,
      code: tailwindFile,
      graph,
      importMappings: this.gitRepository.repository.config.packageResolution,
    })

    // Conditionally wrap graph for context building
    const contextBuilder = new ContextBuilder()
    const effectiveGraph =
      this.mode === 'build-context'
        ? new FlowGraphContextWrapper(graph, contextBuilder)
        : graph

    const updateInfo = await this.getUpdateInfo(updates)

    for (const info of updateInfo) {
      // Set current update context for wrapper to access
      if (this.mode === 'build-context') {
        ;(effectiveGraph as FlowGraphContextWrapper).setCurrentUpdate(info)
      }
      await this.getChangeAndLocation(info, effectiveGraph)
    }

    // Return based on mode
    if (this.mode === 'build-context') {
      return contextBuilder.build() as T extends 'code-update'
        ? FileUpdateInfo
        : BuildContext
    }

    const fileUpdates = await graph.getFileUpdates(this.options)

    return fileUpdates as T extends 'code-update'
      ? FileUpdateInfo
      : BuildContext
  }

  private async getUpdateInfo(
    updates: ComponentUpdate[],
  ): Promise<UpdateInfo[]> {
    const normalized = this.normalizeUpdates(updates)
    return Promise.all(
      normalized.map(async (update) => {
        //Get the css value if the update is a className
        const value =
          update.type === 'className'
            ? await getClassNameValue(
                update.name,
                update.value,
                update.formattedValue,
                this.gitRepository.repository.cssFramework,
                this.gitRepository.repository.config.tailwindConfig,
              )
            : update.value
        const oldValue =
          update.type === 'className'
            ? await getClassNameValue(
                update.name,
                update.oldValue,
                update.formattedValue,
                this.gitRepository.repository.cssFramework,
                this.gitRepository.repository.config.tailwindConfig,
              )
            : update.oldValue

        return {
          componentId: update.componentId,
          update,
          value,
          oldValue,
        }
      }),
    )
  }

  private normalizeUpdates(
    updates: ComponentUpdate[],
  ): (ComponentUpdate & { formattedValue: string })[] {
    return updates.reduce<(ComponentUpdate & { formattedValue: string })[]>(
      (prev, c) => {
        const curr = { ...c, formattedValue: '' }
        if (
          curr.type === 'className' &&
          !['font', ...nonFormattedCSS].includes(curr.name)
        ) {
          const cssName = camelToKebab(curr.name)
          if (curr.value.endsWith('px')) {
            //Round the pixel values
            const match = /^(-?\d+(?:\.\d+)?)(\D*)$/.exec(curr.value)
            if (match) {
              const value = parseFloat(match[1] || '0')
              const unit = match[2]
              curr.value = `${round(value)}${unit}`
            }
          }
          curr.formattedValue = `${cssName}:${curr.value};`

          const classNameUpdate = prev.find(
            (up) =>
              up.componentId === curr.componentId &&
              (up.childIndex === undefined ||
                up.childIndex === curr.childIndex) &&
              up.type === 'className',
          )
          if (classNameUpdate) {
            classNameUpdate.formattedValue += curr.formattedValue
            return prev
          }
        }

        prev.push(curr)
        return prev
      },
      [],
    )
  }

  private async getChangeAndLocation(
    update: UpdateInfo,
    graph: FlowGraph | FlowGraphContextWrapper,
  ): Promise<void> {
    const repository = this.gitRepository.repository

    switch (update.update.type) {
      case 'text':
        await updateText(update, graph, repository)
        break
      case 'className':
        await updateClassName(update, graph, repository)
        break
      case 'component':
        if (update.update.name === 'update-attribute') {
          await updateAttribute(update, graph, repository)
        } else if (update.update.name === 'delete-create') {
          const { action } = parseUpdate(addDeleteComponentSchema, update.value)
          if (action === 'create') {
            await createUpdate(update, graph, repository)
          } else {
            await deleteUpdate(update, graph, repository)
          }
        } else if (update.update.name === 'reorder') {
          await reorderUpdate(update, graph, repository)
        } else if (update.update.name === 'style') {
          await updateStyle(update, graph, repository)
        } else if (update.update.name === 'wrap-unwrap') {
          await updateWrapUnwrap(update, graph, repository)
        }
        break
      case 'property':
        await propertyUpdate(update, graph, repository)
        break
      default:
        throw new Error('Invalid use case')
    }
  }
}

export const getCodeUpdates = ({
  updates,
  gitRepository,
  prettierOptions,
  mode = 'code-update',
}: {
  updates: ComponentUpdate[]
  gitRepository: GitRepository
  prettierOptions: prettier.Options
  mode?: PublisherMode
}): Promise<FileUpdateInfo | BuildContext> => {
  const codeUpdator = new CodeUpdator(gitRepository, prettierOptions, mode)

  return codeUpdator.updateFiles(updates)
}
