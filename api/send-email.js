import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { to, month, google = [], meta = [] } = req.body;
  if (!to || !month) return res.status(400).json({ ok: false, error: 'Faltan parámetros to o month' });

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthLabel = `${MONTHS_ES[Number(month.slice(4,6)) - 1]} ${month.slice(0,4)}`;
  const base = `https://casa-pediatra-dashboard.vercel.app`;

  const rows = (label, color, items) => items.length
    ? items.map(inv => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #30363d;">
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:${color}20;color:${color};margin-right:8px;">${label}</span>
            ${inv.date || '—'}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #30363d;text-align:right;">
            <a href="${base}${inv.url}" style="color:#58a6ff;text-decoration:none;font-weight:600;">⬇ Descargar PDF</a>
          </td>
        </tr>`).join('')
    : `<tr><td colspan="2" style="padding:12px;color:#8b949e;text-align:center;">Sin facturas para ${label} en este mes</td></tr>`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;padding:32px;max-width:600px;margin:0 auto;border-radius:12px;">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 4px;">Facturas ${monthLabel}</h1>
      <p style="font-size:13px;color:#8b949e;margin:0 0 24px;">Dashboard Casa Pediatra · Cliente 7805</p>
      <table style="width:100%;border-collapse:collapse;background:#161b22;border:1px solid #30363d;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#21262d;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8b949e;font-weight:600;text-transform:uppercase;letter-spacing:.6px;">Plataforma · Fecha</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#8b949e;font-weight:600;text-transform:uppercase;letter-spacing:.6px;">Factura</th>
          </tr>
        </thead>
        <tbody>
          ${rows('Google Ads', '#4285f4', google)}
          ${rows('Meta Ads', '#42a5f5', meta)}
        </tbody>
      </table>
      <p style="font-size:11px;color:#8b949e;margin-top:20px;">Enviado desde Dashboard Casa Pediatra 2026</p>
    </div>`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: `"Dashboard Casa Pediatra" <${process.env.SMTP_USER}>`,
      to,
      subject: `Facturas ${monthLabel} — Casa Pediatra`,
      html
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
