import React from 'react';

interface PanchangTabProps {
  data: any;
}

export default function PanchangTab({ data }: PanchangTabProps) {
  if (!data || !data.panchang) return null;

  const { vaar, tithi, nakshatra, yoga, karana } = data.panchang;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Vaar */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Vaar (Day of Week)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {vaar.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Ruler: <strong>{vaar.ruler}</strong>
          </div>
        </div>

        {/* Tithi */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tithi (Lunar Day)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {tithi.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{tithi.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {tithi.index + 1}/30
          </div>
        </div>

        {/* Nakshatra */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Nakshatra (Lunar Mansion)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {nakshatra.name} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Pada {nakshatra.pada})</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{nakshatra.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {nakshatra.index + 1}/27
          </div>
        </div>

        {/* Yoga */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Yoga
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {yoga.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{yoga.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {yoga.index + 1}/27
          </div>
        </div>

        {/* Karana */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Karana (Half-Tithi)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {karana.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{karana.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {karana.index + 1}/60
          </div>
        </div>

      </div>
    </div>
  );
}
