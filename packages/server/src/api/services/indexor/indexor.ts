import type {
  ComponentProp,
  HarmonyComponentInfo,
} from '@harmony/util/src/types/component'
import {
  getFileContentsFromComponents,
  getLevelId,
  getLocationsFromComponentId,
} from '@harmony/util/src/utils/component'
import { getFileContents } from '@harmony/util/src/utils/common'
import type { GithubCache } from '../../repository/cache/types'
import type { GitRepository } from '../../repository/git/types'
import type { HarmonyComponent, HarmonyContainingComponent } from './types'
import { IndexingFiles } from './github'
import { getGraph, FlowGraph } from './graph'
import { JSXElementNode } from './nodes/jsx-element'
import {
  getAttributeName,
  getLiteralValue,
  isChildNode,
  isLiteralNode,
} from './utils'

export type ReadFiles = (
  dirname: string,
  regex: RegExp,
  callback: (filename: string, content: string) => void,
) => Promise<void>

export const indexFiles = async (
  files: string[],
  readFile: (filepath: string) => Promise<string>,
  importMappings: Record<string, string>,
): Promise<
  | {
      elementInstance: HarmonyComponent[]
      componentDefinitions: Record<string, HarmonyContainingComponent>
    }
  | false
> => {
  const componentDefinitions: Record<string, HarmonyContainingComponent> = {}
  const instances: HarmonyComponent[] = []
  const fileContents = await getFileContents(files, readFile)

  const elementInstance = getCodeInfoAndNormalizeFromFiles(
    fileContents,
    instances,
    importMappings,
  )

  if (!elementInstance) return false

  return { elementInstance, componentDefinitions }
}

export const indexCodebase = async (
  dirname: string,
  gitRepository: GitRepository,
  gitCache: GithubCache,
) => {
  const instances: HarmonyComponent[] = []

  const indexingFiles = new IndexingFiles(gitRepository, gitCache)
  const fileContents = await indexingFiles.getIndexingFilesAndContent(dirname)

  const elementInstances = getCodeInfoAndNormalizeFromFiles(
    fileContents,
    instances,
    gitRepository.repository.config.packageResolution,
  )
  return elementInstances
}

export async function indexForComponents(
  componentIds: string[],
  gitRepository: GitRepository,
): Promise<HarmonyComponent[]> {
  const readFile = async (filepath: string) => {
    //TOOD: Need to deal with actual branch probably at some point
    const content = await gitRepository.getContent(filepath)

    return content
  }

  //TODO: This does not follow the file up the whole tree which means it does not know
  // all of the possible locations an attribute can be saved. Find a better way to do this
  const locations = componentIds.flatMap((componentId) =>
    getLocationsFromComponentId(componentId),
  )
  const paths = locations.map((location) => location.file)
  const result = await indexFiles(
    paths,
    readFile,
    gitRepository.repository.config.packageResolution,
  )
  if (!result) return []

  return result.elementInstance
}

export async function buildGraphForComponents(
  componentIds: string[],
  gitRepository: GitRepository,
): Promise<FlowGraph> {
  const readFile = async (filepath: string) => {
    const content = await gitRepository.getContent(filepath)

    return content
  }

  const fileContents = await getFileContentsFromComponents(
    componentIds,
    readFile,
  )

  return buildGraphFromFiles(
    fileContents,
    gitRepository.repository.config.packageResolution,
  )
}

export function formatComponentAndErrors(
  elementInstances: false | HarmonyComponent[],
) {
  if (elementInstances) {
    const errorElements = findErrorElements(elementInstances)
    const harmonyComponents = convertToHarmonyInfo(elementInstances)

    return { errorElements, harmonyComponents }
  }

  return { errorElements: [], harmonyComponents: [] }
}

