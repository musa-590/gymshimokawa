-- Recordatorio de pago de la plataforma (aviso para usuarios del panel admin)
-- Ejecutar en Supabase (SQL Editor) tal cual está abajo.

create table if not exists public.alerta_pago_plataforma (
  id boolean primary key default true check (id = true), -- una sola fila
  activado boolean not null default false,
  fecha_vencimiento date,
  dias_aviso integer not null default 7,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.alerta_pago_plataforma enable row level security;

drop policy if exists "alerta_ver" on public.alerta_pago_plataforma;
create policy "alerta_ver" on public.alerta_pago_plataforma
  for select to authenticated using (true);

drop policy if exists "alerta_admin" on public.alerta_pago_plataforma;
create policy "alerta_admin" on public.alerta_pago_plataforma
  for all to authenticated using (get_rol_usuario() = 'admin') with check (get_rol_usuario() = 'admin');