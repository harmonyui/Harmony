import { useHotKeys } from './hotkeys'
import { usePrevious } from '@harmony/ui/src/hooks/previous'
import { useBranchId } from './branch-id'

export const useToggleEnable = () => {
  const { branchId, setBranchId } = useBranchId()
  const previousBranchId = usePrevious(branchId)
  useHotKeys('ctrl+shift+l, command+shift+l', () => {
    if (branchId === undefined && previousBranchId === undefined) {
      setBranchId('local')
    } else {
      setBranchId(previousBranchId)
    }
  })
}
