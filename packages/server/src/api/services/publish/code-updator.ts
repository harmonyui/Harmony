import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { camelToKebab } from '@harmony/util/src/utils/common'
import { getBaseId } from '@harmony/util/src/utils/component'
import type { GitRepository } from '../../repository/git/types'
import { buildGraphForComponents } from '../indexor/indexor'
import type { JSXElementNode } from '../indexor/nodes/jsx-element'
import { isJSXElement } from '../indexor/nodes/jsx-element'
import type { FileUpdateInfo, FlowGraph } from '../indexor/graph'
import { converter } from './css-conveter'
import { updateClassName } from './updates/classname'
import type { CodeUpdateInfo, UpdateInfo } from './updates/types'
import { updateAttribute } from './updates/update-attribute'
import { updateText } from './updates/text'

export class CodeUpdator {
  constructor(private gitRepository: GitRepository) {}

  public async updateFiles(
    updates: ComponentUpdate[],
  ): Promise<FileUpdateInfo> {
    const graph = await buildGraphForComponents(
      updates.map((update) => update.componentId),
      this.gitRepository,
    )

    const updateInfo = await this.getUpdateInfo(updates, graph)

    updateInfo.forEach((info) => this.getChangeAndLocation(info, graph))
    const codeUpdates: CodeUpdateInfo[] = []
    codeUpdates.sort((a, b) => a.location.start - b.location.start)

    const fileUpdates = graph.getFileUpdates()

    return fileUpdates
  }

  private async getUpdateInfo(
    updates: ComponentUpdate[],
    graph: FlowGraph,
  ): Promise<UpdateInfo[]> {
    const updateInfo: UpdateInfo[] = []
    const elements = graph.getNodes().filter(isJSXElement)
    const setMappingIndex = (
      element: JSXElementNode,
      componentId: string,
      index: number,
    ) => {
      const mappingIndexes = element.getMappingExpression(componentId)
      const allIndexes = mappingIndexes.reduce<number[]>(
        (prev, curr) => [...prev, ...curr.values],
        [],
      )
      if (allIndexes.includes(index)) {
        element.setMappingIndex(index)
      }
    }
    await Promise.all(
      updates.map(async (update) => {
        const baseId = getBaseId(update.componentId)

        const element = elements.find((_element) => _element.id === baseId)
        if (!element) throw new Error('Element not found')

        const instances = element.getRootInstances(update.componentId)
        if (!instances) throw new Error('Instances not found')

        setMappingIndex(element, update.componentId, update.childIndex)
        const attributes = element
          .getAttributes(update.componentId)
          .map((attribute) => ({
            attribute,
            elementValues: attribute.getDataFlowWithParents(update.componentId),
            addArguments:
              instances.length > 1
                ? attribute
                    .getArgumentReferences(instances[1])
                    .identifiers.map((identifier) => ({
                      parent: instances[1],
                      propertyName: identifier.name,
                    }))
                : [],
          }))

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
          graphElements: instances,
          attributes,
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
