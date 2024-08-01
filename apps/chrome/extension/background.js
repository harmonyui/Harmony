/*global chrome -- ok*/
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(
    tab.id,
    { action: 'extensionIconClicked' },
    (response) => {
      console.log(response.status)
    },
  )
})
