// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with default values
  chrome.storage.sync.get(['apiKey', 'endpoint'], function(result) {
    if (!result.apiKey) {
      chrome.storage.sync.set({
        apiKey: '',
        endpoint: ''
      });
    }
  });
}); 