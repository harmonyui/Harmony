import type { Repository } from '@harmony/util/src/types/branch'
import { isValidPath } from '@harmony/util/src/utils/common'
import type { GitRepositoryFactory } from '../../repository/git/types'

export async function updateFileCache(
  gitFactory: GitRepositoryFactory,
  repository: Repository,
  oldRef: string,
  newRef: string,
) {
  const gitRepository = gitFactory.createGitRepository(repository)
  const gitCache = gitFactory.createGithubCache()

  const updatedFiles = (
    await gitRepository.getUpdatedFiles(repository.branch, oldRef)
  ).filter((file) => isValidPath(file.path))
  const indexedFiles = await gitCache.getIndexingFiles({
    ref: oldRef,
    repo: repository.name,
  })

  if (indexedFiles) {
    //Add or remove the file paths to the index
    updatedFiles.forEach(({ type, path }) => {
      if (type === 'add') {
        indexedFiles.push(path)
      } else if (type === 'remove') {
        const index = indexedFiles.indexOf(path)
        index >= 0 && indexedFiles.splice(index, 1)
      }
    })

    //Update contents
    await Promise.all(
      indexedFiles.map(async (indexedFile) => {
        const ref = updatedFiles.find((updated) => updated.path === indexedFile)
          ? newRef
          : oldRef
        const content = await gitRepository.getContent(
          indexedFile,
          ref.startsWith('http') ? undefined : ref,
          true,
        )
        await gitCache.setFileContents(
          { path: indexedFile, ref: newRef, repo: repository.name },
          content,
        )
      }),
    )

    await gitCache.setIndexingFiles(
      { ref: newRef, repo: repository.name },
      indexedFiles,
    )
  }
}
