import type { CreateComponent } from '../types'

export const createTextElement: CreateComponent = () => {
  const span = document.createElement('span')
  span.textContent = 'Text'
  return span
}
