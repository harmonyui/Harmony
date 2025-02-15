import { Repository } from '@harmony/util/src/types/branch'
import { createClient } from '../trpc'
import { updateFileContent } from './get-files'

export const writeRepository = async (
  path: string,
  repositoryId: string | undefined,
): Promise<void> => {
  let repository: Repository = {
    id: '',
    branch: '',
    name: '',
    owner: '',
    ref: '',
    installationId: 0,
    cssFramework: 'tailwind',
    tailwindPrefix: '',
    tailwindConfig: '{}',
    defaultUrl: 'http://localhost:3000',
    prettierConfig:
      '{"trailingComma":"es5","semi":true,"tabWidth":2,"singleQuote":true,"jsxSingleQuote":true}',
    config: {
      tailwindPath: 'tailwind.config.ts',
      packageResolution: {},
    },
    registry: {},
  }

  if (repositoryId) {
    const serverClient = createClient({
      environment: 'production',
      getToken: async () => '',
      isLocal: true,
    })
    repository = await serverClient.editor.getRepository.query({
      repositoryId,
    })
  }

  updateFileContent('harmony.config.json', path, JSON.stringify(repository))
}
