const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add new state variables
content = content.replace(
  /const \[savedProfiles, setSavedProfiles\] = useState<any\[\]>\(\[\]\);/,
  `const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showKundliListModal, setShowKundliListModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveQuery, setSaveQuery] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedProfileMetadata, setLoadedProfileMetadata] = useState<{query?: string, notes?: string}>({});`
);

// 2. Add an icon import for List
content = content.replace(
  /import \{ Settings, Save, LayoutTemplate, Aperture, Grid3X3, BarChart, Clock, Moon, Sparkles, Database, TrendingUp \} from 'lucide-react';/,
  `import { Settings, Save, LayoutTemplate, Aperture, Grid3X3, BarChart, Clock, Moon, Sparkles, Database, TrendingUp, List } from 'lucide-react';`
);

// 3. Update handleSaveProfile to be just opening the modal
content = content.replace(
  /const handleSaveProfile = async \(\) => \{\n\s+if \(!formRef.current\) return;\n\s+const formData = new FormData\(formRef.current\);\n\s+const name = formData.get\('name'\) as string;\n\s+if \(!name\) \{\n\s+alert\("Please enter a name to save the profile."\);\n\s+return;\n\s+\}/,
  `const handleSaveProfileClick = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const name = formData.get('name') as string;
    if (!name) {
      alert("Please enter a name to save the profile.");
      return;
    }
    setSaveName(name);
    setSaveQuery('');
    setSaveNotes('');
    setShowSaveModal(true);
  };

  const handleConfirmSaveProfile = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const name = saveName;
    if (!name) return;`
);

// rename the rest of the handleSaveProfile to handleConfirmSaveProfile
content = content.replace(
  /const profile = \{\n\s+name,\n\s+date: formData.get\('date'\),\n\s+time: formData.get\('time'\),\n\s+lat: formData.get\('lat'\),\n\s+lon: formData.get\('lon'\),\n\s+tzOffset: formData.get\('tzOffset'\) \|\| '',\n\s+ianaTz: formData.get\('ianaTz'\) \|\| '',\n\s+locationLabel: formData.get\('locationLabel'\) \|\| '',\n\s+\};/,
  `const profile = {
      name,
      query: saveQuery,
      notes: saveNotes,
      date: formData.get('date'),
      time: formData.get('time'),
      lat: formData.get('lat'),
      lon: formData.get('lon'),
      tzOffset: formData.get('tzOffset') || '',
      ianaTz: formData.get('ianaTz') || '',
      locationLabel: formData.get('locationLabel') || '',
    };`
);

// close the modal in handleConfirmSaveProfile
content = content.replace(
  /alert\(\`Profile for \$\{name\} saved successfully! \$\{user \? 'Synced to cloud.' : 'Saved locally \\(offline\\).'\}\`\);\n\s+\};/,
  `alert(\`Profile for \${name} saved successfully! \${user ? 'Synced to cloud.' : 'Saved locally (offline).'}\`);
    setShowSaveModal(false);
  };`
);

// 4. Update loadProfile to set metadata
content = content.replace(
  /const loadProfile = \(profile: any\) => \{\n\s+if \(!formRef.current\) return;/,
  `const loadProfile = (profile: any) => {
    if (!formRef.current) return;
    setLoadedProfileMetadata({ query: profile.query || '', notes: profile.notes || '' });
    setShowKundliListModal(false);`
);

// 5. Replace inline saved profiles with the new buttons and modals
// First, find the buttons section
content = content.replace(
  /<button type="button" className="submit-btn save-btn" onClick=\{handleSaveProfile\} style=\{\{ padding: '0\.6rem 1rem', flex: 1, backgroundColor: 'var\(--border\)', color: 'var\(--foreground\)' \}\}>\n\s+<Save size=\{18\} \/>\n\s+<\/button>/,
  `<button type="button" className="submit-btn save-btn" onClick={handleSaveProfileClick} style={{ padding: '0.6rem 1rem', flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }} title="Save Profile">
              <Save size={18} />
            </button>
            <button type="button" className="submit-btn list-btn" onClick={() => setShowKundliListModal(true)} style={{ padding: '0.6rem 1rem', flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }} title="Kundli List">
              <List size={18} />
            </button>`
);

// Then remove the old savedProfiles inline list and inject the modals
content = content.replace(
  /\{savedProfiles\.length > 0 && \(\n\s+<div style=\{\{ display: 'flex', gap: '0\.5rem', overflowX: 'auto', paddingBottom: '0\.5rem' \}\}>\n\s+\{savedProfiles\.map\(p => \(\n\s+<div key=\{p\.name\} className="profile-item" style=\{\{ flexShrink: 0, padding: '0\.5rem 1rem', display: 'flex', gap: '1rem', cursor: 'pointer' \}\}>\n\s+<span onClick=\{\(\) => loadProfile\(p\)\} className="profile-name" style=\{\{ color: 'var\(--primary\)' \}\}>\{p\.name\}<\/span>\n\s+<button onClick=\{\(\) => deleteProfile\(p\.name\)\} className="profile-delete" title="Delete Profile" style=\{\{ padding: 0 \}\}>❌<\/button>\n\s+<\/div>\n\s+\)\)\}\n\s+<\/div>\n\s+\)\}/,
  `
  {/* Modals go here */}
  {showSaveModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1rem' }}>Save Profile</h3>
        <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>{saveName}</p>
        <div className="form-group">
          <label>Query</label>
          <input type="text" value={saveQuery} onChange={e => setSaveQuery(e.target.value)} placeholder="E.g., Career prospects" className="form-input" />
        </div>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Notes</label>
          <textarea value={saveNotes} onChange={e => setSaveNotes(e.target.value)} placeholder="Any additional notes..." className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={() => setShowSaveModal(false)} className="submit-btn" style={{ flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>Cancel</button>
          <button onClick={handleConfirmSaveProfile} className="submit-btn" style={{ flex: 1 }} disabled={syncing}>{syncing ? 'Saving...' : 'Confirm Save'}</button>
        </div>
      </div>
    </div>
  )}

  {showKundliListModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>Saved Kundlis</h3>
          <button onClick={() => setShowKundliListModal(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>
        <input 
          type="text" 
          placeholder="Search by name, query or notes..." 
          className="form-input" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {savedProfiles
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.query || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase()))
            .map(p => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(201, 168, 106, 0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => loadProfile(p)}>
                <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--primary)' }}>{p.name}</h4>
                {p.query && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Query:</strong> {p.query}</p>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteProfile(p.name); }} className="profile-delete" title="Delete Profile" style={{ padding: '0.4rem', marginLeft: '1rem', cursor: 'pointer', zIndex: 10 }}>❌</button>
            </div>
          ))}
          {savedProfiles.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No saved Kundlis found.</p>}
        </div>
      </div>
    </div>
  )}
  `
);

// 6. Display query and notes in JsonData Tab
content = content.replace(
  /<pre style=\{\{ background: '#FCFBF8', padding: '1\.5rem', borderRadius: '12px', color: '#2E3131', overflowX: 'auto', fontSize: '0\.85rem', border: '1px solid var\(--border\)' \}\}>\n\s+\{JSON\.stringify\(data\.yogaState, null, 2\)\}\n\s+<\/pre>/,
  `{(loadedProfileMetadata.query || loadedProfileMetadata.notes) && (
                    <div style={{ background: 'rgba(201, 168, 106, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                      {loadedProfileMetadata.query && (
                        <div style={{ marginBottom: loadedProfileMetadata.notes ? '1rem' : 0 }}>
                          <strong style={{ color: 'var(--primary)' }}>Query:</strong>
                          <p style={{ margin: '0.2rem 0 0 0' }}>{loadedProfileMetadata.query}</p>
                        </div>
                      )}
                      {loadedProfileMetadata.notes && (
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>Notes:</strong>
                          <p style={{ margin: '0.2rem 0 0 0', whiteSpace: 'pre-wrap' }}>{loadedProfileMetadata.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <pre style={{ background: '#FCFBF8', padding: '1.5rem', borderRadius: '12px', color: '#2E3131', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
                    {JSON.stringify(data.yogaState, null, 2)}
                  </pre>`
);

fs.writeFileSync('src/app/page.tsx', content);
