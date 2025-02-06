import { createClient } from '../trpc'
import { updateFileContent } from './get-files'

export const writeRepository = async (
  path: string,
  repositoryId: string,
): Promise<void> => {
  const serverClient = createClient({
    environment: 'production',
    getToken: async () => '',
    isLocal: true,
  })
  const repository = await serverClient.editor.getRepository.query({
    repositoryId,
  })

  updateFileContent('harmony.config.json', path, JSON.stringify(repository))
}
