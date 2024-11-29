import type { HarmonyCn } from './types'

export interface InstanceProperty {
  code: string
  classes?: string
}
export const componentInstances: Record<HarmonyCn, InstanceProperty> = {
  text: {
    code: '<span>Label</span>',
  },
  frame: {
    code: '<div className="%"></div>',
    classes: 'p-2',
  },
  image: {
    code: '<img src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png" />',
  },
  button: {
    code: '<button>Click me</button>',
  },
}
