import type { PullRequestState } from './pull-request'
import type { ComponentUpdateState } from './component-update'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'

export interface ProjectInfoState {
  currentBranch: { name: string; id: string }
  repositoryId: string
  branches: { name: string; id: string }[]
  showWelcomeScreen: boolean
  isDemo: boolean
  isInitialized: boolean
  updateWelcomeScreen: (value: boolean) => void
  initializeProject: (props: {
    branchId: string
    repositoryId: string
  }) => Promise<void>
}

export const createProjectInfoSlice = createHarmonySlice<
  ProjectInfoState,
  PullRequestState & ComponentUpdateState & DataLayerState
>((set, get) => ({
  branches: [],
  showWelcomeScreen: false,
  isDemo: false,
  currentBranch: { name: '', id: '' },
  repositoryId: '',
  isInitialized: false,
  updateWelcomeScreen(value: boolean) {
    set({ showWelcomeScreen: value })
  },
  async initializeProject({ branchId, repositoryId }) {
    get().initializeDataLayer()
    try {
      const response = await get().loadProject({ branchId, repositoryId })

      const { updates, branches, pullRequest, showWelcomeScreen, isDemo } =
        response
      const currentBranch = branches.find((branch) => branch.id === branchId)
      if (!currentBranch) {
        throw new Error(`Invalid branch with id ${branchId}`)
      }

      set({
        componentUpdates: updates,
        branches,
        pullRequest,
        showWelcomeScreen,
        isDemo,
        currentBranch,
        repositoryId,
        isInitialized: true,
      })
    } catch (err) {
      console.log(err)
    }
  },
}))
