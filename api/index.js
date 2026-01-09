const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Topaz API Checker</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      background: #fff;
      color: #000;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      text-transform: uppercase;
      border: 4px solid #000;
      padding: 20px;
      margin-bottom: 30px;
      background: #ff0;
    }
    .form-section {
      border: 4px solid #000;
      padding: 20px;
      margin-bottom: 30px;
      background: #f0f0f0;
    }
    label {
      display: block;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 10px;
      font-size: 1rem;
    }
    textarea {
      width: 100%;
      height: 200px;
      border: 3px solid #000;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      resize: vertical;
      background: #fff;
    }
    textarea:focus {
      outline: none;
      border-color: #f00;
    }
    button {
      margin-top: 20px;
      padding: 15px 40px;
      font-size: 1.2rem;
      font-weight: bold;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      border: 4px solid #000;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      transition: all 0.1s;
    }
    button:hover {
      background: #fff;
      color: #000;
    }
    button:disabled {
      background: #999;
      cursor: not-allowed;
    }
    .results-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .results-section {
      border: 4px solid #000;
      padding: 20px;
    }
    .results-section.success-section {
      background: #e0ffe0;
    }
    .results-section.failed-section {
      background: #ffe0e0;
    }
    .results-section h2 {
      font-size: 1.2rem;
      text-transform: uppercase;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .results-section h2 .count {
      background: #000;
      color: #fff;
      padding: 3px 10px;
      font-size: 0.9rem;
    }
    .results-list {
      font-size: 14px;
      max-height: 400px;
      overflow-y: auto;
    }
    .result-item {
      border: 2px solid #000;
      padding: 12px;
      margin-bottom: 8px;
      background: #fff;
      position: relative;
    }
    .result-item.success {
      border-left: 6px solid #0a0;
    }
    .result-item.error {
      border-left: 6px solid #f00;
    }
    .api-key {
      font-weight: bold;
      word-break: break-all;
      font-size: 13px;
    }
    .credits {
      margin-top: 8px;
    }
    .credits span {
      display: inline-block;
      background: #000;
      color: #fff;
      padding: 3px 8px;
      margin-right: 5px;
      margin-top: 3px;
      font-size: 12px;
    }
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 10px;
      font-size: 11px;
      margin: 0;
      background: #333;
      border: 2px solid #000;
    }
    .copy-btn:hover {
      background: #000;
      color: #fff;
    }
    .copy-btn.copied {
      background: #0a0;
    }
    .copy-all-btn {
      padding: 8px 15px;
      font-size: 0.8rem;
      margin: 0;
    }
    .loading {
      display: inline-block;
      animation: blink 0.5s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .hint {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
    .empty-msg {
      color: #666;
      font-style: italic;
    }
    @media (max-width: 700px) {
      .results-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Topaz API Checker</h1>
    
    <div class="form-section">
      <label for="apiKeys">API Keys (one per line)</label>
      <textarea id="apiKeys" placeholder="Enter your Topaz API keys here...&#10;key1&#10;key2&#10;key3"></textarea>
      <p class="hint">Paste your API keys, one per line. Empty lines will be ignored.</p>
      <button id="checkBtn" onclick="checkKeys()">Check Credits</button>
    </div>
    
    <div class="results-container">
      <div class="results-section success-section">
        <h2>
          <span>Success <span class="count" id="successCount">0</span></span>
          <button class="copy-all-btn" onclick="copyAll('success')">Copy All</button>
        </h2>
        <div class="results-list" id="successResults">
          <p class="empty-msg">No results yet...</p>
        </div>
      </div>
      
      <div class="results-section failed-section">
        <h2>
          <span>Failed <span class="count" id="failedCount">0</span></span>
          <button class="copy-all-btn" onclick="copyAll('failed')">Copy All</button>
        </h2>
        <div class="results-list" id="failedResults">
          <p class="empty-msg">No results yet...</p>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    let successKeys = [];
    let failedKeys = [];
    
    async function checkKeys() {
      const textarea = document.getElementById('apiKeys');
      const successDiv = document.getElementById('successResults');
      const failedDiv = document.getElementById('failedResults');
      const btn = document.getElementById('checkBtn');
      
      const keys = textarea.value
        .split('\\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      if (keys.length === 0) {
        successDiv.innerHTML = '<p class="empty-msg">Please enter at least one API key.</p>';
        failedDiv.innerHTML = '<p class="empty-msg">Please enter at least one API key.</p>';
        return;
      }
      
      btn.disabled = true;
      btn.textContent = 'Checking...';
      successDiv.innerHTML = '<p class="loading">Processing...</p>';
      failedDiv.innerHTML = '<p class="loading">Processing...</p>';
      
      successKeys = [];
      failedKeys = [];
      
      const results = [];
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
          const res = await fetch('/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key })
          });
          const data = await res.json();
          results.push({ key, ...data });
        } catch (err) {
          results.push({ key, success: false, error: err.message });
        }
      }
      
      let successHtml = '';
      let failedHtml = '';
      let successCount = 0;
      let failedCount = 0;
      
      results.forEach((r, i) => {
        const maskedKey = r.key.substring(0, 8) + '...' + r.key.substring(r.key.length - 4);
        
        if (r.success && r.data && r.data.available_credits > 0) {
          successKeys.push(r.key);
          successCount++;
          successHtml += '<div class="result-item success" data-key="' + r.key + '">';
          successHtml += '<button class="copy-btn" onclick="copyKey(this, \\'' + r.key + '\\')">Copy</button>';
          successHtml += '<div class="api-key">' + maskedKey + '</div>';
          successHtml += '<div class="credits">';
          successHtml += '<span>Available: ' + r.data.available_credits + '</span>';
          successHtml += '<span>Reserved: ' + r.data.reserved_credits + '</span>';
          successHtml += '<span>Total: ' + r.data.total_credits + '</span>';
          successHtml += '</div></div>';
        } else {
          failedKeys.push(r.key);
          failedCount++;
          failedHtml += '<div class="result-item error" data-key="' + r.key + '">';
          failedHtml += '<button class="copy-btn" onclick="copyKey(this, \\'' + r.key + '\\')">Copy</button>';
          failedHtml += '<div class="api-key">' + maskedKey + '</div>';
          failedHtml += '<div class="credits">';
          if (r.success && r.data) {
            failedHtml += '<span style="background:#f00;">Available: 0</span>';
            failedHtml += '<span>Reserved: ' + r.data.reserved_credits + '</span>';
            failedHtml += '<span>Total: ' + r.data.total_credits + '</span>';
          } else {
            failedHtml += '<span style="background:#f00;">Error: ' + r.error + '</span>';
          }
          failedHtml += '</div></div>';
        }
      });
      
      successDiv.innerHTML = successHtml || '<p class="empty-msg">No successful keys</p>';
      failedDiv.innerHTML = failedHtml || '<p class="empty-msg">No failed keys</p>';
      document.getElementById('successCount').textContent = successCount;
      document.getElementById('failedCount').textContent = failedCount;
      
      btn.disabled = false;
      btn.textContent = 'Check Credits';
    }
    
    function copyKey(btn, key) {
      navigator.clipboard.writeText(key).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1500);
      });
    }
    
    function copyAll(type) {
      const keys = type === 'success' ? successKeys : failedKeys;
      if (keys.length === 0) return;
      
      navigator.clipboard.writeText(keys.join('\\n')).then(() => {
        alert('Copied ' + keys.length + ' key(s) to clipboard!');
      });
    }
  </script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.send(HTML_PAGE);
});

app.post('/api/check', async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.json({ success: false, error: 'API key is required' });
  }
  
  try {
    const response = await fetch('https://api.topazlabs.com/account/v1/credits/balance', {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      return res.json({ success: false, error: 'API Error: ' + response.status + ' - ' + text });
    }
    
    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
  });
}

module.exports = app;
