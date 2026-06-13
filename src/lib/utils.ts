export function formatDMS(decimalDegrees: number): string {
  const d = Math.floor(decimalDegrees);
  const minFloat = (decimalDegrees - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);
  
  return `${d}° ${m}' ${s}"`;
}
