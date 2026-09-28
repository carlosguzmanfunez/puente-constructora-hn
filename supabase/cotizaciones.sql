-- Tabla donde se guardan las solicitudes del formulario (ya aplicada en Supabase).
create table public.cotizaciones (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 3 and 120),
  correo text not null check (char_length(correo) between 5 and 160 and correo ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  mensaje text check (char_length(mensaje) <= 2000),
  pagina text check (char_length(pagina) <= 40),
  calculo jsonb,
  estado text not null default 'nueva'
);
alter table public.cotizaciones enable row level security;
create policy "publico puede enviar cotizaciones" on public.cotizaciones
  for insert to anon with check (estado = 'nueva');
revoke select, update, delete on public.cotizaciones from anon, authenticated;
grant insert (nombre, correo, mensaje, pagina, calculo) on public.cotizaciones to anon;
