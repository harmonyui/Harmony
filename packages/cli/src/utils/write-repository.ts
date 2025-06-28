import { Repository, RepositoryConfig } from '@harmony/util/src/types/branch'
import { createClient } from '../trpc'
import { updateFileContent } from './get-files'

export const writeRepository = async (
  path: string,
  repositoryId: string | undefined,
): Promise<void> => {
  let repositoryConfig: RepositoryConfig = {
    tailwindPath: 'tailwind.config.ts',
    packageResolution: {},
    tailwindConfig: {},
    prettierConfig: {
      trailingComma: 'es5',
      semi: true,
      tabWidth: 2,
      singleQuote: true,
      jsxSingleQuote: true,
    },
  }

  if (repositoryId) {
    const serverClient = createClient({
      environment: 'production',
      getToken: async () => '',
      isLocal: true,
    })
    repositoryConfig = (
      await serverClient.editor.getRepository.query({
        repositoryId,
      })
    ).config
  }

  updateFileContent(
    'harmony.config.json',
    path,
    JSON.stringify(repositoryConfig),
  )
}
