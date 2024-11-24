import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type { NodeBase } from '../types'
import { createNode } from '../utils'
import { getSnippetFromNode } from '../../publish/code-updator'
import type { JSXElementNode } from './jsx-element'
import { RestElement } from './rest-element'
import { JSXAttribute, type JSXAttributeNode } from './jsx-attribute'

export class JSXSpreadAttributeNode extends JSXAttribute<t.JSXSpreadAttribute> {
  private internalRest: RestElement<t.JSXSpreadAttribute>
  constructor(
    parentElement: JSXElementNode,
    notProperties: JSXAttributeNode[],
    content: string,
    base: NodeBase<t.JSXSpreadAttribute>,
  ) {
    super(
      parentElement,
      createValue(base.path, base.location.file, content),
      -1,
      base,
    )
    this.internalRest = new RestElement(
      notProperties,
      content,
      createNode(this.name, base.path, base.location.file, content),
    )
    this.internalRest.dependencies = this.dependencies
    this.internalRest.dependents = this.dependents
  }

  public getNameAndValues() {
    return this.internalRest.getNameAndValues()
  }
}

function createValue(
  path: NodePath,
  fileLocation: string,
  fileContent: string,
) {
  const valuePath = path.get('argument') as NodePath
  const valueNode = createNode(
    getSnippetFromNode(valuePath.node),
    valuePath,
    fileLocation,
    fileContent,
  )

  return valueNode
}