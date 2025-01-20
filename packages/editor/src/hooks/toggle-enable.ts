import { useHotKeys } from './hotkeys'
import { usePrevious } from '@harmony/ui/src/hooks/previous'
import { useQueryStorageState } from '@harmony/ui/src/hooks/query-storage-state'

export const useToggleEnable = () => {
  const [branchId, setBranchId] = useQueryStorageState<string | undefined>({
    key: 'branch-id',
  })
  const previousBranchId = usePrevious(branchId)
  useHotKeys('ctrl+shift+l, command+shift+l', () => {
    if (branchId === undefined && previousBranchId === undefined) {
      setBranchId('local')
    } else {
      setBranchId(previousBranchId)
    }
  })
}
