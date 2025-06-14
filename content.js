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
  
  // Add right-click context menu
  button.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    createCacheManagementPanel();
  });
  
  document.body.appendChild(button);
  return button;
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < windowHeight &&
    rect.left < windowWidth
  );
}

// Check if element is visible
function isElementVisible(element) {
  // Check if element is in viewport
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const inViewport = (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < windowHeight &&
    rect.left < windowWidth
  );
  
  if (!inViewport) return false;
  
  // Check if element is actually visible (not hidden by CSS)
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || 
      style.visibility === 'hidden' || 
      style.opacity === '0' ||
      element.hidden) {
    return false;
  }
  
  // Check if element has zero dimensions
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }
  
  return true;
}

// Get all text content from the page
function getAllPageText() {
  const paragraphs = [];
  
  // Try to find main content area first
  const mainContentSelectors = [
    'main',
    'article', 
    '[role="main"]',
    '.content',
    '.main-content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '#content',
    '#main-content',
    '#post-content'
  ];
  
  let contentArea = null;
  for (const selector of mainContentSelectors) {
    contentArea = document.querySelector(selector);
    if (contentArea) break;
  }
  
  // If no main content area found, use body but exclude certain areas
  const searchRoot = contentArea || document.body;
  
  const walker = document.createTreeWalker(
    searchRoot,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function(node) {
        // Skip script and style tags
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip already translated elements
        if (node.hasAttribute('data-translated')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip translation elements themselves
        if (node.hasAttribute('data-immersive-translation')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip if parent is a translation element
        if (node.closest && node.closest('[data-immersive-translation]')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip code-related elements
        if (node.tagName === 'CODE' || node.tagName === 'PRE' || 
            node.tagName === 'KBD' || node.tagName === 'SAMP' || node.tagName === 'VAR') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip elements with code-related classes
        const codeClasses = [
          'code', 'highlight', 'hljs', 'language-', 'lang-', 'prettyprint',
          'codehilite', 'syntax', 'sourceCode', 'code-block', 'prism'
        ];
        
        if (node.className && typeof node.className === 'string') {
          for (const codeClass of codeClasses) {
            if (node.className.includes(codeClass)) {
              return NodeFilter.FILTER_REJECT;
            }
          }
        }
        
        // Skip if parent is a code element
        if (node.closest && node.closest('code, pre, kbd, samp, var, .code, .highlight, .hljs, [class*="language-"], [class*="lang-"], .prettyprint, .codehilite, .syntax, .sourceCode, .code-block, .prism')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip table structure elements (but allow cells)
        if (node.tagName === 'TABLE' || node.tagName === 'TBODY' || 
            node.tagName === 'THEAD' || node.tagName === 'TFOOT' || node.tagName === 'TR') {
          return NodeFilter.FILTER_SKIP;
        }
        
        // Skip navigation, header, footer, sidebar elements
        const excludeSelectors = [
          'nav', 'header', 'footer', 'aside',
          '.nav', '.navigation', '.menu', '.header', '.footer', '.sidebar',
          '.breadcrumb', '.pagination', '.tags', '.categories',
          '#nav', '#navigation', '#menu', '#header', '#footer', '#sidebar'
        ];
        
        for (const selector of excludeSelectors) {
          if (node.matches && node.matches(selector)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.closest && node.closest(selector)) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        
        // Accept main content elements
        if (node.tagName === 'P' || node.tagName === 'H1' || node.tagName === 'H2' || 
            node.tagName === 'H3' || node.tagName === 'H4' || node.tagName === 'H5' || 
            node.tagName === 'H6' || node.tagName === 'LI' || node.tagName === 'BLOCKQUOTE' ||
            node.tagName === 'TD' || node.tagName === 'TH') {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        // Accept div and span only if they contain substantial text content
        if (node.tagName === 'DIV' || node.tagName === 'SPAN') {
          const text = node.textContent.trim();
          
          // Skip if this element contains table structures
          if (node.querySelector('table, tbody, thead, tfoot, tr, td, th')) {
            return NodeFilter.FILTER_SKIP;
          }
          
          // Only accept if it has substantial text (more than 20 characters) and no child block elements
          // But allow if it's inside a table cell
          if ((text.length > 20 && !node.querySelector('p, div, h1, h2, h3, h4, h5, h6')) || 
              node.closest('td, th')) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text && text.length > 10 && isElementVisible(node)) {
      // Skip any element that contains table structures (except table cells themselves)
      if (node.tagName !== 'TD' && node.tagName !== 'TH' && 
          node.querySelector('table, tbody, thead, tfoot, tr')) {
        continue;
      }
      
      // For table cells, ensure they have meaningful content and aren't just structural
      if (node.tagName === 'TD' || node.tagName === 'TH') {
        // Skip cells that only contain other table elements or are mostly whitespace
        if (node.querySelector('table, tbody, thead, tfoot, tr') || text.length < 3) {
          continue;
        }
      }
      
      paragraphs.push({
        element: node,
        text: text,
        html: node.innerHTML // Store the HTML content
      });
    }
  }
  return paragraphs;
}

// Translation cache management
class TranslationCache {
  constructor() {
    this.cacheKey = 'immersive-translate-cache';
    this.maxSizeKey = 'immersive-translate-cache-size';
    this.defaultMaxSize = 1000; // Default max cache entries
  }

  async getMaxSize() {
    const result = await chrome.storage.local.get([this.maxSizeKey]);
    return result[this.maxSizeKey] || this.defaultMaxSize;
  }

  async setMaxSize(size) {
    await chrome.storage.local.set({ [this.maxSizeKey]: size });
    await this.trimCache(); // Trim cache if new size is smaller
  }

  async getCache() {
    const result = await chrome.storage.local.get([this.cacheKey]);
    return result[this.cacheKey] || {};
  }

  async setCache(cache) {
    await chrome.storage.local.set({ [this.cacheKey]: cache });
  }

  generateKey(text, isHtml = false) {
    // Create a simple hash of the text for cache key
    let hash = 0;
    const str = `${isHtml ? 'html:' : 'text:'}${text}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async get(text, isHtml = false) {
    const cache = await this.getCache();
    const key = this.generateKey(text, isHtml);
    const entry = cache[key];
    
    if (entry) {
      // Update access time for LRU
      entry.lastAccessed = Date.now();
      await this.setCache(cache);
      console.log('Cache hit for translation');
      return entry.translation;
    }
    
    console.log('Cache miss for translation');
    return null;
  }

  async set(text, translation, isHtml = false) {
    const cache = await this.getCache();
    const key = this.generateKey(text, isHtml);
    
    cache[key] = {
      translation: translation,
      created: Date.now(),
      lastAccessed: Date.now()
    };

    await this.setCache(cache);
    await this.trimCache();
  }

  async trimCache() {
    const cache = await this.getCache();
    const maxSize = await this.getMaxSize();
    const entries = Object.entries(cache);
    
    if (entries.length <= maxSize) return;

    // Sort by last accessed time (LRU)
    entries.sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
    
    // Keep only the most recent entries
    const trimmedCache = {};
    for (let i = 0; i < maxSize; i++) {
      if (entries[i]) {
        trimmedCache[entries[i][0]] = entries[i][1];
      }
    }

    await this.setCache(trimmedCache);
    console.log(`Cache trimmed to ${maxSize} entries`);
  }

  async clear() {
    await chrome.storage.local.remove([this.cacheKey]);
    console.log('Translation cache cleared');
  }

  async getStats() {
    const cache = await this.getCache();
    const maxSize = await this.getMaxSize();
    return {
      currentSize: Object.keys(cache).length,
      maxSize: maxSize,
      entries: Object.values(cache).map(entry => ({
        created: new Date(entry.created).toLocaleString(),
        lastAccessed: new Date(entry.lastAccessed).toLocaleString()
      }))
    };
  }
}

const translationCache = new TranslationCache();

// Track translated elements
const translatedElements = new WeakSet();

// Check if element has been translated
function isTranslated(element) {
  return translatedElements.has(element);
}

// Mark element as translated
function markAsTranslated(element) {
  translatedElements.add(element);
}

// Translate single text using Azure OpenAI (for retry functionality)
async function translateText(text, isHtml = false) {
  try {
    // Check cache first
    const cachedTranslation = await translationCache.get(text, isHtml);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    const { apiKey, endpoint, model } = await chrome.storage.sync.get(['apiKey', 'endpoint', 'model']);

    if (!apiKey || !endpoint) {
      throw new Error('Please set your API key and endpoint in the extension settings');
    }

    const systemPrompt = isHtml 
      ? "You are a translator. Translate the following HTML content to Chinese. Keep all HTML tags exactly as they are, only translate the text content inside the tags. Preserve all attributes, links, and structure."
      : "You are a translator. Translate the following text to Chinese. Keep the original format and structure.";

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
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
    const translation = data.choices[0].message.content;
    
    // Cache the translation
    await translationCache.set(text, translation, isHtml);
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Translate multiple texts using Azure OpenAI
async function translateTexts(paragraphs) {
  try {
    // Check cache for each paragraph
    const cachedResults = [];
    const uncachedParagraphs = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const cachedTranslation = await translationCache.get(paragraph.html, true);
      
      if (cachedTranslation) {
        cachedResults[i] = cachedTranslation;
      } else {
        cachedResults[i] = null;
        uncachedParagraphs.push({ paragraph, originalIndex: i });
      }
    }

    // If all are cached, return cached results
    if (uncachedParagraphs.length === 0) {
      console.log('All translations found in cache');
      return cachedResults;
    }

    console.log(`${uncachedParagraphs.length} paragraphs need API translation`);

    const { apiKey, endpoint, model } = await chrome.storage.sync.get(['apiKey', 'endpoint', 'model']);

    if (!apiKey || !endpoint) {
      throw new Error('Please set your API key and endpoint in the extension settings');
    }

    // Combine uncached HTML content with separators
    const combinedContent = uncachedParagraphs.map((item, index) => 
      `[${index}] ${item.paragraph.html}`
    ).join('\n\n---\n\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a translator. Translate the following HTML content to Chinese. Each segment is marked with [number] at the beginning. Keep all HTML tags exactly as they are, only translate the text content inside the tags. Preserve all attributes, links, and structure. Maintain the same numbering in your translation and separate each translation with '---'."
          },
          {
            role: "user",
            content: combinedContent
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    const translatedContent = data.choices[0].message.content;
    
    // Split the translated content back into individual translations
    const newTranslations = translatedContent.split(/---\s*/).map(text => {
      // Remove the [number] prefix and clean up
      return text.replace(/^\[\d+\]\s*/, '').trim();
    }).filter(text => text.length > 0);

    // Cache new translations and merge with cached results
    for (let i = 0; i < uncachedParagraphs.length; i++) {
      const item = uncachedParagraphs[i];
      const translation = newTranslations[i];
      
      if (translation) {
        // Cache the translation
        await translationCache.set(item.paragraph.html, translation, true);
        cachedResults[item.originalIndex] = translation;
      }
    }

    return cachedResults;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Update page content with translations
function updatePageContent(paragraph, translatedText) {
  if (isTranslated(paragraph.element)) return;
  
  // Special handling for table cells
  if (paragraph.element.tagName === 'TD' || paragraph.element.tagName === 'TH') {
    // Create a container div to hold both original and translated content
    const container = document.createElement('div');
    
    // Move original content to container
    container.innerHTML = paragraph.element.innerHTML;
    
    // Create translation div
    const translationDiv = document.createElement('div');
    translationDiv.style.cssText = `
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 0.9em;
    `;
    translationDiv.innerHTML = translatedText;
    translationDiv.setAttribute('data-immersive-translation', 'true');
    
    // Add both to container
    container.appendChild(translationDiv);
    
    // Replace cell content with container
    paragraph.element.innerHTML = '';
    paragraph.element.appendChild(container);
    
    // Mark the original element as translated
    paragraph.element.setAttribute('data-translated', 'true');
    markAsTranslated(paragraph.element);
    return;
  }
  
  // Special handling for heading elements (H1-H6)
  if (paragraph.element.tagName.match(/^H[1-6]$/)) {
    // Create translation span to display inline
    const translationSpan = document.createElement('span');
    translationSpan.style.cssText = `
      margin-left: 15px;
      color: #666;
      font-weight: normal;
      font-size: 0.85em;
    `;
    translationSpan.innerHTML = `(${translatedText})`;
    translationSpan.setAttribute('data-immersive-translation', 'true');
    
    // Append translation to the heading element
    paragraph.element.appendChild(translationSpan);
    
    // Mark the original element as translated
    paragraph.element.setAttribute('data-translated', 'true');
    markAsTranslated(paragraph.element);
    return;
  }
  
  // Regular handling for non-table, non-heading elements
  const translationDiv = document.createElement('div');
  
  // Copy styles from original element
  const originalStyle = window.getComputedStyle(paragraph.element);
  translationDiv.style.cssText = `
    font-family: ${originalStyle.fontFamily};
    font-size: ${originalStyle.fontSize};
    font-weight: ${originalStyle.fontWeight};
    line-height: ${originalStyle.lineHeight};
    color: ${originalStyle.color};
    text-align: ${originalStyle.textAlign};
    margin-top: 5px;
    margin-bottom: ${originalStyle.marginBottom};
    padding-left: 10px;
    border-left: 3px solid #4CAF50;
  `;
  
  // Use innerHTML to preserve HTML structure
  translationDiv.innerHTML = translatedText;
  
  // Add a data attribute to mark this as a translation
  translationDiv.setAttribute('data-immersive-translation', 'true');
  
  paragraph.element.parentNode.insertBefore(translationDiv, paragraph.element.nextSibling);
  
  // Mark the original element as translated with a data attribute
  paragraph.element.setAttribute('data-translated', 'true');
  markAsTranslated(paragraph.element);
}

// Create retry button
function createRetryButton(paragraph, originalText) {
  if (isTranslated(paragraph.element)) return;
  
  // Special handling for table cells
  if (paragraph.element.tagName === 'TD' || paragraph.element.tagName === 'TH') {
    // Create a container div to hold both original and error content
    const container = document.createElement('div');
    
    // Move original content to container
    container.innerHTML = paragraph.element.innerHTML;
    
    // Create error div with retry button
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid #ff4444;
      color: #ff4444;
      font-size: 0.9em;
    `;
    
    const retryButton = document.createElement('button');
    retryButton.innerHTML = '重试';
    retryButton.style.cssText = `
      background-color: #ff4444;
      color: white;
      border: none;
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 5px;
    `;
    
    errorDiv.innerHTML = '翻译失败';
    errorDiv.appendChild(retryButton);
    errorDiv.setAttribute('data-immersive-translation', 'true');
    
    // Add both to container
    container.appendChild(errorDiv);
    
    // Replace cell content with container
    paragraph.element.innerHTML = '';
    paragraph.element.appendChild(container);
    
    // Mark the original element as translated
    paragraph.element.setAttribute('data-translated', 'true');
    markAsTranslated(paragraph.element);

    retryButton.addEventListener('click', async () => {
      try {
        retryButton.disabled = true;
        retryButton.innerHTML = '翻译中...';
        const translatedText = await translateText(paragraph.html, true);
        
        // Replace error div with translation div
        const translationDiv = document.createElement('div');
        translationDiv.style.cssText = `
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 0.9em;
        `;
        translationDiv.innerHTML = translatedText;
        translationDiv.setAttribute('data-immersive-translation', 'true');
        
        container.replaceChild(translationDiv, errorDiv);
      } catch (error) {
        retryButton.disabled = false;
        retryButton.innerHTML = '重试';
        console.error('Retry translation error:', error);
      }
    });
    return;
  }
  
  // Special handling for heading elements (H1-H6)
  if (paragraph.element.tagName.match(/^H[1-6]$/)) {
    // Create error span with retry button for inline display
    const errorSpan = document.createElement('span');
    errorSpan.style.cssText = `
      margin-left: 15px;
      color: #ff4444;
      font-weight: normal;
      font-size: 0.85em;
    `;
    
    const retryButton = document.createElement('button');
    retryButton.innerHTML = '重试';
    retryButton.style.cssText = `
      background-color: #ff4444;
      color: white;
      border: none;
      padding: 1px 6px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      margin-left: 5px;
    `;
    
    errorSpan.innerHTML = '(翻译失败)';
    errorSpan.appendChild(retryButton);
    errorSpan.setAttribute('data-immersive-translation', 'true');
    
    // Append error span to the heading element
    paragraph.element.appendChild(errorSpan);
    
    // Mark the original element as translated
    paragraph.element.setAttribute('data-translated', 'true');
    markAsTranslated(paragraph.element);

    retryButton.addEventListener('click', async () => {
      try {
        retryButton.disabled = true;
        retryButton.innerHTML = '翻译中...';
        const translatedText = await translateText(paragraph.html, true);
        
        // Replace error span with translation span
        const translationSpan = document.createElement('span');
        translationSpan.style.cssText = `
          margin-left: 15px;
          color: #666;
          font-weight: normal;
          font-size: 0.85em;
        `;
        translationSpan.innerHTML = `(${translatedText})`;
        translationSpan.setAttribute('data-immersive-translation', 'true');
        
        paragraph.element.replaceChild(translationSpan, errorSpan);
      } catch (error) {
        retryButton.disabled = false;
        retryButton.innerHTML = '重试';
        console.error('Retry translation error:', error);
      }
    });
    return;
  }
  
  // Regular handling for non-table, non-heading elements
  const retryButton = document.createElement('button');
  retryButton.innerHTML = '重试';
  retryButton.style.cssText = `
    background-color: #ff4444;
    color: white;
    border: none;
    padding: 2px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
  `;

  const translationDiv = document.createElement('div');
  translationDiv.style.cssText = `
    color: #666;
    margin-top: 5px;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 3px solid #ff4444;
  `;
  translationDiv.innerHTML = '翻译失败';
  translationDiv.appendChild(retryButton);
  
  // Add a data attribute to mark this as a translation
  translationDiv.setAttribute('data-immersive-translation', 'true');

  paragraph.element.parentNode.insertBefore(translationDiv, paragraph.element.nextSibling);
  
  // Mark the original element as translated with a data attribute
  paragraph.element.setAttribute('data-translated', 'true');
  markAsTranslated(paragraph.element);

  retryButton.addEventListener('click', async () => {
    try {
      retryButton.disabled = true;
      retryButton.innerHTML = '翻译中...';
      const translatedText = await translateText(paragraph.html, true); // Use HTML content and set isHtml flag
      
      // Copy styles from original element for successful retry
      const originalStyle = window.getComputedStyle(paragraph.element);
      translationDiv.style.cssText = `
        font-family: ${originalStyle.fontFamily};
        font-size: ${originalStyle.fontSize};
        font-weight: ${originalStyle.fontWeight};
        line-height: ${originalStyle.lineHeight};
        color: ${originalStyle.color};
        text-align: ${originalStyle.textAlign};
        margin-top: 5px;
        margin-bottom: ${originalStyle.marginBottom};
        padding-left: 10px;
        border-left: 3px solid #4CAF50;
      `;
      
      translationDiv.innerHTML = translatedText;
      retryButton.remove();
    } catch (error) {
      retryButton.disabled = false;
      retryButton.innerHTML = '重试';
      console.error('Retry translation error:', error);
    }
  });
}

// Translate visible content
async function translateVisibleContent() {
  const paragraphs = getAllPageText();
  console.log(`Found ${paragraphs.length} paragraphs to check`);
  
  // Filter out already translated paragraphs
  const untranslatedParagraphs = paragraphs.filter(paragraph => !isTranslated(paragraph.element));
  console.log(`${untranslatedParagraphs.length} paragraphs need translation`);
  
  if (untranslatedParagraphs.length === 0) {
    console.log('No new content to translate');
    return;
  }
  
  // Process paragraphs in chunks to avoid API limits
  const chunkSize = 10; // Increase chunk size for more efficient processing
  for (let i = 0; i < untranslatedParagraphs.length; i += chunkSize) {
    const chunk = untranslatedParagraphs.slice(i, i + chunkSize);
    
    try {
      console.log(`Translating batch of ${chunk.length} paragraphs`);
      const translations = await translateTexts(chunk);
      
      // Update each paragraph with its translation
      chunk.forEach((paragraph, index) => {
        if (translations[index]) {
          updatePageContent(paragraph, translations[index]);
        } else {
          console.error(`No translation found for paragraph ${index}`);
          createRetryButton(paragraph, paragraph.text);
        }
      });
      
    } catch (error) {
      console.error('Batch translation error:', error);
      // Fall back to individual translation for this chunk
      await Promise.all(
        chunk.map(async (paragraph) => {
          try {
            console.log(`Fallback: Translating individual paragraph`);
            const translatedText = await translateText(paragraph.html, true);
            updatePageContent(paragraph, translatedText);
          } catch (error) {
            console.error('Individual translation error:', error);
            createRetryButton(paragraph, paragraph.text);
          }
        })
      );
    }
  }
}

// Initialize
const button = createFloatingButton();
let isTranslating = false;

button.addEventListener('click', async () => {
  if (isTranslating) return;
  
  try {
    isTranslating = true;
    button.textContent = '翻译中...';
    await translateVisibleContent();
  } catch (error) {
    console.error('General translation error:', error);
  } finally {
    button.textContent = '翻译';
    isTranslating = false;
  }
});

// Create cache management panel
function createCacheManagementPanel() {
  const panel = document.createElement('div');
  panel.id = 'immersive-translate-cache-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10002;
    min-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">翻译缓存管理</h3>
      <button id="close-cache-panel" style="
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
      ">×</button>
    </div>
    <div id="cache-stats" style="margin-bottom: 15px;">
      <p>加载中...</p>
    </div>
    <div style="margin-bottom: 15px;">
      <label for="cache-size-input">最大缓存条目数：</label>
      <input type="number" id="cache-size-input" min="100" max="10000" step="100" style="
        margin-left: 10px;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100px;
      ">
      <button id="update-cache-size" style="
        margin-left: 10px;
        padding: 5px 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      ">更新</button>
    </div>
    <div>
      <button id="clear-cache" style="
        padding: 8px 15px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        margin-right: 10px;
      ">清除缓存</button>
      <button id="export-cache" style="
        padding: 8px 15px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      ">导出缓存</button>
    </div>
  `;

  document.body.appendChild(panel);

  // Load and display cache stats
  updateCacheStats();

  // Event listeners
  document.getElementById('close-cache-panel').addEventListener('click', () => {
    panel.remove();
  });

  document.getElementById('update-cache-size').addEventListener('click', async () => {
    const input = document.getElementById('cache-size-input');
    const newSize = parseInt(input.value);
    if (newSize >= 100 && newSize <= 10000) {
      await translationCache.setMaxSize(newSize);
      updateCacheStats();
      alert('缓存大小已更新');
    } else {
      alert('请输入100-10000之间的数值');
    }
  });

  document.getElementById('clear-cache').addEventListener('click', async () => {
    if (confirm('确定要清除所有翻译缓存吗？')) {
      await translationCache.clear();
      updateCacheStats();
      alert('缓存已清除');
    }
  });

  document.getElementById('export-cache').addEventListener('click', async () => {
    const cache = await translationCache.getCache();
    const dataStr = JSON.stringify(cache, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'immersive-translate-cache.json';
    a.click();
    
    URL.revokeObjectURL(url);
  });

  async function updateCacheStats() {
    const stats = await translationCache.getStats();
    const statsDiv = document.getElementById('cache-stats');
    const cacheInput = document.getElementById('cache-size-input');
    
    cacheInput.value = stats.maxSize;
    
    statsDiv.innerHTML = `
      <p><strong>当前缓存条目：</strong> ${stats.currentSize} / ${stats.maxSize}</p>
      <p><strong>缓存使用率：</strong> ${((stats.currentSize / stats.maxSize) * 100).toFixed(1)}%</p>
    `;
  }
}