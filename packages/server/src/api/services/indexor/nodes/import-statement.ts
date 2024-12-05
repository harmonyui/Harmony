import type * as t from '@babel/types'
import type { NodeBase } from '../types'
import { Node } from '../types'

export class ImportStatement extends Node<
  t.ImportSpecifier | t.ImportDefaultSpecifier
> {
  constructor(
    public source: string,
    base: NodeBase<t.ImportSpecifier | t.ImportDefaultSpecifier>,
  ) {
    super(base)
  }

  public getSource() {
    return this.source
  }

  public getName() {
    return this.node.local.name
  }

  public isDefault() {
    return this.node.type === 'ImportDefaultSpecifier'
  }
}
