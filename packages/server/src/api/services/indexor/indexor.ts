/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/
/* eslint-disable no-await-in-loop -- ok*/
import { prisma } from '@harmony/db/lib/prisma'
import type {
  ComponentProp,
  HarmonyComponentInfo,
} from '@harmony/util/src/types/component'
import { getLocationsFromComponentId } from '@harmony/util/src/utils/component'
import { PrismaHarmonyComponentRepository } from '../../repository/database/component-element'
import type { GithubCache } from '../../repository/cache/types'
import type { GitRepository } from '../../repository/git/types'
import type { HarmonyComponent, HarmonyContainingComponent } from './types'
import { IndexingFiles } from './github'
import { getAttributeName, getAttributeValue, getCodeInfoFromFile } from './ast'

export type ReadFiles = (
  dirname: string,
  regex: RegExp,
  callback: (filename: string, content: string) => void,
) => Promise<void>

export const indexFilesAndUpdateDatabase = async (
  files: string[],
  readFile: (filepath: string) => Promise<string>,
  repositoryId: string,
): Promise<HarmonyComponent[]> => {
  const result = await indexFiles(files, readFile)
  if (result) {
    await updateDatabase(
      result.componentDefinitions,
      result.elementInstance,
      repositoryId,
    )
    return result.elementInstance
  }

  return []
}

export const indexFiles = async (
  files: string[],
  readFile: (filepath: string) => Promise<string>,
): Promise<
  | {
      elementInstance: HarmonyComponent[]
      componentDefinitions: Record<string, HarmonyContainingComponent>
    }
  | false
> => {
  const componentDefinitions: Record<string, HarmonyContainingComponent> = {}
  const instances: HarmonyComponent[] = []
  const importDeclarations: Record<string, { name: string; path: string }> = {}
  const visitedFiles: Set<string> = new Set<string>()
  const fileContents: FileAndContent[] = []

  const visitPaths = async (filepath: string) => {
    if (visitedFiles.has(filepath)) return

    visitedFiles.add(filepath)
    const content = await readFile(filepath)
    fileContents.push({ file: filepath, content })
    // for (const componentName in importDeclarations) {
    // 	const {path: importPath, name} = importDeclarations[componentName];
    // 	const fullPath = path.join(filepath, importPath);
    // 	await visitPaths(fullPath);
    // }
  }

  for (const filepath of files) {
    await visitPaths(filepath)
  }

  const elementInstance = getCodeInfoAndNormalizeFromFiles(
    fileContents,
    componentDefinitions,
    instances,
    importDeclarations,
  )

  if (!elementInstance) return false

  return { elementInstance, componentDefinitions }
}

export const indexCodebase = async (
  dirname: string,
  gitRepository: GitRepository,
  gitCache: GithubCache,
) => {
  const componentDefinitions: Record<string, HarmonyContainingComponent> = {}
  const instances: HarmonyComponent[] = []

  const indexingFiles = new IndexingFiles(gitRepository, gitCache)
  const fileContents = await indexingFiles.getIndexingFilesAndContent(dirname)

  const elementInstances = getCodeInfoAndNormalizeFromFiles(
    fileContents,
    componentDefinitions,
    instances,
    {},
  )
  return elementInstances
}

