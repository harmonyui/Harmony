/*global chrome -- ok*/
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: 'editHTML',
//     title: 'Edit HTML',
//     contexts: ['all'],
//   })
// })

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'editHTML') {
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       files: ['content.js'],
//     })
//   }
// })

chrome.runtime.onInstalled.addListener(
  function listener(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url.includes('http')) {
      chrome.tabs.executeScript(tabId, { file: 'content.js' })
    }
  },
)
