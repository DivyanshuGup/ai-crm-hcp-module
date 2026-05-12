import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import API from '../services/api'
import { setInteraction } from '../redux/interactionSlice'

export default function ChatAssistant() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const normalizeSentiment = (val) => {
    if (!val) return 'Neutral'
    const v = val.toLowerCase()
    if (v.includes('positive')) return 'Positive'
    if (v.includes('negative')) return 'Negative'
    return 'Neutral'
  }

  const normalizeType = (val) => {
    if (!val) return 'Meeting'
    const v = val.toLowerCase()
    if (v.includes('call')) return 'Call'
    if (v.includes('email')) return 'Email'
    if (v.includes('conference')) return 'Conference'
    if (v.includes('other')) return 'Other'
    return 'Meeting'
  }

  const handleSend = async () => {
    if (!message.trim()) return
    const userMsg = message.trim()
    setMessage('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await API.post('/agent/chat', { message: userMsg })
      const { summary, extracted_data } = res.data

      const displayText = summary && summary !== 'Interaction logged successfully.'
        ? summary
        : extracted_data.topicsDiscussed
          ? `Logged: ${extracted_data.hcpName} — ${extracted_data.topicsDiscussed}`
          : 'Interaction logged successfully.'

      setMessages((prev) => [...prev, { role: 'ai', text: displayText }])

      const payload = {
        hcpName: extracted_data.hcpName || '',
        interactionType: normalizeType(extracted_data.interactionType),
        topicsDiscussed: extracted_data.topicsDiscussed || '',
        sentiment: normalizeSentiment(extracted_data.sentiment),
        outcomes: extracted_data.outcomes || '',
        followUp: extracted_data.followUp || '',
        materialsShared: extracted_data.materialsShared || '',
        samplesDistributed: extracted_data.sampleDistributed || '',
        aiSuggestions: Array.isArray(extracted_data.recommendations)
          ? extracted_data.recommendations
          : [],
      }

      const filtered = Object.fromEntries(
        Object.entries(payload).filter(([, v]) =>
          Array.isArray(v) ? v.length > 0 : v !== ''
        )
      )

      dispatch(setInteraction(filtered))

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: '⚠️ Could not reach backend. Make sure FastAPI is running on port 8000.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>🤖</div>
          <div>
            <p style={styles.headerTitle}>AI Assistant</p>
            <p style={styles.headerSub}>Log interaction via chat</p>
          </div>
        </div>
        <div style={styles.onlineDot} />
      </div>

      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={styles.placeholder}>
            <p style={styles.placeholderTitle}>Describe your interaction</p>
            <p style={styles.placeholderEx}>e.g. "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userBubbleWrap : styles.aiBubbleWrap}>
            <div style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={styles.aiBubbleWrap}>
            <div style={styles.aiBubble}>
              <span style={styles.typing}>● ● ●</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe interaction..."
          style={styles.textarea}
        />
        <button onClick={handleSend} style={styles.logBtn} disabled={loading}>
          {loading ? '...' : '⚡ Log'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#f8fafc',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    background: '#ede9fe',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 1,
  },
  headerSub: {
    fontSize: 12,
    color: '#6b7280',
  },
  onlineDot: {
    width: 10,
    height: 10,
    background: '#22c55e',
    borderRadius: '50%',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  placeholder: {
    margin: 'auto',
    textAlign: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
    marginBottom: 8,
  },
  placeholderEx: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  userBubbleWrap: { display: 'flex', justifyContent: 'flex-end' },
  aiBubbleWrap: { display: 'flex', justifyContent: 'flex-start' },
  userBubble: {
    background: '#4f46e5',
    color: '#fff',
    borderRadius: '12px 12px 2px 12px',
    padding: '10px 14px',
    fontSize: 13,
    maxWidth: '85%',
    lineHeight: 1.5,
  },
  aiBubble: {
    background: '#fff',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: '12px 12px 12px 2px',
    padding: '10px 14px',
    fontSize: 13,
    maxWidth: '85%',
    lineHeight: 1.5,
  },
  typing: {
    color: '#9ca3af',
    letterSpacing: 3,
    fontSize: 12,
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    padding: '12px 16px',
    background: '#fff',
    borderTop: '1px solid #e5e7eb',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    resize: 'none',
    outline: 'none',
    color: '#111827',
  },
  logBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
  },
}