export async function indexForComponents(
  componentIds: string[],
  gitRepository: GitRepository,
): Promise<HarmonyComponent[]> {
  const readFile = async (filepath: string) => {
    //TOOD: Need to deal with actual branch probably at some point
    const content = await gitRepository.getContent(
      filepath,
      gitRepository.repository.branch,
    )

    return content
  }

  //TODO: This does not follow the file up the whole tree which means it does not know
  // all of the possible locations an attribute can be saved. Find a better way to do this
  const locations = componentIds.flatMap((componentId) =>
    getLocationsFromComponentId(componentId),
  )
  const paths = locations.map((location) => location.file)
  const result = await indexFiles(paths, readFile)
  if (!result) return []

  return result.elementInstance
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
  return elementInstances
    .filter((i) => !i.isComponent)
    .map((instance) => {
      const getBaseId = (id: string): string => {
        const split = id.split('#')
        return split[split.length - 1]
      }

      const isRootElement =
        getBaseId(instance.containingComponent!.children[0].id) ===
        getBaseId(instance.id)
      return {
        id: instance.id,
        parentId: instance.getParent()?.id,
        isComponent: isRootElement,
        name: isRootElement
          ? instance.containingComponent!.name
          : instance.name,
        props: instance.props.map<ComponentProp>((prop) => ({
          isStatic: prop.name === 'string',
          propName: getAttributeName(prop),
          propValue: getAttributeValue(prop),
          type: prop.type,
          componentId: prop.reference.id,
        })),
      }
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
  componentDefinitions: Record<string, HarmonyContainingComponent>,
  elementInstances: HarmonyComponent[],
  importDeclarations: Record<string, { name: string; path: string }>,
): HarmonyComponent[] | false {
  for (const { file, content } of files) {
    try {
      if (
        !getCodeInfoFromFile(
          file,
          content,
          componentDefinitions,
          elementInstances,
          importDeclarations,
        )
      ) {
        return false
      }
    } catch (err) {
      console.log(err)
      throw err
    }
  }

  return normalizeCodeInfo(componentDefinitions, elementInstances)
}

function normalizeCodeInfo(
  componentDefinitions: Record<string, HarmonyContainingComponent>,
  elementInstances: HarmonyComponent[],
) {
  function getIdFromParents(instance: HarmonyComponent): string {
    const parent = instance.getParent()
    if (!parent) {
      return instance.id
    }

    if (parent.id.includes('#')) {
      return `${parent.id}#${instance.id}`
    }

    const parentId = getIdFromParents(parent)

    return `${parentId}#${instance.id}`
  }

  const findAttributeReference = (
    element: HarmonyComponent | undefined,
    attributeId: string,
  ): HarmonyComponent | undefined => {
    if (!element) return undefined

    const id = element.id.split('#')[element.id.split('#').length - 1]
    if (id === attributeId) {
      return element
    }

    return findAttributeReference(element.getParent(), attributeId)
  }

  for (let i = 0; i < elementInstances.length; i++) {
    const instance = elementInstances[i]
    instance.id = getIdFromParents(instance)
    for (const attribute of instance.props) {
      if (attribute.reference.id.split('#').length > 1) continue
      const newReference = findAttributeReference(
        instance,
        attribute.reference.id,
      )
      if (!newReference) {
        throw new Error('Reference should be pointer to an ancestor element')
      }
      attribute.reference = newReference
    }
  }

  //Sort the instances parents first.
  return elementInstances
}

//For future when mapping path alias will be a need
// function readTsConfig(tsConfigPath) {
// 	const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
// 	return tsConfig.compilerOptions.paths || {};
//   }

//   // Function to resolve path alias
//   function resolvePathAlias(alias, pathMappings) {
// 	// Find the alias in the pathMappings
// 	for (const [aliasKey, paths] of Object.entries(pathMappings)) {
// 	  if (alias.startsWith(aliasKey)) {
// 		const resolvedPath = alias.replace(aliasKey, paths[0]); // Use the first path mapping
// 		return path.resolve(resolvedPath);
// 	  }
// 	}
// 	return alias; // Return original alias if no mapping found
//   }
// const tsConfigPath = '/path/to/tsconfig.json';
// const aliasMappings = readTsConfig(tsConfigPath);

// // Resolve an alias
// const alias = '@harmony/ui/src/component';
// const resolvedPath = resolvePathAlias(alias, aliasMappings);

export async function updateDatabaseComponentDefinitions(
  elementInstances: HarmonyComponent[],
  repositoryId: string,
): Promise<void> {
  const containingComponents = elementInstances.reduce<
    HarmonyContainingComponent[]
  >((prev, curr) => {
    const def = prev.find((d) => d.id === curr.containingComponent?.id)
    if (!def) {
      prev.push(curr.containingComponent!)
    }

    return prev
  }, [])

  const alreadyCreated = await prisma.componentDefinition.findMany({
    where: {
      id: {
        in: containingComponents.map(({ id }) => id),
      },
    },
  })
  const newComponents = containingComponents.filter(
    (comp) => !alreadyCreated.find((already) => already.id === comp.id),
  )
  const newLocations = await prisma.location.createManyAndReturn({
    data: newComponents.map((component) => ({
      file: component.location.file,
      start: component.location.start,
      end: component.location.end,
    })),
  })

  await prisma.componentDefinition.createMany({
    data: newComponents.map((component, i) => ({
      id: component.id,
      repository_id: repositoryId,
      name: component.name,
      location_id: newLocations[i].id,
    })),
  })

  await Promise.all(
    containingComponents.map((component) =>
      prisma.componentDefinition.upsert({
        where: {
          id: component.id,
        },
        create: {
          id: component.id,
          repository_id: repositoryId,
          name: component.name,
          location: {
            create: {
              file: component.location.file,
              start: component.location.start,
              end: component.location.end,
            },
          },
        },
        update: {
          id: component.id,
          repository_id: repositoryId,
          name: component.name,
        },
      }),
    ),
  )
}

export async function updateDatabaseComponentErrors(
  elementInstances: HarmonyComponent[],
  repositoryId: string,
): Promise<void> {
  const errorElements = findErrorElements(elementInstances)

  //const componentElementRepository = new PrismaHarmonyComponentRepository(prisma);

  const ids = errorElements.map(({ id }) => id)
  const alreadyUpdated = await prisma.componentError.findMany({
    where: {
      component_id: {
        in: ids,
      },
      repository_id: repositoryId,
    },
  })
  const newErrorElements = errorElements.filter(
    (element) =>
      !alreadyUpdated.find(
        (already) =>
          already.component_id === element.id && already.type === element.type,
      ),
  )

  // await updateDatabaseComponentDefinitions(newErrorElements, repositoryId);
  // await componentElementRepository.createOrUpdateElements(newErrorElements, repositoryId);

  await prisma.componentError.createMany({
    data: newErrorElements.map((newEl) => ({
      component_id: newEl.id,
      repository_id: repositoryId,
      type: newEl.type,
    })),
  })
}

async function updateDatabase(
  componentDefinitions: Record<string, HarmonyContainingComponent>,
  elementInstances: HarmonyComponent[],
  repositoryId: string,
  onProgress?: (progress: number) => void,
) {
  elementInstances.sort(
    (a, b) => a.id.split('#').length - b.id.split('#').length,
  )
  await updateDatabaseComponentDefinitions(elementInstances, repositoryId)

  const componentElementRepository = new PrismaHarmonyComponentRepository(
    prisma,
  )

  for (let i = 0; i < elementInstances.length; i++) {
    const instance = elementInstances[i]
    await componentElementRepository.createOrUpdateElement(
      instance,
      repositoryId,
    )

    //await createElement(instance);
    onProgress && onProgress(i / elementInstances.length)
  }
}
