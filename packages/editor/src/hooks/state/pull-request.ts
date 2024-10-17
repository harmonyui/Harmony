import type { PullRequest } from '@harmony/util/src/types/branch'
import type {
  PublishRequest,
  PublishResponse,
} from '@harmony/util/src/types/network'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'

export interface PullRequestState {
  //The pull request object after a publish has been made
  pullRequest: PullRequest | undefined
  //The pull request object before a publish, i.e. as they are filling out the info
  publishState: PullRequest | undefined
  updatePullRequest: (value: PullRequest | undefined) => void
  updatePublishState: (value: PullRequest | undefined) => void
  publishChanges: (
    request: PublishRequest,
  ) => Promise<PublishResponse | undefined>
}

export const createPullRequestSlice = createHarmonySlice<
  PullRequestState,
  DataLayerState
>((set, get) => ({
  pullRequest: undefined,
  publishState: undefined,
  updatePullRequest(value) {
    set({ pullRequest: value })
  },
  updatePublishState(value) {
    set({ publishState: value })
  },
  async publishChanges(request) {
    try {
      const response = await get().publishProject(request)

      set({ pullRequest: response.pullRequest })

      return response
    } catch (err) {
      return undefined
    }
  },
}))
