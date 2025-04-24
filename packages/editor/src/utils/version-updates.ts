import { ComponentUpdate } from '@harmony/util/src/types/component'

interface Change {
  id: number
  update: ComponentUpdate
  time: string
  element: string
  description: string
  author: string
  beforeImage: string
  afterImage: string
  beforeCode: string
  afterCode: string
}

export interface VersionUpdate {
  date: Date
  changes: Change[]
}
