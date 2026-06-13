import React from 'react';

interface AwasthasTableProps {
  data: Record<string, {
    lajjitadi: string;
    sayanadi: string;
    sayanadiRemainder: number;
    sayanadiCalculation: string;
    s: number;
    p: number;
    n: number;
    a: number;
    g: number;
    r: number;
  }>;
}

export default function AwasthasTable({ data }: AwasthasTableProps) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>No Awasthas data available.</div>;
  }

  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Planetary Awasthas</h2>
      <table className="details-table" style={{ minWidth: '600px' }}>
        <thead>
          <tr>
            <th>Planet</th>
            <th>Lajjitadi Awastha</th>
            <th>Sayanadi Awastha</th>
            <th title="Sayanadi Calculation Remainder">Rem</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((planet) => {
            const planetData = data[planet];
            if (!planetData) return null;

            return (
              <tr key={planet}>
                <td style={{ fontWeight: 'bold' }}>{planet}</td>
                <td style={{ color: 'var(--text-muted)' }}>{planetData.lajjitadi}</td>
                <td>{planetData.sayanadi}</td>
                <td>{planetData.sayanadiRemainder}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p><strong>Note:</strong> Lajjitadi Awasthas formula is pending and marked as TBD.</p>
      </div>
    </div>
  );
}
