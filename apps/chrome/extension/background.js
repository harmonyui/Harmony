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

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url.includes('http')) {
    chrome.tabs.executeScript(tabId, { file: 'content.js' }, function () {
      // chrome.tabs.executeScript(tabId, {
      //   file: 'https://harmony-ui.fly.dev/bundle.js',
      // })
    })
  }
})
