import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _data = null;
function getData() {
  if (!_data) {
    const raw = readFileSync(join(__dirname, '..', 'invoices-data.json'), 'utf8');
    _data = JSON.parse(raw);
  }
  return _data;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { month } = req.query;
  if (!month || month.length !== 6) {
    return res.status(400).json({ ok: false, error: 'Parámetro month inválido (esperado YYYYMM)' });
  }

  const data = getData();
  const entry = data[month] || { meta: [], google: [] };

  const google = (entry.google || []).map(f => ({
    date: f.date,
    filename: f.filename,
    url: `/Invoices%20Google%20Ads/${encodeURIComponent(f.filename)}`
  }));

  const meta = (entry.meta || []).map(f => ({
    date: f.date,
    filename: f.filename,
    url: `/Invoices%20Meta%20Ads/${encodeURIComponent(f.filename)}`
  }));

  res.json({ ok: true, google, meta, month });
}
