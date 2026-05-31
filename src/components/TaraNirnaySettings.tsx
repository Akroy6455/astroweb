'use client';

import React, { useState, useEffect } from 'react';
import { NDSWeights, DEFAULT_NDS_WEIGHTS } from '@/lib/nds_engine';

interface Props {
  weights: NDSWeights;
  onSave: (weights: NDSWeights) => void;
}

const DESCRIPTIONS: Partial<Record<keyof NDSWeights, string>> = {
  lordHouse1: "Applied if the planet is the lord of the 1st house (Lagna).",
  lordHouse2: "Applied if the planet is the lord of the 2nd house (Maraka).",
  lordHouse3: "Applied if the planet is the lord of the 3rd house.",
  lordHouse4: "Applied if the planet is the lord of the 4th house (Kendra).",
  lordHouse5: "Applied if the planet is the lord of the 5th house (Trikona).",
  lordHouse6: "Applied if the planet is the lord of the 6th house (Dusthana).",
  lordHouse7: "Applied if the planet is the lord of the 7th house (Kendra/Maraka).",
  lordHouse8: "Applied if the planet is the lord of the 8th house (Dusthana).",
  lordHouse9: "Applied if the planet is the lord of the 9th house (Trikona).",
  lordHouse10: "Applied if the planet is the lord of the 10th house (Kendra).",
  lordHouse11: "Applied if the planet is the lord of the 11th house.",
  lordHouse12: "Applied if the planet is the lord of the 12th house (Dusthana).",
  lordPlacementMatrix: "A 12x12 matrix defining the base score when the Lord of House X is placed in House Y.",
  planetPlacementMatrix: "Score for a specific planet in a specific house (1-12)",
  sayanadiAwasthaMatrix: "Score for a specific planet in a specific Sayanadi Awastha",
  yogaKaraka: "Applied strictly using Parashara Rishi's Yogakaraka list for each Ascendant (e.g. Saturn for Taurus/Libra, Mars for Cancer/Leo, Venus for Capricorn/Aquarius).",
  functionalBenefic: "Applied if the planet is a Functional Benefic for the Lagna.",
  functionalMalefic: "Applied if the planet is a Functional Malefic for the Lagna.",
  rahuKetuYogKaraka: "Applied to Rahu/Ketu if placed in Kendra and aspected/conjoined by Trikon lord, or in Trikon and aspected/conjoined by Kendra lord.",
  
  exaltation: "Percentage modifier applied if the planet is Exalted or in Moolatrikona.",
  ownSign: "Percentage modifier applied if the planet is in its Own Sign.",
  friendlySign: "Percentage modifier applied if the planet is in a Friendly Sign.",
  neutralSign: "Percentage modifier applied if the planet is in a Neutral Sign.",
  enemySign: "Percentage modifier applied if the planet is in an Enemy Sign.",
  debilitation: "Percentage modifier applied if the planet is Debilitated.",
  vargottama: "Added to the dignity percentage if the planet is in the same sign in D1 (Rasi) and D9 (Navamsha).",
  combustion: "Percentage modifier applied if the planet is Combust (too close to the Sun). Overrides base dignity.",
  sushupti: "Percentage modifier applied if the planet is in Sushupti Avastha (deep sleep). Overrides base dignity.",
  neechaBhanga: "Replaces debilitation percentage if Neecha Bhanga Raja Yoga conditions are met (cancellation of debilitation).",

  mutualDistance1: "Applied to Antardasha if the AD lord is conjunct the MD lord (1st house from MD).",
  mutualDistance2: "Applied to Antardasha if the AD lord is in the 2nd house from MD lord.",
  mutualDistance3: "Applied to Antardasha if the AD lord is in the 3rd house from MD lord.",
  mutualDistance4: "Applied to Antardasha if the AD lord is in the 4th house from MD lord.",
  mutualDistance5: "Applied to Antardasha if the AD lord is in the 5th house from MD lord.",
  mutualDistance6: "Applied to Antardasha if the AD lord is in the 6th house from MD lord (Shadashtaka).",
  mutualDistance7: "Applied to Antardasha if the AD lord is in the 7th house from MD lord.",
  mutualDistance8: "Applied to Antardasha if the AD lord is in the 8th house from MD lord (Shadashtaka).",
  mutualDistance9: "Applied to Antardasha if the AD lord is in the 9th house from MD lord.",
  mutualDistance10: "Applied to Antardasha if the AD lord is in the 10th house from MD lord.",
  mutualDistance11: "Applied to Antardasha if the AD lord is in the 11th house from MD lord.",
  mutualDistance12: "Applied to Antardasha if the AD lord is in the 12th house from MD lord.",

  arudha11thAny: "Applied if the planet is placed in the 11th house from Arudha Lagna (AL).",
  arudha11thBenefic: "Additional bonus applied if a natural Benefic is placed in the 11th house from AL.",
  arudha12thAny: "Applied if the planet is placed in the 12th house from Arudha Lagna (AL).",
  arudha12thMalefic: "Additional penalty applied if a natural Malefic is placed in the 12th house from AL.",
  arudha3rdMalefic: "Applied if a natural Malefic is placed in the 3rd house from AL.",
  arudha6thMalefic: "Applied if a natural Malefic is placed in the 6th house from AL.",
  papaKartari: "Applied if the planet's sign is hemmed between Malefics on both sides (Papa Kartari Yoga).",
  shubhaKartari: "Applied if the planet's sign is hemmed between Benefics on both sides (Shubha Kartari Yoga).",

  combustionBadLord: "Applied to combusted planets if Sun rules houses 2, 3, 6, 7, 8, or 12.",
  combustionGoodLord: "Applied to combusted planets if Sun rules houses 1, 4, 5, 9, 10, or 11.",
  lajita: "Applied if the planet is in Lajjitadi Avastha: Lajjita (Humiliated - e.g. placed in 5th with Rahu/Ketu/Sun/Saturn/Mars).",
  garvita: "Applied if the planet is in Lajjitadi Avastha: Garvita (Proud - placed in Exaltation or Moolatrikona).",
  kshudita: "Applied if the planet is in Lajjitadi Avastha: Kshudhita (Starved - in enemy sign, aspected by enemy, or conjunct Saturn).",
  trushita: "Applied if the planet is in Lajjitadi Avastha: Trushita (Thirsty - in water sign, aspected by malefic, no benefic aspect).",
  mudita: "Applied if the planet is in Lajjitadi Avastha: Mudita (Delighted - in friendly sign, conjunct/aspected by friendly benefic).",
  kshobita: "Applied if the planet is in Lajjitadi Avastha: Kshobhita (Agitated - conjunct Sun, aspected by malefic).",

  praveshHouse1: "Applied if the planet is placed in the 1st house from the Natal Moon in the Dasha Pravesh (transit) chart.",
  praveshHouse2: "Applied if the planet is placed in the 2nd house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse3: "Applied if the planet is placed in the 3rd house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse4: "Applied if the planet is placed in the 4th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse5: "Applied if the planet is placed in the 5th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse6: "Applied if the planet is placed in the 6th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse7: "Applied if the planet is placed in the 7th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse8: "Applied if the planet is placed in the 8th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse9: "Applied if the planet is placed in the 9th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse10: "Applied if the planet is placed in the 10th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse11: "Applied if the planet is placed in the 11th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshHouse12: "Applied if the planet is placed in the 12th house from the Natal Moon in the Dasha Pravesh chart.",
  praveshExalted: "Applied if the planet is Exalted in the Dasha Pravesh chart.",
  praveshOwnSign: "Applied if the planet is in its Own Sign in the Dasha Pravesh chart.",
  praveshDebilitated: "Applied if the planet is Debilitated in the Dasha Pravesh chart.",
  navamshaStrong: "Applied if the planet is Exalted, in Own Sign, same sign as AL, or placed 5th/9th from its Rasi sign in the Navamsha.",
  navamshaWeak: "Applied if the planet is Debilitated, or placed 6th/8th/12th from its Rasi sign in the Navamsha.",
  navamshaBenefic: "Bonus applied if the Navamsha sign lord is a natural Benefic.",
  navamshaMalefic: "Penalty applied if the Navamsha sign lord is a natural Malefic.",
};

