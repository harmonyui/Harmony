import type {
  ComponentLocation,
  ComponentUpdate,
} from '@harmony/util/src/types/component'
import type * as t from '@babel/types'
import type { Repository } from '@harmony/util/src/types/branch'
import type { FlowGraph } from '../../indexor/graph'

export interface UpdateInfo {
  componentId: string
  update: ComponentUpdate
  value: string
  oldValue: string
}

export interface CodeUpdateInfo {
  location: ComponentLocation
  node: t.Node
}

export type UpdateComponent = (
  info: UpdateInfo,
  graph: FlowGraph,
  repository: Repository,
) => void
