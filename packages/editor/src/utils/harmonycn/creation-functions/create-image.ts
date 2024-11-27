import type { CreateComponent } from '../types'

export const createImageElement: CreateComponent = () => {
  const img = document.createElement('img')
  img.src =
    'https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png'
  return {
    element: img,
    type: 'Image',
  }
}
