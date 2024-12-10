import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { camelToKebab } from '@harmony/util/src/utils/common'
import { addDeleteComponentSchema } from '@harmony/util/src/updates/component'
import {
  parseUpdate,
  createUpdate as createUpdateValue,
} from '@harmony/util/src/updates/utils'
import type * as prettier from 'prettier'
import type { ClassNameValue } from '@harmony/util/src/updates/classname'
import type { GitRepository } from '../../repository/git/types'
import { buildGraphForComponents } from '../indexor/indexor'
import type { FileUpdateInfo, FlowGraph } from '../indexor/graph'
import { convertCSSToTailwind, converter } from './css-conveter'
import { updateClassName } from './updates/classname'
import type { UpdateInfo } from './updates/types'
import { updateAttribute } from './updates/update-attribute'
import { updateText } from './updates/text'
import { createUpdate } from './updates/create'
import { deleteUpdate } from './updates/delete'
import { reorderUpdate } from './updates/reorder'
import { propertyUpdate } from './updates/property'

export class CodeUpdator {
  constructor(
    private gitRepository: GitRepository,
    private options: prettier.Options,
  ) {}

  public async updateFiles(
    updates: ComponentUpdate[],
  ): Promise<FileUpdateInfo> {
    const graph = await buildGraphForComponents(
      updates.map((update) => update.componentId),
      this.gitRepository,
    )
    const borderTest = await convertCSSToTailwind('borderColor', '#e5e7eb')

    const updateInfo = await this.getUpdateInfo(updates)

    updateInfo.forEach((info, i) => {
      console.log(i)
      this.getChangeAndLocation(info, graph)
    })

    const fileUpdates = await graph.getFileUpdates(this.options)

    return fileUpdates
  }

  private async getUpdateInfo(
    updates: ComponentUpdate[],
  ): Promise<UpdateInfo[]> {
    return Promise.all(
      updates.map(async (update) => {
        //Get the css value if the update is a className
        const value =
          update.type === 'className'
            ? await getClassNameValue(
                update.name,
                update.value,
                this.gitRepository.repository.cssFramework,
              )
            : update.value
        const oldValue =
          update.type === 'className'
            ? await getClassNameValue(
                update.name,
                update.oldValue,
                this.gitRepository.repository.cssFramework,
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
        } else if (update.update.name === 'reorder') {
          reorderUpdate(update, graph, repository)
        }
        break
      case 'property':
        propertyUpdate(update, graph, repository)
        break
      default:
        throw new Error('Invalid use case')
    }
  }
}

const getClassNameValue = async (
  name: string,
  value: string,
  cssFramework: string,
) => {
  if (name === 'class')
    return createUpdateValue<ClassNameValue>({ type: 'class', value })
  if (cssFramework !== 'tailwind')
    return createUpdateValue<ClassNameValue>({ type: 'style', value })

  const tailwindValue = await convertCSSToTailwind(name, value)
  if (!tailwindValue) {
    return createUpdateValue<ClassNameValue>({
      type: 'style',
      value,
    })
  }

  return createUpdateValue<ClassNameValue>({
    type: 'class',
    value: tailwindValue,
  })
}
