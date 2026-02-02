const CONFIG = { version: '1.0.0', storageKey: 'ai_assistant_settings', defaultUrl: 'http://localhost:3001' };
const C = { primary: '#3b82f6', primaryDark: '#2563eb', bg: '#111217', surface: '#1f2229', text: '#d8d9da', muted: '#8e8e8e', border: '#2c3235', success: '#73bf69', error: '#f2495c' };

let state = { isOpen: false, showSettings: false, isLoading: false, isConnected: false, serverUrl: CONFIG.defaultUrl, messages: [] as any[], eventSource: null as EventSource | null };
let sidebar: HTMLElement, toggleBtn: HTMLElement, messagesEl: HTMLElement, inputEl: HTMLTextAreaElement, sendBtn: HTMLButtonElement, statusEl: HTMLElement;

const styles = `
.ai-toggle{position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${C.primary},${C.primaryDark});border:none;cursor:pointer;box-shadow:0 3px 12px rgba(59,130,246,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;z-index:10000;transition:all .3s}
.ai-toggle:hover{transform:scale(1.1)}.ai-toggle.open{right:380px;background:${C.error}}
.ai-sidebar{position:fixed;top:0;right:-370px;width:360px;height:100vh;background:${C.bg};border-left:1px solid ${C.border};display:flex;flex-direction:column;z-index:9999;transition:right .3s;font-family:Inter,sans-serif;box-shadow:-4px 0 24px rgba(0,0,0,0.4)}
.ai-sidebar.open{right:0}
.ai-header{display:flex;align-items:center;justify-content:space-between;padding:12px;background:${C.surface};border-bottom:1px solid ${C.border}}
.ai-header-left{display:flex;align-items:center;gap:10px}
.ai-avatar{width:36px;height:36px;background:linear-gradient(135deg,${C.primary},${C.primaryDark});border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px}
.ai-title{color:#fff;font-size:14px;font-weight:600}
.ai-status{display:flex;align-items:center;gap:5px;font-size:11px;color:${C.muted}}
.ai-status.connected{color:${C.success}}.ai-status.error{color:${C.error}}
.ai-status-dot{width:6px;height:6px;border-radius:50%;background:${C.muted}}
.ai-status.connected .ai-status-dot{background:${C.success}}.ai-status.error .ai-status-dot{background:${C.error}}
.ai-hdr-btns{display:flex;gap:4px}
.ai-hdr-btn{width:28px;height:28px;border-radius:6px;border:none;background:rgba(255,255,255,0.06);color:${C.muted};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px}
.ai-hdr-btn:hover{background:rgba(255,255,255,0.12);color:#fff}
.ai-settings{display:none;padding:12px;background:#181b1f;border-bottom:1px solid ${C.border}}
.ai-settings.active{display:block}
.ai-settings input{width:100%;padding:8px;background:${C.bg};border:1px solid ${C.border};border-radius:5px;color:${C.text};font-size:12px;margin:6px 0}
.ai-settings button{width:100%;padding:8px;background:${C.primary};border:none;border-radius:5px;color:#fff;cursor:pointer}
.ai-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.ai-messages::-webkit-scrollbar{width:4px}.ai-messages::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
.ai-msg{display:flex;flex-direction:column;max-width:85%}
.ai-msg.user{align-self:flex-end}.ai-msg.assistant{align-self:flex-start}
.ai-msg-content{padding:9px 12px;border-radius:12px;font-size:12px;line-height:1.5;color:${C.text};word-wrap:break-word;white-space:pre-wrap}
.ai-msg.user .ai-msg-content{background:linear-gradient(135deg,${C.primary},${C.primaryDark});color:#fff;border-bottom-right-radius:4px}
.ai-msg.assistant .ai-msg-content{background:${C.surface};border:1px solid ${C.border};border-bottom-left-radius:4px}
.ai-cursor{display:inline-block;width:2px;height:12px;background:${C.primary};margin-left:2px;animation:blink 1s infinite}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
.ai-welcome{text-align:center;padding:24px 14px}
.ai-welcome-icon{font-size:40px;margin-bottom:10px}
.ai-welcome-title{font-size:16px;color:#fff;font-weight:600;margin-bottom:6px}
.ai-welcome-text{font-size:11px;color:${C.muted};margin-bottom:14px}
.ai-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.ai-chip{padding:6px 10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:14px;color:${C.text};font-size:10px;cursor:pointer}
.ai-chip:hover{background:rgba(59,130,246,0.2);border-color:${C.primary}}
.ai-input-wrap{padding:10px;background:${C.surface};border-top:1px solid ${C.border};display:flex;gap:6px;align-items:center}
.ai-input{flex:1;padding:8px 10px;background:${C.bg};border:1px solid ${C.border};border-radius:6px;color:${C.text};font-size:12px;resize:none;height:34px;outline:none}
.ai-input:focus{border-color:${C.primary}}
.ai-send{width:34px;height:34px;background:linear-gradient(135deg,${C.primary},${C.primaryDark});border:none;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
.ai-send:disabled{opacity:0.5;cursor:not-allowed}
.ai-footer{padding:6px;background:#181b1f;border-top:1px solid ${C.border};font-size:9px;color:${C.muted};text-align:center}
`;

