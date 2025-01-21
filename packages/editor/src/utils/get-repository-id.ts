export const getRepositoryId = (): string | undefined => {
  if (
    document.body.dataset.harmonyRepositoryId &&
    typeof document.body.dataset.harmonyRepositoryId === 'string'
  ) {
    return atob(document.body.dataset.harmonyRepositoryId)
  }

  return undefined
}
