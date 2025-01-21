import { useQueryStorageState } from '@harmony/ui/src/hooks/query-storage-state'

export const useBranchId = () => {
  const [branchId, setBranchId] = useQueryStorageState<string>({
    key: 'branch-id',
  })

  return { branchId, setBranchId }
}