export function convertToHarmonyInfo(
  elementInstances: HarmonyComponent[],
): HarmonyComponentInfo[] {
  const componentMap: Record<string, HarmonyComponentInfo> = {}
  return elementInstances
    .filter((i) => !i.isComponent)
    .map((instance) => {
      const getBaseId = (id: string): string => {
        const split = id.split('#')
        return split[split.length - 1]
      }

      const isRootElement =
        getBaseId(instance.containingComponent!.children[0]) ===
        getBaseId(instance.id)
      const parentComponent = instance.getParent()

      const component = {
        id: instance.id,
        isComponent: isRootElement,
        name: isRootElement
          ? instance.containingComponent!.name
          : instance.name,
        props: instance.props.map<ComponentProp>((prop) => ({
          isEditable: prop.name === 'string',
          name: getAttributeName(prop),
          defaultValue: prop.value.split(':')[1] ?? '',
          values: {},
          mappingType: prop.type === 'text' ? 'text' : 'attribute',
          mapping: instance.id,
          type: getAttributeName(prop) === 'src' ? 'image' : 'string',
        })),
      }

      if (isRootElement && parentComponent) {
        componentMap[parentComponent.id] = component
      }

      const parentComponentInfo = parentComponent
        ? componentMap[parentComponent.id]
        : undefined

      if (parentComponentInfo) {
        instance.props.forEach((prop) => {
          if (prop.name !== 'property') return

          const componentProperty = parentComponent?.props.find(
            (parentProp) =>
              parentProp.name === 'string' &&
              parentProp.value.split(':')[0] === prop.value.split(':')[0],
          )
          if (componentProperty) {
            parentComponentInfo.props.push({
              isEditable: true,
              name: getAttributeName(componentProperty),
              defaultValue: componentProperty.value.split(':')[1] ?? '',
              values: {},
              mappingType: prop.type === 'text' ? 'text' : 'attribute',
              mapping: instance.id,
              type: getAttributeName(prop) === 'src' ? 'image' : 'string',
            })
          }
        })
      }

      return component
    })
}

function findErrorElements(
  elementInstances: HarmonyComponent[],
): (HarmonyComponent & { type: string })[] {
  const textAttributeErrors = elementInstances.filter(
    (instance) =>
      instance.props.find((attr) => attr.type === 'text') &&
      !instance.props.find(
        (attr) => attr.type === 'text' && attr.name === 'string',
      ),
  )

  const errors = textAttributeErrors.map((attr) => ({
    ...attr,
    type: 'text',
  }))

  return errors.filter((a) => errors.filter((b) => a.id === b.id).length < 2)
}

interface FileAndContent {
  file: string
  content: string
}
export function getCodeInfoAndNormalizeFromFiles(
  files: FileAndContent[],
  elementInstances: HarmonyComponent[],
  importMappings: Record<string, string>,
): HarmonyComponent[] | false {
  try {
    const graph = buildGraphFromFiles(files, importMappings)

    elementInstances.push(...convertGraphToHarmonyComponents(graph))
  } catch (err) {
    console.log(err)
    throw err
  }

  return elementInstances
}

export function buildGraphFromFiles(
  files: FileAndContent[],
  importMappings: Record<string, string>,
): FlowGraph {
  const graph = new FlowGraph(importMappings)
  for (const { file, content } of files) {
    getCodeInfoFromFile(file, content, graph)
  }

  return graph
}

function getCodeInfoFromFile(
  file: string,
  originalCode: string,
  graph: FlowGraph,
) {
  getGraph({ file, code: originalCode, graph, importMappings: {} })

  return true
}

type HarmonyComponentTemp = HarmonyComponent
type AttributeTemp = HarmonyComponentTemp['props'][number]
function normalizeCodeInfo(
  elementInstances: HarmonyComponentTemp[],
): HarmonyComponent[] {
  const harmonyComponents: HarmonyComponent[] = elementInstances.map(
    (instance) => ({ ...instance, props: [] }),
  )
  for (let i = 0; i < harmonyComponents.length; i++) {
    const instance = harmonyComponents[i]
    for (const attribute of elementInstances[i].props) {
      instance.props.push(attribute)
    }
  }

  //Sort the instances parents first.
  return harmonyComponents
}

