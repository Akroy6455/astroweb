'use client';
import React, { useState } from 'react';
import { NDSWeights } from '@/lib/nds_engine';
import { CustomQuestion, CustomTransitRule, CustomDashaRule, SAHAMA_NAMES } from '@/lib/timing_engine';

interface Props {
  weights: NDSWeights;
  onSave: (weights: NDSWeights) => void;
  onClose: () => void;
  editQuestionId?: string;
}

const POSITION_TYPES = [
  'House in ascendant chart',
  'House in moon chart',
  'Nakshatra (SBC 28)',
  'Nakshatra (27)',
  'Rasi',
  'Sahama'
];

const RASI_OPTIONS = [
  '1 (Aries)', '2 (Taurus)', '3 (Gemini)', '4 (Cancer)', '5 (Leo)', '6 (Virgo)',
  '7 (Libra)', '8 (Scorpio)', '9 (Sagittarius)', '10 (Capricorn)', '11 (Aquarius)', '12 (Pisces)',
  'Exalted', 'Debilitated', 'Own', 'Moolatrikona', 'Benefic', 'Malefic', 'Friendly', 'Enemy'
];

const getRelationsForType = (type: string) => {
  if (type === 'Rasi') {
    return ['Occupying'];
  }
  if (type.includes('House')) {
    return ['Occupying', 'House aspect'];
  }
  return ['Occupying', 'Vedha', 'Latta'];
};

const DIVISIONS = [2, '2_US', 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60];
const divTargets = DIVISIONS.flatMap(d => [`D${d} Lagna Lord`, `D${d} Lagna Occupier`]);

const TARGETS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
  'Lord of 1st', 'Lord of 2nd', 'Lord of 3rd', 'Lord of 4th', 'Lord of 5th', 'Lord of 6th', 
  'Lord of 7th', 'Lord of 8th', 'Lord of 9th', 'Lord of 10th', 'Lord of 11th', 'Lord of 12th',
  'Lord of 1st from Moon', 'Lord of 2nd from Moon', 'Lord of 3rd from Moon', 'Lord of 4th from Moon', 'Lord of 5th from Moon', 'Lord of 6th from Moon',
  'Lord of 7th from Moon', 'Lord of 8th from Moon', 'Lord of 9th from Moon', 'Lord of 10th from Moon', 'Lord of 11th from Moon', 'Lord of 12th from Moon',
  'AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK',
  'MD Lord', 'AD Lord', 'PD Lord',
  'Benefic planets only', 'Malefic planets only',
  ...divTargets
];

