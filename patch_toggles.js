const fs = require('fs');
const path = require('path');

const uiPath = path.join(__dirname, 'src', 'components', 'TaraNirnaySettings.tsx');
let uiContent = fs.readFileSync(uiPath, 'utf8');

// Replace groups.map
const groupsMapRegex = /\{groups\.map\(\(group, idx\) => \{[\s\S]*?return \([\s\S]*?<div key=\{idx\}([\s\S]*?)<h4([\s\S]*?)\{group\.title\}[\s\S]*?<\/h4>([\s\S]*?)<div>\s*\{group\.keys\.map\(k => \{([\s\S]*?)\n\s*\}\)\}\s*<\/div>\n\s*<\/div>\n\s*\);\n\s*\}\)\}/g;

const newGroupsMap = `{groups.map((group, idx) => {
          const moduleDisableKey = \`disableModule\${idx + 1}\`;
          const isModuleDisabled = localWeights.disabledParams?.[moduleDisableKey];
          return (
          <div key={idx} style={{ 
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>
                {group.title}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: !isModuleDisabled ? 'var(--primary)' : 'var(--text-muted)' }}>Enable Module</span>
                <div 
                  onClick={() => handleToggle(moduleDisableKey)}
                  style={{ width: '42px', height: '22px', background: !isModuleDisabled ? 'var(--primary)' : 'rgba(46, 49, 49, 0.2)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
                >
                  <div style={{ position: 'absolute', top: '2px', left: !isModuleDisabled ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
            <div style={{ 
              opacity: !isModuleDisabled ? 1 : 0.45, 
              pointerEvents: !isModuleDisabled ? 'auto' : 'none', 
              filter: !isModuleDisabled ? 'none' : 'blur(0.5px)',
              transition: 'all 0.3s ease'
            }}>
            {group.keys.map(k => {
              const isDisabled = localWeights.disabledParams?.[k as string];
              return (
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
            )})}
            </div>
          </div>
          );
        })}`;

uiContent = uiContent.replace(groupsMapRegex, newGroupsMap);

// Replace matrices opacity
uiContent = uiContent.replace(/opacity: !localWeights\.disabledParams\?\.lordPlacementMatrix \? 1 : 0\.45,/g, "opacity: (!localWeights.disabledParams?.lordPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 1 : 0.45,");
uiContent = uiContent.replace(/pointerEvents: !localWeights\.disabledParams\?\.lordPlacementMatrix \? 'auto' : 'none',/g, "pointerEvents: (!localWeights.disabledParams?.lordPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'auto' : 'none',");
uiContent = uiContent.replace(/filter: !localWeights\.disabledParams\?\.lordPlacementMatrix \? 'none' : 'blur\(0\.5px\)',/g, "filter: (!localWeights.disabledParams?.lordPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'none' : 'blur(0.5px)',");

uiContent = uiContent.replace(/opacity: !localWeights\.disabledParams\?\.planetPlacementMatrix \? 1 : 0\.45,/g, "opacity: (!localWeights.disabledParams?.planetPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 1 : 0.45,");
uiContent = uiContent.replace(/pointerEvents: !localWeights\.disabledParams\?\.planetPlacementMatrix \? 'auto' : 'none',/g, "pointerEvents: (!localWeights.disabledParams?.planetPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'auto' : 'none',");
uiContent = uiContent.replace(/filter: !localWeights\.disabledParams\?\.planetPlacementMatrix \? 'none' : 'blur\(0\.5px\)',/g, "filter: (!localWeights.disabledParams?.planetPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'none' : 'blur(0.5px)',");

uiContent = uiContent.replace(/opacity: !localWeights\.disabledParams\?\.sayanadiAwasthaMatrix \? 1 : 0\.45,/g, "opacity: (!localWeights.disabledParams?.sayanadiAwasthaMatrix && !localWeights.disabledParams?.disableModule5) ? 1 : 0.45,");
uiContent = uiContent.replace(/pointerEvents: !localWeights\.disabledParams\?\.sayanadiAwasthaMatrix \? 'auto' : 'none',/g, "pointerEvents: (!localWeights.disabledParams?.sayanadiAwasthaMatrix && !localWeights.disabledParams?.disableModule5) ? 'auto' : 'none',");
uiContent = uiContent.replace(/filter: !localWeights\.disabledParams\?\.sayanadiAwasthaMatrix \? 'none' : 'blur\(0\.5px\)',/g, "filter: (!localWeights.disabledParams?.sayanadiAwasthaMatrix && !localWeights.disabledParams?.disableModule5) ? 'none' : 'blur(0.5px)',");

fs.writeFileSync(uiPath, uiContent, 'utf8');
console.log('Updated TaraNirnaySettings.tsx');

// Now update nds_engine.ts
const enginePath = path.join(__dirname, 'src', 'lib', 'nds_engine.ts');
let engineContent = fs.readFileSync(enginePath, 'utf8');

engineContent = engineContent.replace(
  /export function getBaseLordshipScore\([\s\S]*?\{/,
  "export function getBaseLordshipScore(planet: Planet, yogaState: YogaState, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule1) return { score: 0, conditions: [] };"
);

engineContent = engineContent.replace(
  /export function getDignityScore\([\s\S]*?\{/,
  "export function getDignityScore(planet: Planet, yogaState: YogaState, _positions: any[], w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule2) return { score: 0, conditions: [] };"
);

engineContent = engineContent.replace(
  /export function getMutualPlacement\([\s\S]*?\{/,
  "export function getMutualPlacement(mdLord: Planet, adLord: Planet, yogaState: YogaState, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule3) return { score: 0, conditions: [] };"
);

engineContent = engineContent.replace(
  /export function getArudhaModifiers\([\s\S]*?\{/,
  "export function getArudhaModifiers(planet: Planet, yogaState: YogaState, alSignIndex: number, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule4) return { score: 0, conditions: [] };"
);

engineContent = engineContent.replace(
  /export function getAwasthaModifiers\([\s\S]*?\{/,
  "export function getAwasthaModifiers(planet: Planet, awasthasData: any, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule5) return { score: 0, conditions: [] };"
);

engineContent = engineContent.replace(
  /export function getPraveshOffset\([\s\S]*?\{/,
  "export function getPraveshOffset(planet: Planet, praveshData: any, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule6) return { score: 0, conditions: [] };"
);

engineContent = engineContent.replace(
  /export function getNavamshaModifiers\([\s\S]*?\{/,
  "export function getNavamshaModifiers(planet: Planet, yogaState: YogaState, alSignIndex: number, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {\n  if (w.disabledParams?.disableModule7) return { score: 0, conditions: [] };"
);

fs.writeFileSync(enginePath, engineContent, 'utf8');
console.log('Updated nds_engine.ts');