export const convertGraphToHarmonyComponents = (
  graph: FlowGraph,
): HarmonyComponent[] => {
  const components: HarmonyComponentTemp[] = []

  const getIdFromParents = (instances: JSXElementNode[]): string => {
    const ids = instances.reduce(
      (prev, curr) => (prev ? `${curr.id}#${prev}` : curr.id),
      '',
    )

    return ids
  }

  const elementInstances = graph
    .getNodes()
    .filter((node) => node instanceof JSXElementNode)
  try {
    for (const node of elementInstances) {
      const rootInstances = node.getRootInstances()
      for (let i = 0; i < rootInstances.length; i++) {
        const instances = rootInstances[i]
        const containingComponent = node.getParentComponent()
        const ids = instances.map((instance, i) =>
          getIdFromParents([instance, ...instances.slice(i + 1)]),
        )
        const id = getIdFromParents(instances)
        const mappingIndexes = node
          .getMappingExpression()
          .filter((parent) =>
            instances.find((_parent) => parent.parent === _parent),
          )
        if (mappingIndexes.length > 1) {
          throw new Error('Should not have more than one array property')
        }
        if (mappingIndexes.length === 0) {
          mappingIndexes.push({
            parent: instances[0],
            values: [-1],
          })
        } else if (
          mappingIndexes.length === 1 &&
          mappingIndexes[0].values.length === 0
        ) {
          mappingIndexes[0].values.push(-1)
        }
        for (const index of mappingIndexes[0].values) {
          node.setMappingIndex(index)
          const component: HarmonyComponentTemp = {
            id,
            childIndex: index > -1 ? index : undefined,
            name: node.name,
            containingComponent: {
              id: containingComponent.id,
              name: containingComponent.name,
              location: containingComponent.location,
              isComponent: true,
              node: containingComponent.node,
              props: [],
              children: containingComponent.getJSXElements().map((el) => el.id),
              getParent: () => undefined,
            },
            isComponent: node.name[0].toUpperCase() === node.name[0],
            location: node.location,
            node: node.node,
            props: [],
            children: [],
            getParent: () => components.find((comp) => comp.id === ids[1]),
          }
          const childComponents = components.filter(
            (component) => getLevelId(component.id, 1) === id,
          )
          childComponents.forEach((child) => {
            child.getParent = () => component
          })
          component.props = node
            .getAttributes()
            .flatMap<AttributeTemp>((attr) => {
              const name = attr.getName()
              const type =
                name === 'className'
                  ? 'className'
                  : name === 'children'
                    ? 'text'
                    : 'property'
              const attrs: AttributeTemp[] = []
              attrs.push(
                ...attr
                  .getDataFlowWithParents()
                  .filter(({ parent }) =>
                    instances.find(
                      (parentInstance) => parent === parentInstance,
                    ),
                  )
                  .flatMap<AttributeTemp>(({ values, parent }) =>
                    values.map<AttributeTemp>((flow) => ({
                      id: attr.id,
                      index: attr.getChildIndex(),
                      location: flow.location,
                      locationType: 'component',
                      name: isLiteralNode(flow.node) ? 'string' : 'property',
                      value: `${name}:${isLiteralNode(flow.node) ? getLiteralValue(flow.node) : ''}`,
                      type,
                      reference:
                        ids[
                          instances.findIndex((_parent) => parent === _parent)
                        ],
                      node: flow.node,
                    })),
                  ),
              )

              const { identifiers } = attr.getArgumentReferences()
              attrs.push(
                ...identifiers
                  .map<AttributeTemp | undefined>((reference) => {
                    const isAddIdentifier =
                      instances.length > 1 &&
                      reference.getValues((_node) =>
                        isChildNode(_node, instances[1]),
                      ).length === 0
                    if (isAddIdentifier) {
                      if (type === 'text') return undefined

                      return {
                        id: attr.id,
                        index: attr.getChildIndex(),
                        location: instances[1].getOpeningElement().location,
                        locationType: 'add',
                        name: 'string',
                        value: reference.name,
                        type,
                        reference: ids[1],
                        node: instances[1].getOpeningElement().node,
                      }
                    }

                    return {
                      id: attr.id,
                      index: attr.getChildIndex(),
                      location: reference.location,
                      locationType: 'component',
                      name: 'property',
                      value: reference.name,
                      type,
                      reference: ids[0],
                      node: reference.node,
                    }
                  })
                  .filter((attr) => attr !== undefined),
              )

              //If no data flow, then it is a dynamic value
              if (attrs.length === 0) {
                attrs.push({
                  id: attr.id,
                  index: attr.getChildIndex(),
                  location: attr.getValueNode().location,
                  locationType: 'component',
                  name: 'property',
                  value: `${name}:`,
                  type,
                  node: attr.getValueNode().node,
                })
              }

              return attrs
            })

          components.push(component)
        }
      }
    }
  } catch (err) {
    console.log(err)
    throw err
  }
  return normalizeCodeInfo(components)
}
