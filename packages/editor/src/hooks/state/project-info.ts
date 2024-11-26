import type { Environment } from '@harmony/util/src/utils/component'
import type { PullRequestState } from './pull-request'
import type { ComponentUpdateState } from './component-update'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'
import type { ImageCdnState } from './image-cdn'

export interface ProjectInfoState {
  currentBranch: { name: string; id: string }
  repositoryId: string | undefined
  branches: { name: string; id: string }[]
  showWelcomeScreen: boolean
  isDemo: boolean | undefined
  isInitialized: boolean
  isRepositoryConnected: boolean
  isOverlay: boolean
  setIsOverlay: (value: boolean) => void
  updateWelcomeScreen: (value: boolean) => void
  initializeProject: (props: {
    branchId: string
    repositoryId: string | undefined
    environment: Environment
    cdnImages?: string[]
    uploadImage?: (form: FormData) => Promise<string>
  }) => Promise<void>
}

export const createProjectInfoSlice = createHarmonySlice<
  ProjectInfoState,
  PullRequestState & ComponentUpdateState & DataLayerState & ImageCdnState
>((set, get) => ({
  branches: [],
  showWelcomeScreen: false,
  isDemo: undefined,
  currentBranch: { name: '', id: '' },
  repositoryId: undefined,
  isInitialized: false,
  isOverlay: false,
  isRepositoryConnected: false,
  setIsOverlay(value: boolean) {
    set({ isOverlay: value })
  },
  updateWelcomeScreen(value: boolean) {
    set({ showWelcomeScreen: value })
  },
  async initializeProject({
    branchId,
    repositoryId,
    environment,
    cdnImages,
    uploadImage,
  }) {
    if (get().client === undefined) {
      get().initializeDataLayer(environment, async () => '')
    }

    set({ cdnImages })
    uploadImage && get().setUploadImage(uploadImage)

    if (!branchId && !repositoryId) {
      set({
        isInitialized: true,
        isRepositoryConnected: false,
      })
      return
    }

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
        isRepositoryConnected: repositoryId !== undefined,
      })
    } catch (err) {
      console.log(err)
    }
  },
}))