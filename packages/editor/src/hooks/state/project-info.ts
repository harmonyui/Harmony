import type { Environment } from '@harmony/util/src/utils/component'
import type { Token } from '@harmony/util/src/types/tokens'
import type { RegistryComponent } from '../../utils/harmonycn/types'
import type { PullRequestState } from './pull-request'
import type { ComponentUpdateState } from './component-update/slice'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'
import type { ImageCdnState } from './image-cdn'
import type { HarmonyCnState } from './harmonycn'
import { Font } from '@harmony/util/src/fonts'
import { ChatBubbleState } from './chat-bubble'
import { User } from '../../utils/types'

export interface ProjectInfoState {
  currentBranch: { name: string; id: string } | null
  setBranch: (
    branch: { name: string; id: string; label: string } | undefined,
  ) => void
  repositoryId: string | undefined
  branches: { name: string; id: string; label: string }[]
  showWelcomeScreen: boolean
  isDemo: boolean | undefined
  isInitialized: boolean
  isReady: boolean
  isRepositoryConnected: boolean
  isOverlay: boolean
  localRootPath: string | undefined
  harmonyTokens: Token[]
  fonts: Font[] | undefined
  setIsOverlay: (value: boolean) => void
  setIsReady: (value: boolean) => void
  updateWelcomeScreen: (value: boolean) => void
  initializeProject: (props: {
    branchId: string
    repositoryId: string | undefined
    environment: Environment
    cdnImages?: string[]
    uploadImage?: (form: FormData) => Promise<string>
    registryComponents: RegistryComponent[]
    fonts: Font[] | undefined
    user: User
  }) => Promise<void>
  user: User | undefined
}

export const createProjectInfoSlice = createHarmonySlice<
  ProjectInfoState,
  PullRequestState &
    ComponentUpdateState &
    DataLayerState &
    ImageCdnState &
    HarmonyCnState &
    ChatBubbleState
>((set, get) => ({
  branches: [],
  showWelcomeScreen: false,
  isDemo: undefined,
  currentBranch: { name: '', id: '' },
  repositoryId: undefined,
  isInitialized: false,
  isReady: false,
  isOverlay: false,
  isRepositoryConnected: false,
  harmonyTokens: [],
  fonts: undefined,
  localRootPath: undefined,
  setIsOverlay(value: boolean) {
    set({ isOverlay: value })
  },
  updateWelcomeScreen(value: boolean) {
    set({ showWelcomeScreen: value })
  },
  user: undefined,
  environment: 'production',
  setBranch(branch: { name: string; id: string; label: string } | undefined) {
    const user = get().user
    if (!user) {
      throw new Error('User is not set')
    }
    branch &&
      get().initializeProject({
        branchId: branch?.id ?? '',
        repositoryId: get().repositoryId ?? '',
        environment: get().environment,
        cdnImages: get().cdnImages,
        uploadImage: get().uploadImage,
        registryComponents: [],
        fonts: get().fonts,
        user,
      })
    if (branch?.id === 'local') {
      set({
        currentBranch: { name: 'Local', id: 'local' },
      })
    } else {
      const currentBranch = get().branches.find(
        (branch) => branch.id === branch.id,
      )

      set((prev) => ({
        currentBranch: branch || null,
        branches:
          !currentBranch && branch ? [...prev.branches, branch] : prev.branches,
      }))
    }
  },
  setIsReady(value: boolean) {
    set({ isReady: value })
  },
  async initializeProject({
    branchId,
    repositoryId,
    environment,
    cdnImages,
    uploadImage,
    registryComponents,
    fonts,
    user,
  }) {
    const isLocal = branchId === 'local'
    if (get().client === undefined || get().currentBranch?.id !== branchId) {
      get().initializeDataLayer(
        environment,
        get().getToken,
        isLocal,
        repositoryId ?? '',
      )
    }

    get().initializeRegistry(registryComponents)

    cdnImages && set({ cdnImages })
    uploadImage && get().setUploadImage(uploadImage)

    if (!branchId && !repositoryId) {
      set({
        isInitialized: true,
        isRepositoryConnected: false,
        fonts,
        user,
      })
      return
    }
    set({
      isLocal,
      user,
    })

    try {
      set({ isInitialized: false })
      const response = await get().loadProject({ branchId, repositoryId })

      const {
        updates,
        branches,
        pullRequest,
        showWelcomeScreen,
        isDemo,
        harmonyTokens,
        rootPath,
        chatBubbles,
      } = response
      const currentBranch =
        branchId === 'local'
          ? { name: 'Local', id: 'local' }
          : (branches.find((branch) => branch.id === branchId) ?? null)

      if (isLocal && !rootPath) {
        throw new Error('Root path is not set for local environment')
      }

      set({
        componentUpdates: updates,
        branches,
        pullRequest,
        showWelcomeScreen,
        isDemo,
        currentBranch: currentBranch,
        repositoryId,
        isInitialized: true,
        isRepositoryConnected: repositoryId !== undefined,
        harmonyTokens,
        localRootPath: rootPath,
        environment,
        fonts,
        chatBubbles,
        user,
      })
    } catch (err) {
      console.log(err)
    }
  },
}))
