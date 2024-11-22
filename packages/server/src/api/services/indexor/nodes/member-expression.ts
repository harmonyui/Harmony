import type * as t from '@babel/types'
import { AbstractObjectProperty } from './object-property'

export class MemberExpressionNode extends AbstractObjectProperty<t.MemberExpression> {}
