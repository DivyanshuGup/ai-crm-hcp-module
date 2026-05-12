import { useSelector, useDispatch } from 'react-redux'
import { updateField, resetForm, setSavedId } from '../redux/interactionSlice'
import API from '../services/api'
import { useState } from 'react'

const SENTIMENT_OPTIONS = ['Positive', 'Neutral', 'Negative']
const INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Conference', 'Other']

export default function InteractionForm() {
  const data = useSelector((state) => state.interaction)
  const dispatch = useDispatch()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) =>
    dispatch(updateField({ field, value: e.target.value }))

  const handleSave = async () => {
    if (!data.hcpName.trim()) {
      setError('HCP Name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await API.post('/interactions', {
        hcp_name: data.hcpName,
        interaction_type: data.interactionType,
        date: data.date,
        time: data.time,
        attendees: data.attendees,
        topics_discussed: data.topicsDiscussed,
        materials_shared: data.materialsShared,
        samples_distributed: data.samplesDistributed,
        sentiment: data.sentiment,
        outcomes: data.outcomes,
        follow_up: data.followUp,
        ai_summary: '',
      })
      dispatch(setSavedId(res.data.id))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save. Is the backend running?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <h2 style={styles.title}>Log HCP Interaction</h2>
        {data.savedId && (
          <span style={styles.idBadge}>ID: #{data.savedId}</span>
        )}
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Interaction Details</p>

        {/* Row 1: HCP Name + Interaction Type */}
        <div style={styles.row2}>
          <div style={styles.field}>
            <label style={styles.label}>HCP Name</label>
            <input
              value={data.hcpName}
              onChange={set('hcpName')}
              placeholder="Search or select HCP..."
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Interaction Type</label>
            <select value={data.interactionType} onChange={set('interactionType')} style={styles.input}>
              {INTERACTION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date + Time */}
        <div style={styles.row2}>
          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input type="date" value={data.date} onChange={set('date')} style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Time</label>
            <input type="time" value={data.time} onChange={set('time')} style={styles.input} />
          </div>
        </div>

        {/* Attendees */}
        <div style={styles.field}>
          <label style={styles.label}>Attendees</label>
          <input
            value={data.attendees}
            onChange={set('attendees')}
            placeholder="Enter names or search..."
            style={styles.input}
          />
        </div>

        {/* Topics Discussed */}
        <div style={styles.field}>
          <label style={styles.label}>Topics Discussed</label>
          <textarea
            value={data.topicsDiscussed}
            onChange={set('topicsDiscussed')}
            placeholder="Enter key discussion points..."
            style={styles.textarea}
          />
        </div>

        {/* Materials Shared */}
        <div style={styles.field}>
          <label style={styles.label}>Materials Shared</label>
          <input
            value={data.materialsShared}
            onChange={set('materialsShared')}
            placeholder="e.g. Product brochure, Clinical data..."
            style={styles.input}
          />
        </div>

        {/* Samples Distributed */}
        <div style={styles.field}>
          <label style={styles.label}>Samples Distributed</label>
          <input
            value={data.samplesDistributed}
            onChange={set('samplesDistributed')}
            placeholder="e.g. Drug X – 5 units"
            style={styles.input}
          />
        </div>

        {/* Sentiment */}
        <div style={styles.field}>
          <label style={styles.label}>Observed / Inferred HCP Sentiment</label>
          <div style={styles.sentimentRow}>
            {SENTIMENT_OPTIONS.map((opt) => (
              <label key={opt} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="sentiment"
                  value={opt}
                  checked={data.sentiment === opt}
                  onChange={set('sentiment')}
                  style={{ marginRight: 6 }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div style={styles.field}>
          <label style={styles.label}>Outcomes</label>
          <textarea
            value={data.outcomes}
            onChange={set('outcomes')}
            placeholder="Key outcomes or agreements..."
            style={styles.textarea}
          />
        </div>

        {/* Follow-up */}
        <div style={styles.field}>
          <label style={styles.label}>Follow-up Actions</label>
          <textarea
            value={data.followUp}
            onChange={set('followUp')}
            placeholder="Enter next steps or tasks..."
            style={styles.textarea}
          />
        </div>

        {/* AI Suggestions */}
        {data.aiSuggestions && data.aiSuggestions.length > 0 && (
          <div style={styles.suggestions}>
            <p style={styles.suggestionTitle}>⚡ AI Suggested Follow-ups:</p>
            {data.aiSuggestions.map((s, i) => (
              <p key={i} style={styles.suggestionItem}>→ {s}</p>
            ))}
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {/* Actions */}
        <div style={styles.actionRow}>
          <button onClick={() => dispatch(resetForm())} style={styles.btnSecondary}>
            Clear
          </button>
          <button onClick={handleSave} style={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Interaction'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  cardHeader: {
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
  },
  idBadge: {
    fontSize: 12,
    background: '#e0e7ff',
    color: '#4338ca',
    padding: '3px 10px',
    borderRadius: 99,
    fontWeight: 500,
  },
  section: {
    padding: '20px 24px',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 16,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 4,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    outline: 'none',
    color: '#111827',
    fontFamily: 'Inter, sans-serif',
    background: '#fff',
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    minHeight: 72,
    padding: '9px 12px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    outline: 'none',
    resize: 'vertical',
    color: '#111827',
    fontFamily: 'Inter, sans-serif',
  },
  sentimentRow: {
    display: 'flex',
    gap: 20,
    marginTop: 6,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    color: '#374151',
    cursor: 'pointer',
  },
  suggestions: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#166534',
    marginBottom: 6,
  },
  suggestionItem: {
    fontSize: 13,
    color: '#15803d',
    marginBottom: 3,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
  actionRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnPrimary: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  btnSecondary: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
}