export default function TaraNirnaySettings({ weights, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [localWeights, setLocalWeights] = useState<NDSWeights>(weights);

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  
  const handleToggle = (key: string) => {
    setLocalWeights(prev => ({
      ...prev,
      disabledParams: {
        ...(prev.disabledParams || {}),
        [key]: !prev.disabledParams?.[key]
      }
    }));
  };

  const handleChange = (key: keyof NDSWeights, value: number) => {
    setLocalWeights(prev => ({ ...prev, [key]: value }));
  };

  const handleMatrixChange = (lordIndex: number, placedIndex: number, value: number) => {
    setLocalWeights(prev => {
      const newMatrix = prev.lordPlacementMatrix.map(row => [...row]);
      newMatrix[lordIndex][placedIndex] = value;
      return { ...prev, lordPlacementMatrix: newMatrix };
    });
  };

  const handlePlanetMatrixChange = (planetIndex: number, placedIndex: number, value: number) => {
    setLocalWeights(prev => {
      const newMatrix = (prev.planetPlacementMatrix || DEFAULT_NDS_WEIGHTS.planetPlacementMatrix).map(row => [...row]);
      newMatrix[planetIndex][placedIndex] = value;
      return { ...prev, planetPlacementMatrix: newMatrix };
    });
  };

  const handleSayanadiMatrixChange = (awasthaIndex: number, planetIndex: number, value: number) => {
    setLocalWeights(prev => {
      const newMatrix = (prev.sayanadiAwasthaMatrix || DEFAULT_NDS_WEIGHTS.sayanadiAwasthaMatrix || []).map(row => [...row]);
      if (newMatrix.length > awasthaIndex) {
        newMatrix[awasthaIndex][planetIndex] = value;
      }
      return { ...prev, sayanadiAwasthaMatrix: newMatrix };
    });
  };

  const groups: Array<{ title: string; keys: Array<keyof NDSWeights> }> = [
    {
      title: 'Module 1: Lordship Multipliers (-100 to +100)',
      keys: [
        'lordHouse1', 'lordHouse2', 'lordHouse3', 'lordHouse4', 'lordHouse5', 'lordHouse6', 
        'lordHouse7', 'lordHouse8', 'lordHouse9', 'lordHouse10', 'lordHouse11', 'lordHouse12', 
        'yogaKaraka', 'functionalBenefic', 'functionalMalefic', 'rahuKetuYogKaraka'
      ] as Array<keyof NDSWeights>
    },
    {
      title: 'Module 2: Dignity (-100% to +100%)',
      keys: [
        'exaltation', 'ownSign', 'friendlySign', 'neutralSign', 'enemySign', 'debilitation', 
        'vargottama', 'combustionBadLord', 'combustionGoodLord', 'sushupti', 'neechaBhanga'
      ]
    },
    {
      title: 'Module 3: Mutual Placement Distance (-100 to +100)',
      keys: [
        'mutualDistance1', 'mutualDistance2', 'mutualDistance3', 'mutualDistance4', 
        'mutualDistance5', 'mutualDistance6', 'mutualDistance7', 'mutualDistance8', 
        'mutualDistance9', 'mutualDistance10', 'mutualDistance11', 'mutualDistance12'
      ]
    },
    {
      title: 'Module 4: Arudha Overlay (-100 to +100)',
      keys: [
        'arudha11thAny', 'arudha11thBenefic', 'arudha12thAny', 'arudha12thMalefic', 
        'arudha3rdMalefic', 'arudha6thMalefic', 'papaKartari', 'shubhaKartari'
      ]
    },
    {
      title: 'Module 5: Awasthas (-100 to +100)',
      keys: [
        'lajita', 'garvita', 'kshudita', 'trushita', 'mudita', 'kshobita'
      ]
    },
    {
      title: 'Module 6: Dasha Pravesh (-100 to +100)',
      keys: [
        'praveshHouse1', 'praveshHouse2', 'praveshHouse3', 'praveshHouse4', 'praveshHouse5', 'praveshHouse6', 
        'praveshHouse7', 'praveshHouse8', 'praveshHouse9', 'praveshHouse10', 'praveshHouse11', 'praveshHouse12',
        'praveshExalted', 'praveshOwnSign', 'praveshDebilitated'
      ]
    },
    {
      title: 'Module 7: Navamsha Modifiers (-100 to +100)',
      keys: [
        'navamshaStrong', 'navamshaWeak', 'navamshaBenefic', 'navamshaMalefic'
      ]
    }
  ];

    if (!isOpen) {
    return (
      <div style={{ 
        marginTop: '1.5rem', 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '8px', 
            background: 'var(--card-bg)', color: 'var(--foreground)', 
            border: '1px solid var(--border)', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <span> Tune Engine Variables</span>
        </button>

      </div>
    );
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--foreground)' }}>Engine Tuning Variables</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => {
              setLocalWeights(DEFAULT_NDS_WEIGHTS);
            }}
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '6px', 
              background: 'transparent', color: 'var(--text-muted)', 
              border: '1px solid var(--border)', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 500
            }}
          >
            Reset
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '6px', 
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave(localWeights);
              setIsOpen(false);
            }}
            style={{ 
              padding: '0.4rem 1.2rem', borderRadius: '6px', 
              background: 'var(--primary)', color: '#fff', 
              border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Save & Apply
          </button>
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '2.5rem', padding: '1.25rem', background: 'rgba(201, 168, 106, 0.05)', borderRadius: '12px', border: '1px solid rgba(201, 168, 106, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>MD / AD Weight Ratio</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Adjust the percentage weight of Maha Dasha vs Antar Dasha in the final score.</p>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              {localWeights.mdWeightPercentage ?? 50}% / {100 - (localWeights.mdWeightPercentage ?? 50)}%
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>MD</span>
            <input 
              type="range" 
              min="0" max="100" 
              value={localWeights.mdWeightPercentage ?? 50} 
              onChange={(e) => setLocalWeights(prev => ({ ...prev, mdWeightPercentage: parseInt(e.target.value, 10) }))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', width: '30px' }}>AD</span>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(201, 168, 106, 0.2)', paddingTop: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--primary)' }}>Transit Flow Multipliers (Monthly)</h4>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Disable Transit Sampling</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Locked: System samples every 30 days for 120 years)</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'not-allowed' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }} />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable Ashtakavarga Transit Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multiply Dasha score by average 7-planet BAV in transiting rashi.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableTransitMultiplier ?? false} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableTransitMultiplier: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Include Base NDS in Transit Chart</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>When disabled, plots raw transit multiplier percentages independently.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableBaseNdsInTransit ?? true} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableBaseNdsInTransit: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable MD/AD Lord Transit Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Further multiply by current MD & AD lord BAV in transiting rashi.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableMdAdTransitMultiplier ?? false} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableMdAdTransitMultiplier: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable Navtara Transit Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multiply Dasha score by average 9-planet Navtara in transiting nakshatra.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableNavtaraTransit ?? false} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableNavtaraTransit: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable MD/AD Lord Navtara Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Further multiply by current MD & AD lord Navtara.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableNavtaraMdAd ?? false} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableNavtaraMdAd: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div style={{ 
          marginBottom: '2rem',
          opacity: (!localWeights.disabledParams?.lordPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 1 : 0.45, 
          pointerEvents: (!localWeights.disabledParams?.lordPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'auto' : 'none', 
          filter: (!localWeights.disabledParams?.lordPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'none' : 'blur(0.5px)',
          transition: 'all 0.3s ease' 
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
            Lordship Placement Matrix (Lord of X in House Y)
          </h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: !localWeights.disabledParams?.lordPlacementMatrix ? 'var(--primary)' : 'var(--text-muted)' }}>Enable</span>
            <div 
              onClick={() => handleToggle('lordPlacementMatrix')}
              style={{ width: '42px', height: '22px', background: !localWeights.disabledParams?.lordPlacementMatrix ? 'var(--primary)' : 'rgba(46, 49, 49, 0.2)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
            >
              <div style={{ position: 'absolute', top: '2px', left: !localWeights.disabledParams?.lordPlacementMatrix ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

        </div>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px', textAlign: 'left', color: 'var(--text-muted)' }}>Lord \ In House</th>
                {Array.from({length: 12}).map((_, i) => (
                  <th key={i} style={{ padding: '4px', textAlign: 'center', color: 'var(--foreground)' }}>H{i+1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localWeights.lordPlacementMatrix?.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td style={{ padding: '4px', fontWeight: 600, color: 'var(--foreground)' }}>{rIdx + 1}L</td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} style={{ padding: '2px' }}>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v)) handleMatrixChange(rIdx, cIdx, v);
                        }}
                        style={{
                          width: '100%',
                          minWidth: '40px',
                          padding: '4px 2px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          color: val > 0 ? '#10b981' : val < 0 ? '#ef4444' : 'var(--foreground)',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontWeight: val !== 0 ? 600 : 400
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {DESCRIPTIONS.lordPlacementMatrix}
        </div>
      </div>

      <div style={{ 
        marginBottom: '2rem',
        opacity: (!localWeights.disabledParams?.planetPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 1 : 0.45, 
        pointerEvents: (!localWeights.disabledParams?.planetPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'auto' : 'none', 
        filter: (!localWeights.disabledParams?.planetPlacementMatrix && !localWeights.disabledParams?.disableModule1) ? 'none' : 'blur(0.5px)',
        transition: 'all 0.3s ease' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
            Planet Placement Matrix (Planet in House)
          </h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: !localWeights.disabledParams?.planetPlacementMatrix ? 'var(--primary)' : 'var(--text-muted)' }}>Enable</span>
            <div 
              onClick={() => handleToggle('planetPlacementMatrix')}
              style={{ width: '42px', height: '22px', background: !localWeights.disabledParams?.planetPlacementMatrix ? 'var(--primary)' : 'rgba(46, 49, 49, 0.2)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
            >
              <div style={{ position: 'absolute', top: '2px', left: !localWeights.disabledParams?.planetPlacementMatrix ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

        </div>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px', textAlign: 'left', color: 'var(--text-muted)' }}>Planet \ In House</th>
                {Array.from({length: 12}).map((_, i) => (
                  <th key={i} style={{ padding: '4px', textAlign: 'center', color: 'var(--foreground)' }}>H{i+1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(localWeights.planetPlacementMatrix || DEFAULT_NDS_WEIGHTS.planetPlacementMatrix)?.map((row, rIdx) => {
                const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
                return (
                  <tr key={rIdx}>
                    <td style={{ padding: '4px', fontWeight: 600, color: 'var(--foreground)' }}>{planets[rIdx]}</td>
                    {row.map((val, cIdx) => (
                      <td key={cIdx} style={{ padding: '2px' }}>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) handlePlanetMatrixChange(rIdx, cIdx, v);
                          }}
                          style={{
                            width: '100%',
                            minWidth: '40px',
                            padding: '4px 2px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            color: val > 0 ? '#10b981' : val < 0 ? '#ef4444' : 'var(--foreground)',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontWeight: val !== 0 ? 600 : 400
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {DESCRIPTIONS.planetPlacementMatrix}
        </div>
      </div>

        <div style={{ 
          marginBottom: '2rem',
          opacity: (!localWeights.disabledParams?.sayanadiAwasthaMatrix && !localWeights.disabledParams?.disableModule5) ? 1 : 0.45, 
          pointerEvents: (!localWeights.disabledParams?.sayanadiAwasthaMatrix && !localWeights.disabledParams?.disableModule5) ? 'auto' : 'none', 
          filter: (!localWeights.disabledParams?.sayanadiAwasthaMatrix && !localWeights.disabledParams?.disableModule5) ? 'none' : 'blur(0.5px)',
          transition: 'all 0.3s ease' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
              Sayanadi Awastha Matrix (Planet in Awastha)
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: !localWeights.disabledParams?.sayanadiAwasthaMatrix ? 'var(--primary)' : 'var(--text-muted)' }}>Enable</span>
              <div 
                onClick={() => handleToggle('sayanadiAwasthaMatrix')}
                style={{ width: '42px', height: '22px', background: !localWeights.disabledParams?.sayanadiAwasthaMatrix ? 'var(--primary)' : 'rgba(46, 49, 49, 0.2)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
              >
                <div style={{ position: 'absolute', top: '2px', left: !localWeights.disabledParams?.sayanadiAwasthaMatrix ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px', textAlign: 'left', color: 'var(--text-muted)' }}>Awastha \ Planet</th>
                  {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map((p, i) => (
                    <th key={i} style={{ padding: '4px', textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(localWeights.sayanadiAwasthaMatrix || DEFAULT_NDS_WEIGHTS.sayanadiAwasthaMatrix)?.map((row, rIdx) => {
                  const awasthas = ['Sayana', 'Upavesana', 'Netrapani', 'Prakasana', 'Gamana', 'Agamana', 'Sabha', 'Agama', 'Bhojana', 'Nritya Lipsa', 'Kautuka', 'Nidra'];
                  return (
                    <tr key={rIdx}>
                      <td style={{ padding: '4px', fontWeight: 600, color: 'var(--foreground)' }}>{awasthas[rIdx]}</td>
                      {row.map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '2px' }}>
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v)) handleSayanadiMatrixChange(rIdx, cIdx, v);
                            }}
                            style={{
                              width: '100%',
                              minWidth: '40px',
                              padding: '4px 2px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              color: val > 0 ? '#10b981' : val < 0 ? '#ef4444' : 'var(--foreground)',
                              borderRadius: '4px',
                              textAlign: 'center',
                              outline: 'none',
                              fontFamily: 'monospace'
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {DESCRIPTIONS.sayanadiAwasthaMatrix}
            <br/><br/>
            <strong>Disclaimer:</strong> This awastha is subject to various other factors like planetary strength, your name, planetary position, etc as said by Rishi Parasara which were very tough to be coded but who knows the future!
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable Sun Combustion Tradeoff</span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sun absorbs the exact points that are added or reduced from combusted planets.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={localWeights.enableCombustionTradeoff ?? false} 
                onChange={(e) => setLocalWeights(prev => ({ ...prev, enableCombustionTradeoff: e.target.checked }))}
                style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
              />
            </label>
          </div>
        </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
        })}
        </div>
      </div>
    </div>
  );
}