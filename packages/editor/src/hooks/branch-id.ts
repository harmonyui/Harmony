import { useQueryStorageState } from '@harmony/ui/src/hooks/query-storage-state'
import { useCallback } from 'react'
import { useHarmonyStore } from './state'

export const useBranchId = () => {
  const [branchId, setBranchId] = useQueryStorageState<string>({
    key: 'branch-id',
  })
  const setBranch = useHarmonyStore((state) => state.setBranch)

  const _setBranchId = useCallback(
    (branch: { name: string; id: string; label: string } | undefined) => {
      setBranch(branch)
      setBranchId(branch?.id)
    },
    [setBranch],
  )

  return { branchId, setBranchId: _setBranchId }
}
