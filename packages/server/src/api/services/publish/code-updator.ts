import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { camelToKebab } from '@harmony/util/src/utils/common'
import { addDeleteComponentSchema } from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import type { GitRepository } from '../../repository/git/types'
import { buildGraphForComponents } from '../indexor/indexor'
import type { FileUpdateInfo, FlowGraph } from '../indexor/graph'
import { converter } from './css-conveter'
import { updateClassName } from './updates/classname'
import type { CodeUpdateInfo, UpdateInfo } from './updates/types'
import { updateAttribute } from './updates/update-attribute'
import { updateText } from './updates/text'
import { createUpdate } from './updates/create'
import { deleteUpdate } from './updates/delete'

export class CodeUpdator {
  constructor(private gitRepository: GitRepository) {}

  public async updateFiles(
    updates: ComponentUpdate[],
  ): Promise<FileUpdateInfo> {
    const graph = await buildGraphForComponents(
      updates.map((update) => update.componentId),
      this.gitRepository,
    )

    const updateInfo = await this.getUpdateInfo(updates)

    updateInfo.forEach((info) => this.getChangeAndLocation(info, graph))
    const codeUpdates: CodeUpdateInfo[] = []
    codeUpdates.sort((a, b) => a.location.start - b.location.start)

    const fileUpdates = graph.getFileUpdates()

    return fileUpdates
  }

  private async getUpdateInfo(
    updates: ComponentUpdate[],
  ): Promise<UpdateInfo[]> {
    const updateInfo: UpdateInfo[] = []

    await Promise.all(
      updates.map(async (update) => {
        //Get the css value if the update is a className
        const value =
          update.type === 'className' &&
          this.gitRepository.repository.cssFramework === 'tailwind'
            ? await convertCSSToTailwind(update.name, update.value)
            : update.value
        const oldValue =
          update.type === 'className' &&
          this.gitRepository.repository.cssFramework === 'tailwind'
            ? await convertCSSToTailwind(update.name, update.oldValue)
            : update.oldValue

        updateInfo.push({
          componentId: update.componentId,
          update,
          value,
          oldValue,
        })
      }),
    )

    return updateInfo
  }

  private getChangeAndLocation(update: UpdateInfo, graph: FlowGraph) {
    const repository = this.gitRepository.repository

    switch (update.update.type) {
      case 'text':
        updateText(update, graph, repository)
        break
      case 'className':
        updateClassName(update, graph, repository)
        break
      case 'component':
        if (update.update.name === 'update-attribute') {
          updateAttribute(update, graph, repository)
        } else if (update.update.name === 'delete-create') {
          const { action } = parseUpdate(addDeleteComponentSchema, update.value)
          if (action === 'create') {
            createUpdate(update, graph, repository)
          } else {
            deleteUpdate(update, graph, repository)
          }
        }
        break
      default:
        throw new Error('Invalid use case')
    }
  }
}

const convertCSSToTailwind = async (propertyName: string, value: string) => {
  const converted = await converter.convertCSS(`.example {
        ${camelToKebab(propertyName)}: ${value}
    }`)
  return converted.nodes.reduce(
    (prev, curr) => prev + curr.tailwindClasses.join(' '),
    '',
  )
}
