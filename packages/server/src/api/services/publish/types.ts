import type { ComponentUpdate } from '@harmony/util/src/types/component'

export type PublisherMode = 'code-update' | 'build-context'

export interface PublisherOptions<T extends PublisherMode = 'code-update'> {
  mode: T
}

export type ChangeConfidence = 'concrete' | 'uncertain'

export type ChangeType =
  | 'literal'
  | 'attribute'
  | 'style'
  | 'element-create'
  | 'element-delete'
  | 'comment'

export interface ChangeRecord {
  confidence: ChangeConfidence
  changeType: ChangeType
  location: {
    file: string
    line: number
    componentId: string
    elementName?: string
  }
  change: {
    description: string
    oldValue?: string
    newValue?: string
    codeSnippet?: string
    propertyName?: string
  }
  // Store original ComponentUpdate for complete context
  originalUpdate: ComponentUpdate
}

export interface BuildContext {
  changes: ChangeRecord[]
  affectedFiles: Set<string>
  metadata: {
    totalChanges: number
    concreteChanges: number
    uncertainChanges: number
  }
}