const html = `
<div class="ai-sidebar" id="ai-sidebar">
  <div class="ai-header">
    <div class="ai-header-left">
      <div class="ai-avatar">🤖</div>
      <div><div class="ai-title">AI Assistant</div><div class="ai-status" id="ai-status"><span class="ai-status-dot"></span><span>Connecting...</span></div></div>
    </div>
    <div class="ai-hdr-btns">
      <button class="ai-hdr-btn" id="ai-clear" title="Clear">🗑️</button>
      <button class="ai-hdr-btn" id="ai-settings-btn" title="Settings">⚙️</button>
      <button class="ai-hdr-btn" id="ai-close" title="Close">✕</button>
    </div>
  </div>
  <div class="ai-settings" id="ai-settings-panel">
    <label style="font-size:11px;color:${C.text}">MCP Server URL</label>
    <input type="text" id="ai-url" value="${CONFIG.defaultUrl}">
    <button id="ai-test">Test Connection</button>
  </div>
  <div class="ai-messages" id="ai-messages">
    <div class="ai-welcome" id="ai-welcome">
      <div class="ai-welcome-icon">🤖</div>
      <div class="ai-welcome-title">AI Assistant</div>
      <div class="ai-welcome-text">Ask questions and get AI-powered answers.<br>Responses stream in real-time!</div>
      <div class="ai-chips">
        <span class="ai-chip" data-q="What is my total cost?">💰 Total cost</span>
        <span class="ai-chip" data-q="Show error rates">📊 Error rates</span>
        <span class="ai-chip" data-q="Summarize metrics">📈 Summary</span>
      </div>
    </div>
  </div>
  <div class="ai-input-wrap">
    <textarea class="ai-input" id="ai-input" placeholder="Ask anything..." rows="1"></textarea>
    <button class="ai-send" id="ai-send">➤</button>
  </div>
  <div class="ai-footer">AI Assistant v${CONFIG.version} • SSE Streaming</div>
</div>
<button class="ai-toggle" id="ai-toggle">🤖</button>`;

export function initSidebar(): void {
  if (document.getElementById('ai-sidebar')) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setTimeout(setup, 500);
}

function setup(): void {
  loadSettings();
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', html);
  
  sidebar = document.getElementById('ai-sidebar')!;
  toggleBtn = document.getElementById('ai-toggle')!;
  messagesEl = document.getElementById('ai-messages')!;
  inputEl = document.getElementById('ai-input') as HTMLTextAreaElement;
  sendBtn = document.getElementById('ai-send') as HTMLButtonElement;
  statusEl = document.getElementById('ai-status')!;
  
  (document.getElementById('ai-url') as HTMLInputElement).value = state.serverUrl;
  
  toggleBtn.onclick = toggle;
  document.getElementById('ai-close')!.onclick = toggle;
  document.getElementById('ai-settings-btn')!.onclick = toggleSettings;
  document.getElementById('ai-clear')!.onclick = clearChat;
  sendBtn.onclick = sendMessage;
  
  inputEl.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  
  document.querySelectorAll('.ai-chip').forEach(c => {
    c.addEventListener('click', function(this: HTMLElement) { inputEl.value = this.getAttribute('data-q') || ''; sendMessage(); });
  });
  
  document.getElementById('ai-url')!.onchange = function() { state.serverUrl = (this as HTMLInputElement).value; saveSettings(); };
  document.getElementById('ai-test')!.onclick = () => { state.serverUrl = (document.getElementById('ai-url') as HTMLInputElement).value; saveSettings(); checkConnection(); };
  
  document.onkeydown = (e) => { if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggle(); } };
  
  checkConnection();
  console.log('[AI Assistant] v' + CONFIG.version);
}

