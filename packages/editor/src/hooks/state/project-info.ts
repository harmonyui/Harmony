import type { Environment } from '@harmony/util/src/utils/component'
import type { Token } from '@harmony/util/src/types/tokens'
import type { RegistryComponent } from '../../utils/harmonycn/types'
import type { PullRequestState } from './pull-request'
import type { ComponentUpdateState } from './component-update/slice'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'
import type { ImageCdnState } from './image-cdn'
import type { HarmonyCnState } from './harmonycn'

export interface ProjectInfoState {
  currentBranch: { name: string; id: string }
  repositoryId: string | undefined
  branches: { name: string; id: string }[]
  showWelcomeScreen: boolean
  isDemo: boolean | undefined
  isInitialized: boolean
  isRepositoryConnected: boolean
  isOverlay: boolean
  isLocal: boolean
  localRootPath: string | undefined
  harmonyTokens: Token[]
  setIsOverlay: (value: boolean) => void
  updateWelcomeScreen: (value: boolean) => void
  initializeProject: (props: {
    branchId: string
    repositoryId: string | undefined
    environment: Environment
    cdnImages?: string[]
    uploadImage?: (form: FormData) => Promise<string>
    registryComponents: RegistryComponent[]
  }) => Promise<void>
}

export const createProjectInfoSlice = createHarmonySlice<
  ProjectInfoState,
  PullRequestState &
    ComponentUpdateState &
    DataLayerState &
    ImageCdnState &
    HarmonyCnState
>((set, get) => ({
  branches: [],
  showWelcomeScreen: false,
  isDemo: undefined,
  currentBranch: { name: '', id: '' },
  repositoryId: undefined,
  isInitialized: false,
  isOverlay: false,
  isRepositoryConnected: false,
  harmonyTokens: [],
  isLocal:
    typeof window !== 'undefined'
      ? window.location.hostname === 'localhost'
      : false,
  localRootPath: undefined,
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
    registryComponents,
  }) {
    const isLocal = branchId === 'local'
    if (get().client === undefined) {
      get().initializeDataLayer(
        environment,
        async () => '',
        isLocal,
        repositoryId ?? '',
      )
    }

    get().initializeRegistry(registryComponents)

    set({ cdnImages })
    uploadImage && get().setUploadImage(uploadImage)

    if (!branchId && !repositoryId) {
      set({
        isInitialized: true,
        isRepositoryConnected: false,
      })
      return
    }
    set({
      isLocal,
    })

    try {
      const response = await get().loadProject({ branchId, repositoryId })

      const {
        updates,
        branches,
        pullRequest,
        showWelcomeScreen,
        isDemo,
        harmonyTokens,
        rootPath,
      } = response
      const currentBranch = branches.find((branch) => branch.id === branchId)
      if (!currentBranch && branchId !== 'local') {
        throw new Error(`Invalid branch with id ${branchId}`)
      }
      if (isLocal && !rootPath) {
        throw new Error('Root path is not set for local environment')
      }

      set({
        componentUpdates: updates,
        branches,
        pullRequest,
        showWelcomeScreen,
        isDemo,
        currentBranch: currentBranch ?? { name: 'local', id: 'local' },
        repositoryId,
        isInitialized: true,
        isRepositoryConnected: repositoryId !== undefined,
        harmonyTokens,
        localRootPath: rootPath,
      })
    } catch (err) {
      console.log(err)
    }
  },
}))
