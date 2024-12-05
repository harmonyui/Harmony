import type * as t from '@babel/types'
import type { NodeBase } from '../types'
import { Node } from '../types'
import { isChildNode } from '../utils'
import { ImportStatement } from './import-statement'

export class ProgramNode extends Node<t.Program> {
  private exportStatements: Node<t.ExportNamedDeclaration>[] = []
  private nodes = new Map<string, Node>()

  constructor(
    private fileContent: string,
    public base: NodeBase<t.Program>,
  ) {
    super(base)
  }

  public addExportStatement(exportStatement: Node<t.ExportNamedDeclaration>) {
    this.exportStatements.push(exportStatement)
  }

  public getExportStatements() {
    return this.exportStatements
  }

  public addNode(node: Node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node)
    }
  }

  public getNodes(node?: Node) {
    return Array.from(this.nodes.values())
      .filter((n) => (node ? isChildNode(n, node) : true))
      .sort((a, b) => a.location.start - b.location.start)
  }

  public getContent() {
    return this.fileContent
  }

  public setContent(content: string) {
    this.fileContent = content
  }

  public hasImportStatement(statement: ImportStatement) {
    const statements = this.getNodes().filter(
      (node) => node instanceof ImportStatement,
    )
    return statements.some(
      (s) =>
        s.getSource() === statement.getSource() &&
        s.getName() === statement.getName() &&
        s.isDefault === statement.isDefault,
    )
  }
}
