const fs = require('fs');
let code = fs.readFileSync('src/components/TaraNirnaySettings.tsx', 'utf8');

// Replace groups array mapping
code = code.replace(/toggleKey: 'enable[^']+',/g, '');
code = code.replace(/Array<{ title: string; toggleKey: keyof NDSWeights; keys: Array<keyof NDSWeights> }>/g, 'Array<{ title: string; keys: Array<keyof NDSWeights> }>');

// Remove renderToggle function
code = code.replace(/const renderToggle = .*?\n  };\n/s, '');

// The toggle per slider needs to be added.
// Find the mapping part:
// {groups.map((group, idx) => (
//   <div key={idx} style={{ marginBottom: '2.5rem' }}>
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
//       <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>{group.title}</h4>
//       {renderToggle(group.toggleKey, 'Enable Module')}
//     </div>
//     ...
//     <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', opacity: localWeights[group.toggleKey] === false ? 0.4 : 1, pointerEvents: localWeights[group.toggleKey] === false ? 'none' : 'auto' }}>
//       {group.keys.map(k => ( ...

code = code.replace(
  /\{renderToggle\(group\.toggleKey, 'Enable Module'\)\}/g,
  ''
);

code = code.replace(
  /opacity: localWeights\[group\.toggleKey\] === false \? 0\.4 : 1, pointerEvents: localWeights\[group\.toggleKey\] === false \? 'none' : 'auto'/g,
  'opacity: 1, pointerEvents: "auto"'
);

// We need to inject the toggle UI for EACH slider. 
// Inside group.keys.map(k => (
//   <div key={k} style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px' }}>
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
//       <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
//         {k.replace(/([A-Z])/g, ' ')}
//       </label>
//       <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
//         {localWeights[k] as number}
//       </span>
//     </div>
//     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>{DESCRIPTIONS[k] || ''}</p>
//     <input ... />

let newSliderContent = \
  const isDisabled = localWeights.disabledParams?.[k];
  return (
  <div key={k} style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', opacity: isDisabled ? 0.4 : 1, transition: 'opacity 0.2s' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          onClick={() => setLocalWeights(prev => ({ ...prev, disabledParams: { ...(prev.disabledParams || {}), [k]: !isDisabled } }))}
          style={{ width: '36px', height: '18px', background: !isDisabled ? 'var(--primary)' : 'rgba(46, 49, 49, 0.4)', borderRadius: '9px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
        >
          <div style={{ position: 'absolute', top: '2px', left: !isDisabled ? '20px' : '2px', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s' }} />
        </div>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
          {k.replace(/([A-Z])/g, ' ')}
        </label>
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
        {localWeights[k] as number}
      </span>
    </div>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', paddingLeft: '48px' }}>{DESCRIPTIONS[k] || ''}</p>
    <div style={{ paddingLeft: '48px', pointerEvents: isDisabled ? 'none' : 'auto' }}>
      <input type="range" min="-100" max="100" value={localWeights[k] as number} onChange={(e) => handleChange(k, parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
    </div>
  </div>
  );
\;

// Replace the inner group.keys.map return body with this new content.
const oldMapRegex = /<div key=\{k\}.*?<input type="range".*?<\/div>\s*<\/div>/s;
code = code.replace(/\{group\.keys\.map\(k => \(\s*<div key=\{k\}/s, '{group.keys.map(k => {\n' + newSliderContent + '})} //');
code = code.replace(oldMapRegex, '');
code = code.replace(/\}\) \/\/.*?<\/div>/s, ''); // cleanup

fs.writeFileSync('src/components/TaraNirnaySettings.tsx', code);
