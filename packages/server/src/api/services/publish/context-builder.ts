import type { ChangeRecord, BuildContext } from './types'

export class ContextBuilder {
  private changes: ChangeRecord[] = []
  private affectedFiles = new Set<string>()

  recordChange(change: ChangeRecord): void {
    this.changes.push(change)
    this.affectedFiles.add(change.location.file)
  }

  build(): BuildContext {
    // Deduplicate changes based on location and change type
    const uniqueChanges = this.deduplicateChanges(this.changes)

    return {
      changes: uniqueChanges,
      affectedFiles: this.affectedFiles,
      metadata: {
        totalChanges: uniqueChanges.length,
        concreteChanges: uniqueChanges.filter((c) => c.confidence === 'concrete')
          .length,
        uncertainChanges: uniqueChanges.filter(
          (c) => c.confidence === 'uncertain',
        ).length,
      },
    }
  }

  private deduplicateChanges(changes: ChangeRecord[]): ChangeRecord[] {
    const seen = new Set<string>()
    const deduplicated: ChangeRecord[] = []

    for (const change of changes) {
      // Create a unique key based on location, type, and values
      const key = `${change.location.file}:${change.location.line}:${change.changeType}:${change.change.oldValue}:${change.change.newValue}:${change.change.propertyName}`

      if (!seen.has(key)) {
        seen.add(key)
        deduplicated.push(change)
      }
    }

    return deduplicated
  }
}
