/*global document chrome window -- ok*/
const harmonyEntryPoint = document.createElement('div')
const harmonyScript = document.createElement('script')

harmonyEntryPoint.id = 'harmony'
harmonyScript.src = chrome.runtime.getURL('dist/bundle.js')

harmonyEntryPoint.appendChild(harmonyScript)

document.querySelector('body').appendChild(harmonyEntryPoint)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extensionIconClicked') {
    window.dispatchEvent(new CustomEvent('toggleEditor'))
    sendResponse({ status: 'action performed' })
  }
})
