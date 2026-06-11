const BASE      = 'https://mcp.dashbo.io/api/v1';
const CLIENT_ID = '7805';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.DASHBO_TOKEN;
  if (!token) return res.status(500).json({ error: 'DASHBO_TOKEN no configurado' });

  const today     = new Date().toISOString().slice(0, 10);
  const startDate = req.query.from || '2026-01-01';
  const endDate   = req.query.to   || today;

  try {
    const r = await fetch(`${BASE}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        client_id:  CLIENT_ID,
        date_range: { startDate, endDate },
        fields:     ['Canal', 'Campana', 'Campana_Estado', 'Fecha', 'Costo', 'Impresiones', 'Clicks', 'Conversiones_Primarias']
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(r.status).json({ error: `Dashbo ${r.status}`, detail });
    }

    const payload = await r.json();
    const rawRows = payload.rows || payload.data || [];

    // Transformar a formato DATA_2026: [canal, campaña, fechaYYYYMMDD, costo, imp, clicks, cpc, conv, ctr]
    const rows = rawRows
      .filter(row => row.Fecha && row.Canal && row.Campana_Estado !== 'Pausado')
      .map(row => {
        const costo  = Math.round(parseFloat(row.Costo  || 0));
        const imp    = Math.round(parseFloat(row.Impresiones || 0));
        const clicks = Math.round(parseFloat(row.Clicks || 0));
        const conv   = Math.round(parseFloat(row.Conversiones_Primarias || 0));
        const cpc    = clicks > 0 ? parseFloat((costo / clicks).toFixed(2)) : 0;
        const ctr    = imp    > 0 ? parseFloat((clicks / imp).toFixed(4))   : 0;
        const fecha  = row.Fecha.replace(/-/g, ''); // 2026-05-01 → 20260501

        return [
          row.Canal,          // 'GOOGLE' | 'FACEBOOK'
          row.Campana,        // nombre campaña
          fecha,              // YYYYMMDD
          costo,
          imp,
          clicks,
          cpc,
          conv,
          ctr
        ];
      });

    res.json({ ok: true, rows, total: rows.length, startDate, endDate });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
