import { useState, useRef } from 'react'

const MODES = [
  { id: 'summarize', label: 'Summarize Tasks', icon: '📋', desc: 'Paste a task list and get a clean summary with priorities' },
  { id: 'report',   label: 'Generate Report', icon: '📊', desc: 'Turn raw notes into a structured professional report' },
  { id: 'qa',       label: 'Ask a Document',  icon: '🔍', desc: 'Paste any document and ask questions about it' },
  { id: 'plan',     label: 'Break Down Task', icon: '🗂️',  desc: 'Give a big task and get step-by-step execution plan' },
]

const SYSTEM_PROMPTS = {
  summarize: `You are a productivity assistant. The user will provide a list of tasks or notes.
Your job is to:
1. Summarize all tasks clearly
2. Categorize them (Urgent, Important, Normal, Low Priority)
3. Suggest which to tackle first and why
Format your response with clear sections and bullet points.`,

  report: `You are a professional report writer. The user will provide raw notes or data.
Convert it into a clean, structured report with:
- Executive Summary
- Key Points
- Details
- Recommendations
Use professional language. Be concise but thorough.`,

  qa: `You are a document analysis assistant. The user will first provide a document, then ask questions about it.
Answer questions accurately based ONLY on the provided document content.
If the answer is not in the document, say so clearly.
Quote relevant parts when helpful.`,

  plan: `You are a project planning expert. The user will describe a task or goal.
Break it down into:
1. Clear numbered steps
2. Time estimate for each step
3. Resources or tools needed
4. Potential blockers and how to avoid them
Be practical and specific.`,
}

export default function App() {
  const [apiKey, setApiKey]       = useState('')
  const [keySet, setKeySet]       = useState(false)
  const [mode, setMode]           = useState('summarize')
  const [input, setInput]         = useState('')
  const [question, setQuestion]   = useState('')
  const [output, setOutput]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [history, setHistory]     = useState([])
  const outputRef = useRef(null)

  const saveKey = () => {
    if (apiKey.trim().startsWith('sk-')) {
      setKeySet(true)
      setError('')
    } else {
      setError('API key must start with "sk-"')
    }
  }

  const callClaude = async () => {
    if (!input.trim()) { setError('Please enter some text first.'); return }
    if (mode === 'qa' && !question.trim()) { setError('Please enter a question.'); return }

    setLoading(true)
    setError('')
    setOutput('')

    const userMessage = mode === 'qa'
      ? `DOCUMENT:\n${input}\n\nQUESTION: ${question}`
      : input

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: SYSTEM_PROMPTS[mode],
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'API error. Check your key.')
        setLoading(false)
        return
      }

      const result = data.content[0].text
      setOutput(result)
      setHistory(h => [{ mode, input: input.slice(0, 80) + '...', output: result, time: new Date().toLocaleTimeString() }, ...h.slice(0, 4)])
    } catch (e) {
      setError('Network error: ' + e.message)
    }

    setLoading(false)
  }

  const currentMode = MODES.find(m => m.id === mode)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>AI Task Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Powered by Claude</div>
          </div>
        </div>
        {keySet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)', background: 'var(--green-bg)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.2)' }}>
            <span>●</span> API Connected
          </div>
        )}
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: keySet ? '240px 1fr 280px' : '1fr', maxWidth: 1200, margin: '0 auto', width: '100%', padding: '1.5rem', gap: '1.5rem' }}>

        {/* API KEY SETUP */}
        {!keySet ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 440 }}>
              <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>🔑</div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Connect Your API Key</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, textAlign: 'center', lineHeight: 1.6 }}>
                Get your key from <a href="https://console.anthropic.com" target="_blank" style={{ color: 'var(--accent2)' }}>console.anthropic.com</a>.<br/>It stays in your browser only.
              </p>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 14, fontFamily: 'var(--mono)', marginBottom: 12, outline: 'none' }}
              />
              {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</p>}
              <button onClick={saveKey} style={{ width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Start Using Assistant →
              </button>
              <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>Built by Ariful Islam · github.com/ARIFUL-ISLAM8</p>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT: Mode Selector */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Mode</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setOutput(''); setError('') }}
                    style={{ background: mode === m.id ? 'var(--accent-bg)' : 'transparent', border: mode === m.id ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent', borderRadius: 10, padding: '10px 12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 13, fontWeight: mode === m.id ? 500 : 400, color: mode === m.id ? 'var(--accent2)' : 'var(--text)' }}>{m.icon} {m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Recent</p>
                  {history.map((h, i) => (
                    <div key={i} onClick={() => setOutput(h.output)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 6, cursor: 'pointer', background: 'var(--bg2)' }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{MODES.find(m => m.id === h.mode)?.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{h.input}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{h.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CENTER: Main */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{currentMode.icon} {currentMode.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currentMode.desc}</div>
              </div>

              <textarea
                placeholder={mode === 'qa' ? 'Paste your document here...' : 'Paste your tasks, notes, or text here...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', resize: 'vertical', minHeight: 160, outline: 'none', lineHeight: 1.7 }}
              />

              {mode === 'qa' && (
                <input
                  placeholder="What's your question about this document?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                />
              )}

              {error && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={callClaude} disabled={loading}
                style={{ padding: '13px', background: loading ? 'var(--border)' : 'var(--accent)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '-0.2px' }}>
                {loading ? '⏳ Analyzing...' : `✨ Run ${currentMode.label}`}
              </button>

              {output && (
                <div ref={outputRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Result</span>
                    <button onClick={() => navigator.clipboard.writeText(output)}
                      style={{ fontSize: 11, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 10px', color: 'var(--muted)', cursor: 'pointer' }}>
                      Copy
                    </button>
                  </div>
                  <pre style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font)', color: 'var(--text)' }}>{output}</pre>
                </div>
              )}
            </div>

            {/* RIGHT: Tips */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Tips</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '📋', title: 'Summarize', tip: 'Paste a messy to-do list or meeting notes.' },
                  { icon: '📊', title: 'Report', tip: 'Raw data or rough notes → polished report.' },
                  { icon: '🔍', title: 'Ask Doc', tip: "Paste a PDF's text, then ask anything." },
                  { icon: '🗂️', title: 'Plan', tip: 'Describe a project goal to get a roadmap.' },
                ].map(t => (
                  <div key={t.icon} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{t.icon} {t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{t.tip}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '14px', background: 'var(--accent-bg)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent2)', marginBottom: 6 }}>🛠 Stack Used</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
                  React · Vite<br/>
                  Claude API (Sonnet)<br/>
                  Vanilla CSS<br/>
                  Deployed via Vercel
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Built by <span style={{ color: 'var(--accent2)' }}>Ariful Islam</span><br/>
                github.com/ARIFUL-ISLAM8
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
