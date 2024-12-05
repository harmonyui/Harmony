import { Node } from '../types'

export class UndefinedNode extends Node {
  public override getValues() {
    return []
  }
}
