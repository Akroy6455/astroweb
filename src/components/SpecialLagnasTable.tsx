import React from 'react';

export default function SpecialLagnasTable({ data }: { data: any }) {
  if (!data || !data.specialLagnas) return null;

  const { specialLagnas } = data;

  const formatDeg = (longitude: number) => {
    return `${(longitude % 30).toFixed(2)}°`;
  };

  const lagnas = [
    { name: 'Bhava Lagna (BL)', rasi: specialLagnas.bhavaLagna?.rasi?.name, deg: specialLagnas.bhavaLagna?.longitude },
    { name: 'Hora Lagna (HL)', rasi: specialLagnas.horaLagna?.rasi?.name, deg: specialLagnas.horaLagna?.longitude },
    { name: 'Ghati Lagna (GL)', rasi: specialLagnas.ghatiLagna?.rasi?.name, deg: specialLagnas.ghatiLagna?.longitude },
    { name: 'Pranapada Lagna (PL)', rasi: specialLagnas.pranapadaLagna?.rasi?.name, deg: specialLagnas.pranapadaLagna?.longitude },
    { name: 'Indu Lagna (IL)', rasi: specialLagnas.induLagna?.rasi?.name, deg: null },
    { name: 'Arudha Lagna (AL)', rasi: specialLagnas.arudhaLagna?.rasi?.name, deg: null },
    { name: 'Upapada Lagna (UL)', rasi: specialLagnas.upapadaLagna?.rasi?.name, deg: null }
  ];

  return (
    <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', textAlign: 'center' }}>Special Lagnas</h3>
      <table className="details-table" style={{ width: '100%', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Lagna</th>
            <th>Sign (Rasi)</th>
            <th>Degrees</th>
          </tr>
        </thead>
        <tbody>
          {lagnas.map(l => l.rasi ? (
            <tr key={l.name}>
              <td style={{ fontWeight: 'bold' }}>{l.name}</td>
              <td style={{ textAlign: 'center' }}>{l.rasi}</td>
              <td style={{ textAlign: 'center' }}>{l.deg !== null && l.deg !== undefined ? formatDeg(l.deg) : '-'}</td>
            </tr>
          ) : null)}
        </tbody>
      </table>
    </div>
  );
}
