// Guarda una solicitud de cotización del formulario en Supabase (tabla public.cotizaciones).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const b = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  // Campo trampa: los bots lo llenan, las personas no lo ven.
  if (b.web) return res.status(200).json({ ok: true });

  const nombre = String(b.nombre || '').trim().slice(0, 120);
  const correo = String(b.correo || '').trim().slice(0, 160);
  const mensaje = String(b.mensaje || '').trim().slice(0, 2000);
  const pagina = b.pagina === 'calculadora' ? 'calculadora' : 'inicio';
  const calculo = b.calculo && typeof b.calculo === 'object' ? b.calculo : null;

  if (nombre.split(/\s+/).length < 2 || nombre.length < 3) return res.status(400).json({ error: 'Nombre y apellido requeridos' });
  if (!EMAIL.test(correo)) return res.status(400).json({ error: 'Correo inválido' });

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Servidor sin configurar' });

  const r = await fetch(url + '/rest/v1/cotizaciones', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ nombre, correo, mensaje, pagina, calculo }),
  });
  if (!r.ok) {
    console.error('supabase', r.status, await r.text());
    return res.status(502).json({ error: 'No se pudo guardar' });
  }
  return res.status(200).json({ ok: true });
};

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
