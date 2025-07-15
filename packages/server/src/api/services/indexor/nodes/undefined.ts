import { GetValuesOptions, Node } from '../types'

export class UndefinedNode extends Node {
  public override getValues({ visitor }: GetValuesOptions = {}) {
    visitor?.(this)
    return []
  }
}
