// Create floating button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'immersive-translate-button';
  button.innerHTML = '翻译';
  button.style.cssText = `
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background-color: #4CAF50;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    z-index: 10000;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(button);
  return button;
}

// Get selected text
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

// Translate text using Azure OpenAI
async function translateText(text) {
  try {
    const { apiKey, endpoint } = await chrome.storage.sync.get(['apiKey', 'endpoint']);

    if (!apiKey || !endpoint) {
      throw new Error('Please set your API key and endpoint in the extension settings');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a translator. Translate the following text to Chinese. Keep the original format and structure."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Create translation popup
function createTranslationPopup(originalText, translatedText) {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    max-width: 80%;
    max-height: 80vh;
    overflow-y: auto;
  `;

  popup.innerHTML = `
    <div style="margin-bottom: 15px;">
      <h3 style="margin: 0 0 10px 0;">原文</h3>
      <p style="margin: 0;">${originalText}</p>
    </div>
    <div>
      <h3 style="margin: 0 0 10px 0;">译文</h3>
      <p style="margin: 0;">${translatedText}</p>
    </div>
    <button id="close-translation" style="
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
    ">×</button>
  `;

  document.body.appendChild(popup);

  // Add close button functionality
  document.getElementById('close-translation').addEventListener('click', () => {
    popup.remove();
  });
}

// Initialize
const button = createFloatingButton();

button.addEventListener('click', async () => {
  const selectedText = getSelectedText();

  if (!selectedText) {
    alert('请先选择要翻译的文本');
    return;
  }

  try {
    button.textContent = '翻译中...';
    const translatedText = await translateText(selectedText);
    createTranslationPopup(selectedText, translatedText);
  } catch (error) {
    alert(error.message);
  } finally {
    button.textContent = '翻译';
  }
});