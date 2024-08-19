/** Register */
export const attributeTools = [
  'font',
  'fontSize',
  'textAlign',
  'display',
  'justifyContent',
  'alignItems',
  'flexDirection',
  'rowGap',
  'columnGap',
  'gap',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'letterSpacing',
  'lineHeight',
  'marginRight',
  'marginLeft',
  'marginTop',
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
  'borderRadius',
] as const
export const colorTools = ['color', 'backgroundColor', 'borderColor'] as const
export enum ComponentType {
  Frame = 'frame',
  Text = 'text',
  Shape = 'shape',
}

/** Types */
export type AttributeTools = (typeof attributeTools)[number]
export type ColorTools = (typeof colorTools)[number]
export type CommonTools = AttributeTools | ColorTools
export interface ComponentToolData {
  name: CommonTools
  value: string
}
