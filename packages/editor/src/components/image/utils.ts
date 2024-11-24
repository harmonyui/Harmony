import type { PropertyInputType } from '../panel/_common/property/types'

export const getPropertyType = (name: string): PropertyInputType => {
  switch (name) {
    case 'src':
      return 'image'
    default:
      return 'string'
  }
}
