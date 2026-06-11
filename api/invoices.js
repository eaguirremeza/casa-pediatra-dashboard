import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { month } = req.query; // 'YYYYMM'
  if (!month || month.length !== 6) {
    return res.status(400).json({ ok: false, error: 'Parámetro month inválido (esperado YYYYMM)' });
  }

  const year = month.slice(0, 4); // '2026'
  const mon  = month.slice(4, 6); // '05'

  // ── Google Ads: XXXXXXXXX_YYYYMMDD.pdf ──────────────────────────────────
  // Filtra archivos cuyo YYYYMM en el nombre coincida con el mes seleccionado
  let googleInvoices = [];
  try {
    const googleDir = join(__dirname, '..', 'Invoices Google Ads');
    googleInvoices = readdirSync(googleDir)
      .filter(f => f.endsWith('.pdf'))
      .filter(f => {
        const m = f.match(/_(\d{4})(\d{2})\d{2}\.pdf$/);
        return m && m[1] === year && m[2] === mon;
      })
      .map(f => ({
        filename: f,
        date: `${year}-${mon}`,
        url: `/Invoices%20Google%20Ads/${encodeURIComponent(f)}`
      }));
  } catch (e) {
    // Carpeta no accesible en este entorno
  }

  // ── Meta Ads: YYYY-MM-DDTHH-MM Transacción n.º ...pdf ───────────────────
  // Filtra archivos cuyo YYYY-MM al inicio coincida con el mes seleccionado
  let metaInvoices = [];
  try {
    const metaDir = join(__dirname, '..', 'Invoices Meta Ads');
    metaInvoices = readdirSync(metaDir)
      .filter(f => f.endsWith('.pdf'))
      .filter(f => {
        const m = f.match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m && m[1] === year && m[2] === mon;
      })
      .map(f => {
        const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
        return {
          filename: f,
          date: dateMatch ? dateMatch[1] : `${year}-${mon}`,
          url: `/Invoices%20Meta%20Ads/${encodeURIComponent(f)}`
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    // Carpeta no accesible en este entorno
  }

  res.json({ ok: true, google: googleInvoices, meta: metaInvoices, month });
}