export default function CustomQuestionBuilder({ weights, onSave, onClose, editQuestionId }: Props) {
  const existingQuestion = editQuestionId ? weights.customQuestions?.find(q => q.id === editQuestionId) : undefined;
  
  const [name, setName] = useState(existingQuestion?.name || '');
  const [transitRules, setTransitRules] = useState<CustomTransitRule[]>(existingQuestion?.transitRules || []);
  const [dashaRules, setDashaRules] = useState<CustomDashaRule[]>(existingQuestion?.dashaRules || []);

  const getMaxForType = (type: string) => {
    if (type === 'House in ascendant chart') return 12;
    if (type === 'Nakshatra (SBC 28)') return 28;
    if (type === 'Nakshatra (27)') return 27;
    return 28; // Default fallback
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Please enter a name for this question.');

    const newQuestion: CustomQuestion = {
      id: existingQuestion?.id || `custom_${Date.now()}`,
      name,
      transitRules,
      dashaRules
    };

    const existingQs = weights.customQuestions || [];
    let updatedQs;
    if (existingQuestion) {
      updatedQs = existingQs.map(q => q.id === newQuestion.id ? newQuestion : q);
    } else {
      updatedQs = [...existingQs, newQuestion];
    }

    onSave({
      ...weights,
      customQuestions: updatedQs
    });
    onClose();
  };

  const handleAddTransitRule = () => {
    setTransitRules([...transitRules, {
      id: `tr_${Date.now()}`,
      target: TARGETS[0],
      relation: 'Occupying',
      referenceType: POSITION_TYPES[0],
      referenceValue: 1,
      multiplier: 1.0
    }]);
  };

  const handleAddDashaRule = () => {
    setDashaRules([...dashaRules, {
      id: `dr_${Date.now()}`,
      level: 'MD',
      target: TARGETS[0],
      multiplier: 1.0
    }]);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px',
        width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid var(--border)'
      }}>
        <h2 style={{ marginTop: 0, color: 'var(--primary)' }}>
          {existingQuestion ? 'Edit Custom Question' : 'Create Custom Question'}
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Question Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. When will I get a Job?"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>1. Transit Rules</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {transitRules.map((rule, idx) => (
              <div key={rule.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                <span>IF <strong>Transit</strong></span>
                <select 
                  value={rule.target} 
                  onChange={e => {
                    const newRules = [...transitRules];
                    newRules[idx].target = e.target.value;
                    setTransitRules(newRules);
                  }}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                >
                  {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span>is</span>
                <select 
                  value={rule.relation} 
                  onChange={e => {
                    const newRules = [...transitRules];
                    newRules[idx].relation = e.target.value;
                    setTransitRules(newRules);
                  }}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                >
                  {getRelationsForType(rule.referenceType).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span>the</span>
                  {rule.referenceType === 'Rasi' ? (
                    <select
                      value={rule.referenceValue || RASI_OPTIONS[0]}
                      onChange={e => {
                        const newRules = [...transitRules];
                        newRules[idx].referenceValue = e.target.value;
                        setTransitRules(newRules);
                      }}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                    >
                      {RASI_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : rule.referenceType === 'Sahama' ? (
                    <select
                      value={rule.referenceValue || SAHAMA_NAMES[0]}
                      onChange={e => {
                        const newRules = [...transitRules];
                        newRules[idx].referenceValue = e.target.value;
                        setTransitRules(newRules);
                      }}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                    >
                      {SAHAMA_NAMES.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="number"
                      min="1" max={getMaxForType(rule.referenceType)}
                      value={rule.referenceValue || 1}
                      onChange={e => {
                        const newRules = [...transitRules];
                        let val = parseInt(e.target.value, 10) || 1;
                        const maxVal = getMaxForType(rule.referenceType);
                        if (val > maxVal) val = maxVal;
                        if (val < 1) val = 1;
                        newRules[idx].referenceValue = val;
                        setTransitRules(newRules);
                      }}
                      style={{ width: '60px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                    />
                  )}
                <select
                  value={rule.referenceType}
                  onChange={e => {
                    const newRules = [...transitRules];
                    newRules[idx].referenceType = e.target.value;
                    const newMax = getMaxForType(e.target.value);
                    if (e.target.value === 'Rasi') {
                      newRules[idx].referenceValue = RASI_OPTIONS[0];
                    } else if (e.target.value === 'Sahama') {
                      newRules[idx].referenceValue = SAHAMA_NAMES[0];
                    } else {
                      if (typeof newRules[idx].referenceValue === 'string') {
                        newRules[idx].referenceValue = 1;
                      } else if (newRules[idx].referenceValue > newMax) {
                        newRules[idx].referenceValue = newMax;
                      }
                    }
                    // Adjust relation if it's no longer valid for the new type
                    const validRelations = getRelationsForType(e.target.value);
                    if (!validRelations.includes(newRules[idx].relation)) {
                       newRules[idx].relation = validRelations[0];
                    }
                    setTransitRules(newRules);
                  }}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                >
                  {POSITION_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <span>THEN Multiplier =</span>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.0" 
                  max="10.0"
                  value={rule.multiplier}
                  onChange={e => {
                    const newRules = [...transitRules];
                    newRules[idx].multiplier = parseFloat(e.target.value) || 1.0;
                    setTransitRules(newRules);
                  }}
                  style={{ width: '70px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                />
                <button 
                  onClick={() => setTransitRules(transitRules.filter((_, i) => i !== idx))}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto', fontSize: '1.2rem' }}
                  title="Remove Rule"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={handleAddTransitRule}
            style={{ padding: '0.5rem 1rem', background: 'var(--border)', color: 'var(--foreground)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            + Add Transit Rule
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>2. Dasha Rules</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {dashaRules.map((rule, idx) => (
              <div key={rule.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                <span>IF</span>
                <select 
                  value={rule.level} 
                  onChange={e => {
                    const newRules = [...dashaRules];
                    newRules[idx].level = e.target.value;
                    setDashaRules(newRules);
                  }}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                >
                  <option value="MD">MD</option>
                  <option value="AD">AD</option>
                  <option value="PD">PD</option>
                  <option value="SD">SD</option>
                  <option value="PrD">PrD</option>
                  <option value="Both">MD or AD</option>
                </select>
                <span>is</span>
                <select 
                  value={rule.target} 
                  onChange={e => {
                    const newRules = [...dashaRules];
                    newRules[idx].target = e.target.value;
                    setDashaRules(newRules);
                  }}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                >
                  {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span>THEN Multiplier =</span>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.0" 
                  max="10.0"
                  value={rule.multiplier}
                  onChange={e => {
                    const newRules = [...dashaRules];
                    newRules[idx].multiplier = parseFloat(e.target.value) || 1.0;
                    setDashaRules(newRules);
                  }}
                  style={{ width: '70px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
                />
                <button 
                  onClick={() => setDashaRules(dashaRules.filter((_, i) => i !== idx))}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto', fontSize: '1.2rem' }}
                  title="Remove Rule"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={handleAddDashaRule}
            style={{ padding: '0.5rem 1rem', background: 'var(--border)', color: 'var(--foreground)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            + Add Dasha Rule
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button 
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '0.5rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Save Custom Question
          </button>
        </div>
      </div>
    </div>
  );
}
