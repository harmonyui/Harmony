import { Node, NodeBase } from '../types'
import { JSXChildNode } from './jsx-element'
import * as t from '@babel/types'

export class JSXExpressionContainer
  extends Node<t.JSXExpressionContainer>
  implements JSXChildNode
{
  constructor(
    private childElement: Node,
    base: NodeBase<t.JSXExpressionContainer>,
  ) {
    super(base)
  }

  public getChildElement() {
    return this.childElement
  }
}
