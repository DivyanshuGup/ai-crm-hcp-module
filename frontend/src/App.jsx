import InteractionForm from './components/InteractionForm'
import ChatAssistant from './components/ChatAssistant'

export default function App() {
  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.logo}>💊 AI-First CRM</span>
        <span style={styles.module}>HCP Module — Log Interaction</span>
      </div>

      {/* Main layout: form (left) + chat (right) */}
      <div style={styles.layout}>
        <div style={styles.formCol}>
          <InteractionForm />
        </div>
        <div style={styles.chatCol}>
          <ChatAssistant />
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 16,
    fontWeight: 700,
    color: '#4f46e5',
  },
  module: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: 500,
  },
  layout: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 24,
    padding: '24px 32px',
    maxWidth: 1280,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  formCol: {
    minWidth: 0,
  },
  chatCol: {
    minWidth: 0,
    minHeight: 600,
    display: 'flex',
    flexDirection: 'column',
  },
}
