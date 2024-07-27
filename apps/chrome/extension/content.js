/*global document chrome -- ok*/
const harmonyEntryPoint = document.createElement('div')
const harmonyScript = document.createElement('script')

harmonyEntryPoint.id = 'harmony'
harmonyScript.src = 'dist/bundle.js'

harmonyEntryPoint.appendChild(harmonyScript)

document.querySelector('body').appendChild(harmonyEntryPoint)
