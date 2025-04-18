import type { HexColor } from '@harmony/util/src/types/colors'
import type { CSSProperties } from 'react'

/** Register */
export const attributeTools = [
  'font',
  'fontSize',
  'fontWeight',
  'textAlign',
  'textDecorationLine',
  'display',
  'justifyContent',
  'justifySelf',
  'alignItems',
  'flexDirection',
  'alignSelf',
  'rowGap',
  'columnGap',
  'gap',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flex',
  'order',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  'gridTemplateAreas',
  'opacity',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'letterSpacing',
  'lineHeight',
  'margin',
  'marginRight',
  'marginLeft',
  'marginTop',
  'padding',
  'marginBottom',
  'paddingRight',
  'paddingLeft',
  'paddingTop',
  'paddingBottom',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'borderStyle',
  'borderWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'overflow',
  'overflowX',
  'overflowY',
  'listStyleType',
  'clip',
  'boxShadow',
  'zIndex',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'transitionProperty',
  'transitionBehavior',
  'transitionDuration',
  'transitionTimingFunction',
  'transitionDelay',
  'objectFit',
  'objectPosition',
  'filter',
] as const satisfies (keyof CSSProperties)[]
export const colorTools = ['color', 'backgroundColor', 'borderColor'] as const
export enum ComponentType {
  Frame = 'frame',
  Text = 'text',
  Shape = 'shape',
  Component = 'component',
}

/** Types */
export type AttributeTools = (typeof attributeTools)[number]
export type ColorTools = (typeof colorTools)[number]
export type CommonTools = AttributeTools | ColorTools
export interface ComponentToolData {
  name: CommonTools
  value: string
}
export type ToolAttributeValue<T extends CommonTools> = T extends ColorTools
  ? {
      value: HexColor
      name: ColorTools
      element: HTMLElement | undefined
    }
  : {
      value: string
      name: Exclude<CommonTools, ColorTools>
      element: HTMLElement | undefined
    }
