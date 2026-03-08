export default function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Notifications and preferences</p>

      <div style={{ border: '1px solid #ccc', padding: 24, maxWidth: 400 }}>
        {[
          { label: 'Email notifications', desc: 'Receive charging session updates via email', enabled: true },
          { label: 'Session reminders', desc: 'Remind me when charging is complete', enabled: false },
          { label: 'Cost alerts', desc: 'Alert when session cost exceeds a threshold', enabled: false },
        ].map(({ label, desc }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>{label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{desc}</p>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 12, color: '#666', marginTop: 16, textAlign: 'center' }}>Settings are saved automatically</p>
      </div>
    </div>
  )
}
