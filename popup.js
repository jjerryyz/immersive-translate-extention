document.addEventListener('DOMContentLoaded', function () {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'endpoint'], function (result) {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.endpoint) {
      document.getElementById('endpoint').value = result.endpoint;
    }
  });

  // Save settings
  document.getElementById('save').addEventListener('click', function () {
    const apiKey = document.getElementById('apiKey').value;
    const endpoint = document.getElementById('endpoint').value;

    chrome.storage.sync.set({
      apiKey: apiKey,
      endpoint: endpoint
    }, function () {
      // Show saved message
      const button = document.getElementById('save');
      const originalText = button.textContent;
      button.textContent = 'Saved!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  });
});