const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const modalCode = `
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
          <button type="button" onClick={() => setShowSaveModal(false)} className="submit-btn" style={{ flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>Cancel</button>
          <button type="button" onClick={handleConfirmSaveProfile} className="submit-btn" style={{ flex: 1 }} disabled={syncing}>{syncing ? 'Saving...' : 'Confirm Save'}</button>
        </div>
      </div>
    </div>
  )}

  {showKundliListModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>Saved Kundlis</h3>
          <button type="button" onClick={() => setShowKundliListModal(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
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
              <button type="button" onClick={(e) => { e.stopPropagation(); deleteProfile(p.name); }} className="profile-delete" title="Delete Profile" style={{ padding: '0.4rem', marginLeft: '1rem', cursor: 'pointer', zIndex: 10 }}>✕</button>
            </div>
          ))}
          {savedProfiles.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No saved Kundlis found.</p>}
        </div>
      </div>
    </div>
  )}
`;

const blockRegex = /\{savedProfiles\.length > 0 && \([\s\S]*?<div style=\{\{ display: 'flex', gap: '0\.5rem', overflowX: 'auto', paddingBottom: '0\.5rem' \}\}>[\s\S]*?\{savedProfiles\.map\(p => \([\s\S]*?key=\{p\.name\}[\s\S]*?<span onClick=\{\(\) => loadProfile\(p\)\}[\s\S]*?\{p\.name\}<\/span>[\s\S]*?<button onClick=\{\(\) => deleteProfile\(p\.name\)\}[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?\)\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/;

content = content.replace(blockRegex, modalCode);
fs.writeFileSync('src/app/page.tsx', content);
