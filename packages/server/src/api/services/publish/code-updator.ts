import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { addDeleteComponentSchema } from '@harmony/util/src/updates/component'
import {
  parseUpdate,
  createUpdate as createUpdateValue,
} from '@harmony/util/src/updates/utils'
import type * as prettier from 'prettier'
import type { ClassNameValue } from '@harmony/util/src/updates/classname'
import type { GitRepository } from '../../repository/git/types'
import { buildGraphForComponents } from '../indexor/indexor'
import { getGraph, type FileUpdateInfo, type FlowGraph } from '../indexor/graph'
import { convertCSSToTailwind } from './css-conveter'
import { updateClassName } from './updates/classname'
import type { UpdateInfo } from './updates/types'
import { updateAttribute } from './updates/update-attribute'
import { updateText } from './updates/text'
import { createUpdate } from './updates/create'
import { deleteUpdate } from './updates/delete'
import { reorderUpdate } from './updates/reorder'
import { propertyUpdate } from './updates/property'
import { updateStyle } from './updates/style'

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
    const tailwindFile =
      await this.gitRepository.getContent('tailwind.config.ts')
    getGraph('tailwind.config.ts', tailwindFile, graph)

    const updateInfo = await this.getUpdateInfo(updates)

    for (const info of updateInfo) {
      // eslint-disable-next-line no-await-in-loop -- ok
      await this.getChangeAndLocation(info, graph)
    }

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

  private async getChangeAndLocation(
    update: UpdateInfo,
    graph: FlowGraph,
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
