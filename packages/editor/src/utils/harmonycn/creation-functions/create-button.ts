import type { CreateComponent } from '../types'

export const createButtonElement: CreateComponent = () => {
  const button = document.createElement('button')
  button.textContent = 'Click me'
  return {
    element: button,
    type: 'button',
  }
}
