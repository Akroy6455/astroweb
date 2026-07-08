'use client';

import React, { useState } from 'react';
import { NDSWeights } from '@/lib/nds_engine';
import { Settings } from 'lucide-react';

interface Props {
  weights: NDSWeights;
  onSave: (weights: NDSWeights) => void;
  question: 'job' | 'wealth' | 'marriage' | 'abroad' | 'health' | string;
}

const DESCRIPTIONS: Record<string, Record<string, string>> = {
  job: {
    lord6_10_multiplier: "Added multiplier bonus for periods (Dasha, Antardasha, Pratyantar Dasha) belonging to the 6th or 10th lord.",
    lord2_7_11_multiplier: "Added multiplier bonus for periods belonging to the 2nd, 7th, or 11th lord.",
    karmaNakshatra_multiplier: "Added multiplier bonus when any transiting planet is in the Karma Nakshatra (10th from Moon in SBC).",
    latta_multiplier: "Multiplier penalty (reduces bonus) when a planet applies Latta (kick) to the Karma Nakshatra in transit.",
    vedha_benefic_multiplier: "Added 1.2x multiplier bonus for any natural benefic giving Vedha (obstruction/activation) to the Karma Nakshatra.",
    vedha_malefic_multiplier: "Multiplier penalty (0.8x) for any natural malefic giving Vedha to the Karma Nakshatra.",
    exalted_own_multiplier: "Added multiplier bonus when the 6th or 10th lord is exalted or transiting through its own sign.",
    sahama_multiplier: "Added multiplier bonus when Jupiter, Saturn, Rahu, or Ketu transit the Karma Sahama sign.",
    amk_karma_multiplier: "Added multiplier bonus (1.5x) when the Amatyakaraka (AmK) transits the Karma Nakshatra."
  },
  wealth: {
    lord2_11_multiplier: "Added 1.5x multiplier bonus for periods (Dasha, Antardasha, Pratyantar Dasha) belonging to the 2nd or 11th lord — houses of accumulated wealth and gains.",
    lord9_4_5_multiplier: "Added 1.2x multiplier bonus for periods belonging to the 9th (fortune/luck), 4th (assets/property), or 5th (poorvapunya/speculation) lord.",
    nakshatra_2_19_multiplier: "Added 1.5x multiplier bonus when any transiting planet is in the Sampat (2nd) or Aadhana (19th) Nakshatra from Moon (as per SBC).",
    latta_aadhana_multiplier: "Multiplier penalty (0.5x reduces bonus) when a planet applies Latta (kick) to the Aadhana Nakshatra in transit.",
    vedha_aadhana_benefic_multiplier: "Added 1.2x multiplier bonus for any natural benefic giving Vedha to the Aadhana Nakshatra.",
    vedha_aadhana_malefic_multiplier: "Multiplier penalty (0.8x) for any natural malefic giving Vedha to the Aadhana Nakshatra.",
    exalted_own_2_11_multiplier: "Added 1.2x multiplier bonus when the 2nd or 11th lord is exalted or transiting through its own rasi.",
    sahama_artha_labha_multiplier: "Added 1.2x multiplier bonus when Jupiter, Saturn, Rahu, or Ketu transit the Artha (Wealth) or Labha (Profit) Sahama sign."
  },
  goodTime: {
    transit_karma_multiplier: "Added 1.2x multiplier bonus when any planet transits Karma Nakshatra (10th from Moon).",
    transit_aadhana_multiplier: "Added 1.2x multiplier bonus when any planet transits Aadhana Nakshatra (19th from Moon).",
    transit_abhisheka_multiplier: "Added 1.5x multiplier bonus when any planet transits Abhisheka Nakshatra (27th from Moon).",
    latta_karma_multiplier: "Multiplier penalty (0.8x) when any planet applies Latta to Karma Nakshatra.",
    latta_aadhana_multiplier: "Multiplier penalty (0.8x) when any planet applies Latta to Aadhana Nakshatra.",
    latta_abhisheka_multiplier: "Multiplier penalty (0.6x) when any planet applies Latta to Abhisheka Nakshatra.",
    transit_naidhana_multiplier: "Multiplier penalty (0.8x) when any planet transits Naidhana Nakshatra (7th from Moon).",
    transit_vainasika_multiplier: "Multiplier penalty (0.6x) when any planet transits Vainasika Nakshatra (22nd from Moon).",
    latta_naidhana_multiplier: "Added 1.2x multiplier bonus when any planet applies Latta to Naidhana Nakshatra.",
    latta_vainasika_multiplier: "Added 1.5x multiplier bonus when any planet applies Latta to Vainasika Nakshatra.",
    vedha_benefic_multiplier: "Added 1.2x multiplier bonus when any natural benefic gives Vedha to any of the tracked Nakshatras.",
    vedha_malefic_multiplier: "Multiplier penalty (0.8x) when any natural malefic gives Vedha to any of the tracked Nakshatras."
  }
};

export default function TimingSettings({ weights, onSave, question }: Props) {
  const [localWeights, setLocalWeights] = useState<NDSWeights>(weights);
  const [isOpen, setIsOpen] = useState(true);

  const supportedQuestions = ['job', 'wealth', 'goodTime'];
  if (!localWeights.timingOptions || !supportedQuestions.includes(question)) {
    return null;
  }

  const questionConfig = question === 'wealth' 
    ? localWeights.timingOptions.wealth 
    : question === 'goodTime' 
      ? localWeights.timingOptions.goodTime
      : localWeights.timingOptions.job;

  if (!questionConfig) return null;

  const handleUpdateTuner = (key: string, value: string) => {
    setLocalWeights(prev => ({
      ...prev,
      timingOptions: {
        ...prev.timingOptions,
        [question]: {
          ...(question === 'wealth' ? prev.timingOptions!.wealth : question === 'goodTime' ? prev.timingOptions!.goodTime : prev.timingOptions!.job),
          [key]: parseFloat(value) || 0
        }
      }
    } as NDSWeights));
  };

  const handleSave = () => {
    onSave(localWeights);
  };

  const descriptions = DESCRIPTIONS[question] || {};

  return (
    <div style={{ marginTop: '2rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--card-bg)', overflow: 'hidden' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem', background: 'var(--bg)', border: 'none', borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={20} className="text-primary" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Timing Tuners: {question.charAt(0).toUpperCase() + question.slice(1)}</h3>
        </div>
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {Object.entries(questionConfig).filter(([k]) => k !== 'enabled').map(([key, value]) => {
              const desc = descriptions[key];
              
              return (
                <div key={key} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={value as number}
                      onChange={(e) => handleUpdateTuner(key, e.target.value)}
                      style={{ 
                        width: '70px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border)',
                        background: 'var(--card-bg)', color: 'var(--foreground)', textAlign: 'right'
                      }}
                    />
                  </div>
                  {desc && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button 
              onClick={handleSave}
              style={{
                padding: '0.75rem 2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px',
                fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Save & Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
