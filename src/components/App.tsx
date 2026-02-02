import React, { useState, useEffect } from 'react';
import { AppRootProps } from '@grafana/data';

const SETTINGS_KEY = 'ai_assistant_settings';

export const App: React.FC<AppRootProps> = () => {
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [status, setStatus] = useState<'checking'|'connected'|'disconnected'>('checking');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      if (s) setServerUrl(JSON.parse(s).mcpServerUrl || 'http://localhost:3001');
    } catch (e) {}
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const r = await fetch(serverUrl + '/health');
      const d = await r.json();
      setStatus(d.status === 'healthy' ? 'connected' : 'disconnected');
    } catch (e) {
      setStatus('disconnected');
    }
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mcpServerUrl: serverUrl }));
    if ((window as any).AIAssistant) (window as any).AIAssistant.setServerUrl(serverUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    checkConnection();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <h1 style={{ color: '#fff', marginBottom: '8px' }}>🤖 AI Assistant</h1>
      <p style={{ color: '#8e8e8e', marginBottom: '24px' }}>Universal AI chatbot sidebar for Grafana</p>
      
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ color: '#3b82f6', marginBottom: '16px' }}>🔌 MCP Server</h3>
        <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '6px',
          background: status === 'connected' ? 'rgba(34,197,94,0.1)' : status === 'disconnected' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
          border: '1px solid ' + (status === 'connected' ? '#22c55e' : status === 'disconnected' ? '#ef4444' : '#3b82f6') }}>
          {status === 'connected' ? '✅ Connected' : status === 'disconnected' ? '❌ Disconnected' : '🔄 Checking...'}
        </div>
        <label style={{ color: '#d8d9da', fontSize: '13px' }}>Server URL</label>
        <input type="text" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)}
          style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #334', borderRadius: '6px', color: '#fff', marginTop: '6px', marginBottom: '12px' }} />
        <button onClick={saveSettings} style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', marginRight: '8px' }}>
          {saved ? '✓ Saved!' : 'Save'}
        </button>
        <button onClick={checkConnection} style={{ padding: '10px 20px', background: '#334', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
          Test
        </button>
      </div>

      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#3b82f6', marginBottom: '12px' }}>💡 How to Use</h3>
        <p style={{ color: '#d8d9da', lineHeight: 1.8 }}>
          1. Click the blue 🤖 button (bottom-right)<br/>
          2. Type your question<br/>
          3. Watch responses stream in real-time!<br/><br/>
          <strong>Shortcut:</strong> Ctrl+B to toggle sidebar
        </p>
      </div>
    </div>
  );
};
