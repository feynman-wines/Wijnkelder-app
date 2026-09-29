export function parseSingleWinePrice(priceStr?: string | number): number {
  if (priceStr === undefined || priceStr === null || priceStr === '') return 0;
  if (typeof priceStr === 'number') return priceStr;
  
  const str = String(priceStr).trim();
  // Normalize dashes (en-dash, em-dash, minus, hyphen)
  const normalized = str.replace(/[–—−]/g, '-');
  
  // If it is a range like "55-60", calculate the average
  if (normalized.includes('-')) {
    const parts = normalized.split('-');
    const p1 = parseFloat(parts[0].replace(/[^0-9,.]/g, '').replace(',', '.'));
    const p2 = parseFloat(parts[1].replace(/[^0-9,.]/g, '').replace(',', '.'));
    if (!isNaN(p1) && !isNaN(p2) && p1 > 0 && p2 > 0) {
      return (p1 + p2) / 2;
    }
    if (!isNaN(p1) && p1 > 0) return p1;
    if (!isNaN(p2) && p2 > 0) return p2;
  }
  
  const clean = normalized.replace(/[^0-9,.]/g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}
