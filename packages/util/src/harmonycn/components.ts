import type { HarmonyCn, RegistryItem } from './types'

export const componentInstances: Record<HarmonyCn, RegistryItem> = {
  text: {
    name: 'text',
    implementation: '<span>Label</span>',
    dependencies: [],
    props: [],
  },
  frame: {
    name: 'frame',
    implementation: '<div className="%"></div>',
    dependencies: [],
    classes: 'p-2',
    props: [],
  },
  image: {
    name: 'image',
    implementation:
      '<img src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png" />',
    dependencies: [],
    props: [],
  },
}