function loadSettings() { try { const s = localStorage.getItem(CONFIG.storageKey); if (s) state.serverUrl = JSON.parse(s).mcpServerUrl || CONFIG.defaultUrl; } catch(e){} }
function saveSettings() { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify({ mcpServerUrl: state.serverUrl })); } catch(e){} }

function toggle() {
  state.isOpen = !state.isOpen;
  sidebar.classList.toggle('open', state.isOpen);
  toggleBtn.classList.toggle('open', state.isOpen);
  toggleBtn.innerHTML = state.isOpen ? '✕' : '🤖';
  if (state.isOpen) inputEl.focus();
}

function toggleSettings() {
  state.showSettings = !state.showSettings;
  document.getElementById('ai-settings-panel')!.classList.toggle('active', state.showSettings);
}

function clearChat() {
  state.messages = [];
  messagesEl.querySelectorAll('.ai-msg').forEach(m => m.remove());
  const w = document.getElementById('ai-welcome'); if (w) w.style.display = 'block';
}

async function checkConnection() {
  updateStatus('Checking...', '');
  try {
    const r = await fetch(state.serverUrl + '/health');
    const d = await r.json();
    state.isConnected = d.status === 'healthy' || d.status === 'degraded';
    updateStatus(state.isConnected ? 'Connected' : 'Degraded', state.isConnected ? 'connected' : 'error');
  } catch (e) { state.isConnected = false; updateStatus('Disconnected', 'error'); }
}

function updateStatus(text: string, cls: string) { statusEl.className = 'ai-status ' + cls; statusEl.innerHTML = '<span class="ai-status-dot"></span><span>' + text + '</span>'; }

function addMessage(role: 'user'|'assistant', content: string): string {
  const id = 'msg-' + Date.now();
  state.messages.push({ id, role, content });
  const w = document.getElementById('ai-welcome'); if (w) w.style.display = 'none';
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.id = id;
  div.innerHTML = '<div class="ai-msg-content">' + formatText(content) + '</div>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return id;
}

function updateMessage(id: string, content: string, streaming: boolean) {
  const el = document.getElementById(id)?.querySelector('.ai-msg-content');
  if (el) el.innerHTML = formatText(content) + (streaming ? '<span class="ai-cursor"></span>' : '');
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatText(t: string): string {
  return (t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}

async function sendMessage() {
  const q = inputEl.value.trim();
  if (!q || state.isLoading) return;
  inputEl.value = '';
  state.isLoading = true;
  sendBtn.disabled = true;
  addMessage('user', q);
  const aid = addMessage('assistant', '');
  if (state.isConnected) await streamSSE(q, aid);
  else { updateMessage(aid, '⚠️ Not connected. Check settings.', false); state.isLoading = false; sendBtn.disabled = false; }
}

async function streamSSE(q: string, id: string) {
  let content = '';
  updateStatus('Streaming...', 'connected');
  try {
    state.eventSource = new EventSource(state.serverUrl + '/stream?question=' + encodeURIComponent(q));
    state.eventSource.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.token) { content += d.token; updateMessage(id, content, true); }
        if (d.done) { state.eventSource?.close(); state.eventSource = null; state.isLoading = false; sendBtn.disabled = false; updateMessage(id, content || d.full_response || 'Done', false); updateStatus('Connected', 'connected'); }
        if (d.error) { state.eventSource?.close(); state.eventSource = null; state.isLoading = false; sendBtn.disabled = false; updateMessage(id, '❌ ' + d.error, false); updateStatus('Error', 'error'); }
      } catch(e){}
    };
    state.eventSource.onerror = () => {
      state.eventSource?.close(); state.eventSource = null;
      if (!content) fetchHTTP(q, id);
      else { state.isLoading = false; sendBtn.disabled = false; updateMessage(id, content, false); }
      setTimeout(checkConnection, 3000);
    };
  } catch(e) { fetchHTTP(q, id); }
}

async function fetchHTTP(q: string, id: string) {
  try {
    const r = await fetch(state.serverUrl + '/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
    const d = await r.json();
    updateMessage(id, d.answer || d.response || 'No response', false);
    updateStatus('Connected', 'connected');
  } catch(e) { updateMessage(id, '❌ Connection failed', false); updateStatus('Disconnected', 'error'); }
  state.isLoading = false; sendBtn.disabled = false;
}

(window as any).AIAssistant = { toggle, setServerUrl: (u: string) => { state.serverUrl = u; saveSettings(); checkConnection(); } };
