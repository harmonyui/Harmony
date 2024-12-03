import type { CreateComponent } from '../types'

export const createFrameElement: CreateComponent = () => {
  const div = document.createElement('div')
  div.style.padding = '4px'
  return {
    element: div,
    type: 'frame',
    options: {
      isEmpty: true,
    },
  }
}
