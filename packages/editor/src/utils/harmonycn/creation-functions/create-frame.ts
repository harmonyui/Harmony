import type { CreateComponent } from '../types'

export const createFrameElement: CreateComponent = () => {
  const div = document.createElement('div')
  return div
}
