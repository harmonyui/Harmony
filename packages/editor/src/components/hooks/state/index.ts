import { createProjectInfoSlice } from './project-info'
import { createComponentErrorsSlice } from './component-error'
import { createHarmonyComponentSlice } from './harmony-components'
import { createPullRequestSlice } from './pull-request'
import { createComponentStateSlice } from './component-state'
import { createHarmonyStore } from './factory'
import { createComponentUpdateSlice } from './component-update'
import { createDataLayerSlice } from './data-layer'
import { createQueryStateSlice } from './query-state'

export const useHarmonyStore = createHarmonyStore(
  createComponentStateSlice,
  createHarmonyComponentSlice,
  createComponentErrorsSlice,
  createProjectInfoSlice,
  createPullRequestSlice,
  createComponentUpdateSlice,
  createDataLayerSlice,
  createQueryStateSlice,
)
