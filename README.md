# Puente Constructora Honduras

Landing page para construir casas llave en mano en Honduras para hondureños en EE.UU.

- `public/` sitio estático: `index.html` (inicio) y `calculadora.html` (`/calculadora`).
- `api/cotizar.js` función de Vercel que guarda el formulario en Supabase.
- `supabase/cotizaciones.sql` esquema de la tabla `cotizaciones`.

## Variables de entorno (Vercel)

- `SUPABASE_URL` URL del proyecto de Supabase.
- `SUPABASE_KEY` clave pública (publishable). Solo permite insertar cotizaciones; leerlas requiere entrar al panel de Supabase.

## Ver las cotizaciones

Supabase → proyecto `puente-constructora-hn` → Table Editor → `cotizaciones`.

## Dominio

Vercel → proyecto → Settings → Domains → agregar el dominio y seguir las instrucciones de DNS.
Luego actualizar `SITE` en los `<link rel="canonical">`, `robots.txt` y `sitemap.xml`.
