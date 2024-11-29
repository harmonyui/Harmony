import type { HarmonyCn } from './types'

export interface InstanceProperty {
  code: string
  instance?: string
  classes?: string
  dependencies: {
    path: string
    name: string
    isDefault: boolean
  }[]
}
export const componentInstances: Record<HarmonyCn, InstanceProperty> = {
  text: {
    code: '<span>Label</span>',
    dependencies: [],
  },
  frame: {
    code: '<div className="%"></div>',
    dependencies: [],
    classes: 'p-2',
  },
  image: {
    code: '<img src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png" />',
    dependencies: [],
  },
  button: {
    instance: '<Button>Click me</Button>',
    code: '<button className="%">Click me</button>',
    classes: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
    dependencies: [
      {
        name: 'Button',
        path: '@/components/button',
        isDefault: false,
      },
    ],
  },
}
