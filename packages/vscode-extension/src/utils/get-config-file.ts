import {
  RepositoryConfig,
  repositoryConfigSchema,
} from '@harmony/util/src/types/branch'
import { getFileContentOrEmpty } from './get-files'
import { jsonSchema } from '@harmony/util/src/updates/component'

export const getConfigFile = (path: string): RepositoryConfig | undefined => {
  const configFileContents = getFileContentOrEmpty('harmony.config.json', path)
  if (!configFileContents) {
    return undefined
  }

  const parseResult = jsonSchema
    .pipe(repositoryConfigSchema)
    .safeParse(configFileContents)

  return parseResult.data
}
