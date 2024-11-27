import type * as t from '@babel/types'
import { AbstractObjectProperty } from './object-property'

export class ObjectPatternNode extends AbstractObjectProperty<t.ObjectPattern> {}
