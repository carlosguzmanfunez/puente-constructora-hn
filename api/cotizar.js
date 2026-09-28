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
  await notify({ nombre, correo, mensaje, pagina, calculo }).catch((e) => console.error('correo', e));
  return res.status(200).json({ ok: true });
};

// Correos con Resend. Sin RESEND_API_KEY no se envía nada (la cotización ya quedó guardada).
// NOTIFY_EMAIL: a quién avisar de cada cotización nueva.
// EMAIL_FROM: remitente con dominio verificado en Resend; mientras no exista se usa el remitente
// de prueba de Resend, que solo puede escribir al correo de la cuenta, y no se envía confirmación al cliente.
async function notify(c) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const from = process.env.EMAIL_FROM || 'Puente Constructora <onboarding@resend.dev>';
  const send = (body) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...body }),
  }).then(async (r) => { if (!r.ok) throw new Error(r.status + ' ' + (await r.text())); });

  const calc = c.calculo ? `Cálculo: ${c.calculo.ruta === 'cuota' ? 'cuota fija' : 'hipoteca'}, $${c.calculo.monto}/mes, ${c.calculo.resultado || ''}` : 'Sin cálculo';
  const jobs = [];
  if (process.env.NOTIFY_EMAIL) {
    jobs.push(send({
      to: process.env.NOTIFY_EMAIL,
      reply_to: c.correo,
      subject: `Nueva cotización: ${c.nombre}`,
      text: `Nombre: ${c.nombre}\nCorreo: ${c.correo}\nPágina: ${c.pagina}\n${calc}\n\nMensaje:\n${c.mensaje}`,
    }));
  }
  if (process.env.EMAIL_FROM) {
    const first = c.nombre.split(/\s+/)[0];
    jobs.push(send({
      to: c.correo,
      reply_to: process.env.NOTIFY_EMAIL || undefined,
      subject: 'Recibimos tu solicitud de cotización',
      text: `Hola, ${first}:\n\nGracias por escribir a Puente Constructora Honduras. Recibimos tu solicitud y te responderemos en menos de 24 horas.\n\n${c.pagina === 'calculadora' && c.calculo ? calc + '\n\n' : ''}Si prefieres, escríbenos por WhatsApp: https://wa.me/50431580149\n\nPuente Constructora Honduras`,
    }));
  }
  await Promise.all(jobs);
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
