import { Repository, repositorySchema } from '@harmony/util/src/types/branch'
import { getFileContentOrEmpty } from './get-files'
import { jsonSchema } from '@harmony/util/src/updates/component'

export const getConfigFile = (path: string): Repository | undefined => {
  const configFileContents = getFileContentOrEmpty('harmony.config.json', path)
  if (!configFileContents) {
    return undefined
  }

  return jsonSchema.pipe(repositorySchema).safeParse(configFileContents).data
}
