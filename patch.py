import re

with open('src/components/TaraNirnaySettings.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove toggleKey from groups
code = re.sub(r"toggleKey: 'enable[^']+',\n\s*", "", code)
code = re.sub(r"toggleKey: keyof NDSWeights; ", "", code)

# 2. Add handleToggle function below handleChange
handle_toggle_func = """
  const handleToggle = (key: string) => {
    setLocalWeights(prev => ({
      ...prev,
      disabledParams: {
        ...(prev.disabledParams || {}),
        [key]: !prev.disabledParams?.[key]
      }
    }));
  };
"""
code = code.replace("const handleChange = (key: keyof NDSWeights, value: number) => {", handle_toggle_func + "\n  const handleChange = (key: keyof NDSWeights, value: number) => {")

# 3. Replace renderToggle completely, we don't need it. But wait, it's used for matrices. 
# We'll just define an inline toggle for matrices.
code = re.sub(r"const renderToggle = \(key: keyof NDSWeights, label: string\) => \{.*?\};\n\n  if \(!isOpen\)", "  if (!isOpen)", code, flags=re.DOTALL)

# 4. Replace {renderToggle('enableLordshipMatrix', 'Enable')} with inline toggle
inline_toggle_lord = """
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: !localWeights.disabledParams?.lordPlacementMatrix ? 'var(--primary)' : 'var(--text-muted)' }}>Enable</span>
            <div 
              onClick={() => handleToggle('lordPlacementMatrix')}
              style={{ width: '42px', height: '22px', background: !localWeights.disabledParams?.lordPlacementMatrix ? 'var(--primary)' : 'rgba(46, 49, 49, 0.2)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
            >
              <div style={{ position: 'absolute', top: '2px', left: !localWeights.disabledParams?.lordPlacementMatrix ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
"""
code = re.sub(r"\{renderToggle\('enableLordshipMatrix', 'Enable'\)\}", inline_toggle_lord, code)

inline_toggle_planet = """
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: !localWeights.disabledParams?.planetPlacementMatrix ? 'var(--primary)' : 'var(--text-muted)' }}>Enable</span>
            <div 
              onClick={() => handleToggle('planetPlacementMatrix')}
              style={{ width: '42px', height: '22px', background: !localWeights.disabledParams?.planetPlacementMatrix ? 'var(--primary)' : 'rgba(46, 49, 49, 0.2)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
            >
              <div style={{ position: 'absolute', top: '2px', left: !localWeights.disabledParams?.planetPlacementMatrix ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
"""
code = re.sub(r"\{renderToggle\('enablePlanetMatrix', 'Enable'\)\}", inline_toggle_planet, code)

# Fix matrix opacities
code = code.replace("localWeights.enableLordshipMatrix !== false", "!localWeights.disabledParams?.lordPlacementMatrix")
code = code.replace("localWeights.enablePlanetMatrix !== false", "!localWeights.disabledParams?.planetPlacementMatrix")

# 5. Fix group rendering to remove module toggles and add per-slider toggles
group_render_old = """
        {groups.map((group, idx) => {
          const isModuleEnabled = localWeights[group.toggleKey] !== false;
          return (
          <div key={idx} style={{ 
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: isModuleEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                {group.title}
              </h4>
              {renderToggle(group.toggleKey, isModuleEnabled ? 'On' : 'Off')}
            </div>
            <div style={{
              opacity: isModuleEnabled ? 1 : 0.4,
              pointerEvents: isModuleEnabled ? 'auto' : 'none',
              filter: isModuleEnabled ? 'none' : 'blur(0.5px)',
              transition: 'all 0.3s ease'
            }}>
            {group.keys.map(k => (
"""

group_render_new = """
        {groups.map((group, idx) => {
          return (
          <div key={idx} style={{ 
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>
                {group.title}
              </h4>
            </div>
            <div>
            {group.keys.map(k => {
              const isDisabled = localWeights.disabledParams?.[k as string];
              return (
"""

code = code.replace(group_render_old.strip(), group_render_new.strip())

slider_old = """
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{k}</span>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    value={localWeights[k] as number}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleChange(k, val);
                    }}
                    style={{
                      width: '60px',
                      padding: '2px 4px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      borderRadius: '4px',
                      textAlign: 'right'
                    }}
                  />
                </div>
                <input 
                  type="range" 
                  min="-100" 
                  max="100" 
                  value={localWeights[k] as number} 
                  onChange={(e) => handleChange(k, parseInt(e.target.value, 10))}
                  style={{ 
                    width: '100%', 
                    marginTop: '0.25rem',
                    accentColor: (localWeights[k] as number) > 0 ? '#10b981' : (localWeights[k] as number) < 0 ? '#ef4444' : '#94a3b8'
                  }}
                />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '0.15rem' }}>
                  {DESCRIPTIONS[k]}
                </div>
              </div>
"""

slider_new = """
              <div key={k} style={{ 
                display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.5rem',
                opacity: isDisabled ? 0.4 : 1, transition: 'opacity 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                      onClick={() => handleToggle(k as string)}
                      style={{ width: '32px', height: '16px', background: !isDisabled ? 'var(--primary)' : 'rgba(46, 49, 49, 0.4)', borderRadius: '8px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
                    >
                      <div style={{ position: 'absolute', top: '2px', left: !isDisabled ? '18px' : '2px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s' }} />
                    </div>
                    <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{k}</span>
                  </div>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    value={localWeights[k] as number}
                    disabled={isDisabled}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleChange(k, val);
                    }}
                    style={{
                      width: '60px',
                      padding: '2px 4px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      borderRadius: '4px',
                      textAlign: 'right',
                      opacity: isDisabled ? 0.6 : 1
                    }}
                  />
                </div>
                <div style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}>
                  <input 
                    type="range" 
                    min="-100" 
                    max="100" 
                    value={localWeights[k] as number} 
                    onChange={(e) => handleChange(k, parseInt(e.target.value, 10))}
                    style={{ 
                      width: '100%', 
                      marginTop: '0.25rem',
                      accentColor: (localWeights[k] as number) > 0 ? '#10b981' : (localWeights[k] as number) < 0 ? '#ef4444' : '#94a3b8'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '0.15rem', paddingLeft: '40px' }}>
                  {DESCRIPTIONS[k]}
                </div>
              </div>
"""

code = code.replace(slider_old.strip(), slider_new.strip())

# Fix closing brace for the map
code = code.replace("))}\n            </div>", ")})}\n            </div>")

with open('src/components/TaraNirnaySettings.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("done")
