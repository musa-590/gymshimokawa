-- Remediación de seguridad RLS (2026-08-01)
-- Aplicado en producción vía MCP; conservado para reproducir el estado en clones.

-- 1) RLS habilitado en promocion_envios (estaba deshabilitado)
alter table public.promocion_envios enable row level security;
create policy "open_access" on public.promocion_envios
  for all to authenticated using (true) with check (true);

-- 2) Políticas open_access: de rol public (anon) a solo authenticated
do $$
declare t text;
begin
  foreach t in array array[
    'asistencia_clientes','asistencia_personal','cajas','clientes','descuentos',
    'detalle_fiados','detalle_ventas','fiados','movimientos_stock','pagos_membresia',
    'permisos','personal','productos','roles','tipos_membresia','ventas','usuarios'
  ]
  loop
    execute format('drop policy if exists "open_access" on public.%I', t);
    execute format('create policy "open_access" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 3) Cerrar políticas residuales abiertas / deprecadas
drop policy if exists "usuarios_view_all_for_clientes_join" on public.usuarios;
create policy "usuarios_view_all_for_clientes_join" on public.usuarios
  for select to authenticated using (true);

drop policy if exists "permisos_ver" on public.permisos; -- usaba auth.role() deprecado
drop policy if exists "roles_ver" on public.roles;

drop policy if exists "historial_admin" on public.historial_roles;
create policy "historial_admin" on public.historial_roles
  for all to authenticated using (get_rol_usuario() = 'admin');

drop policy if exists "detalle_crear" on public.detalle_ventas;
drop policy if exists "detalle_ver" on public.detalle_ventas;
create policy "detalle_crear" on public.detalle_ventas
  for insert to authenticated with check (tiene_permiso('caja', 'crear'));
create policy "detalle_ver" on public.detalle_ventas
  for select to authenticated using (tiene_permiso('caja', 'ver'));

drop policy if exists "stock_crear" on public.movimientos_stock;
drop policy if exists "stock_ver" on public.movimientos_stock;
create policy "stock_crear" on public.movimientos_stock
  for insert to authenticated with check (tiene_permiso('productos', 'editar'));
create policy "stock_ver" on public.movimientos_stock
  for select to authenticated using (tiene_permiso('productos', 'ver'));

drop policy if exists "log_insertar" on public.log_actividad;
drop policy if exists "log_ver_propio" on public.log_actividad;
create policy "log_insertar" on public.log_actividad
  for insert to authenticated with check (usuario_id = auth.uid());
create policy "log_ver_propio" on public.log_actividad
  for select to authenticated using (usuario_id = auth.uid() or get_rol_usuario() = 'admin');

-- 4) Vistas SECURITY DEFINER → SECURITY INVOKER (Postgres 15+)
create or replace view public.v_clientes_vip with (security_invoker = true) as
SELECT id, nombre, dni, telefono, foto_url, fecha_cumpleanos, vip_desde, vip_motivo, created_at,
    EXISTS (SELECT 1 FROM asistencia_vip av WHERE av.cliente_id = c.id AND av.fecha = CURRENT_DATE) AS asistio_hoy,
    (SELECT count(*) FROM asistencia_vip av WHERE av.cliente_id = c.id AND date_trunc('month', av.fecha) = date_trunc('month', CURRENT_DATE)) AS asistencias_este_mes,
    (SELECT count(*) FROM asistencia_vip av WHERE av.cliente_id = c.id) AS total_asistencias
FROM clientes c WHERE es_vip = true ORDER BY nombre;

create or replace view public.v_cumpleanos_proximos with (security_invoker = true) as
SELECT id, nombre, dni, telefono, fecha_cumpleanos,
    CASE WHEN to_date(EXTRACT(year FROM CURRENT_DATE)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD') >= CURRENT_DATE
         THEN to_date(EXTRACT(year FROM CURRENT_DATE)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD')
         ELSE to_date((EXTRACT(year FROM CURRENT_DATE) + 1)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD')
    END AS proximo_cumpleanos
FROM clientes
WHERE fecha_cumpleanos IS NOT NULL
  AND (to_date(EXTRACT(year FROM CURRENT_DATE)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD') BETWEEN CURRENT_DATE AND CURRENT_DATE + 12
       OR to_date((EXTRACT(year FROM CURRENT_DATE) + 1)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD') BETWEEN CURRENT_DATE AND CURRENT_DATE + 12)
ORDER BY CASE WHEN to_date(EXTRACT(year FROM CURRENT_DATE)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD') >= CURRENT_DATE
         THEN to_date(EXTRACT(year FROM CURRENT_DATE)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD')
         ELSE to_date((EXTRACT(year FROM CURRENT_DATE) + 1)::text || '-' || lpad(EXTRACT(month FROM fecha_cumpleanos)::text, 2, '0') || '-' || lpad(EXTRACT(day FROM fecha_cumpleanos)::text, 2, '0'), 'YYYY-MM-DD')
    END;

create or replace view public.v_membresias_por_vencer with (security_invoker = true) as
SELECT c.id, c.nombre, c.dni, c.telefono, c.fecha_vencimiento_membresia, tm.nombre AS tipo_membresia,
    c.fecha_vencimiento_membresia - CURRENT_DATE AS dias_restantes
FROM clientes c LEFT JOIN tipos_membresia tm ON c.tipo_membresia_id = tm.id
WHERE c.fecha_vencimiento_membresia >= CURRENT_DATE
  AND c.fecha_vencimiento_membresia <= CURRENT_DATE + 15
  AND c.estado <> 'inactivo'
ORDER BY c.fecha_vencimiento_membresia;

create or replace view public.v_reporte_membresias_mes with (security_invoker = true) as
SELECT pm.id, c.nombre AS cliente, c.dni, tm.nombre AS tipo_membresia, pm.monto_base,
    pm.descuento_aplicado, pm.monto_final, pm.fecha_inicio, pm.fecha_vencimiento, pm.created_at
FROM pagos_membresia pm
JOIN clientes c ON pm.cliente_id = c.id
JOIN tipos_membresia tm ON pm.tipo_membresia_id = tm.id
WHERE pm.created_at >= now() - interval '30 days'
ORDER BY pm.created_at DESC;

create or replace view public.v_reporte_ventas with (security_invoker = true) as
SELECT v.id, v.created_at, c.nombre AS cliente, v.subtotal, v.descuento_aplicado, v.total,
    (v.created_at >= now() - interval '7 days') AS es_esta_semana,
    (v.created_at >= now() - interval '30 days') AS es_este_mes
FROM ventas v LEFT JOIN clientes c ON v.cliente_id = c.id
WHERE v.created_at >= now() - interval '30 days'
ORDER BY v.created_at DESC;

create or replace view public.v_usuarios_con_rol with (security_invoker = true) as
SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.ultimo_acceso, u.created_at,
    r.nombre AS rol, r.descripcion AS rol_descripcion, c.nombre AS creado_por_nombre
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
LEFT JOIN usuarios c ON u.creado_por = c.id
ORDER BY u.created_at DESC;

-- 5) search_path fijo en todas las funciones (anti hijacking)
alter function public.actualizar_estados_clientes(date, date) set search_path = public;
alter function public.cerrar_cajas_automatico() set search_path = public;
alter function public.get_rol_usuario() set search_path = public;
alter function public.registrar_ultimo_acceso(uuid) set search_path = public;
alter function public.tiene_permiso(text, text) set search_path = public;
alter function public.actualizar_caja_por_membresia() set search_path = public;
alter function public.actualizar_caja_por_venta() set search_path = public;
alter function public.actualizar_estado_clientes() set search_path = public;
alter function public.actualizar_estado_membresia() set search_path = public;
alter function public.aplicar_movimiento_stock() set search_path = public;
alter function public.cerrar_cajas_vencidas() set search_path = public;
alter function public.trigger_actualizar_estado_cliente() set search_path = public;
alter function public.update_updated_at() set search_path = public;

-- 6) Funciones SECURITY DEFINER: revocar EXECUTE público, solo authenticated
revoke execute on function public.actualizar_estados_clientes(date, date) from public;
revoke execute on function public.cerrar_cajas_automatico() from public;
revoke execute on function public.get_rol_usuario() from public;
revoke execute on function public.registrar_ultimo_acceso(uuid) from public;
revoke execute on function public.tiene_permiso(text, text) from public;

grant execute on function public.actualizar_estados_clientes(date, date) to authenticated;
grant execute on function public.get_rol_usuario() to authenticated;
grant execute on function public.registrar_ultimo_acceso(uuid) to authenticated;
grant execute on function public.tiene_permiso(text, text) to authenticated;
-- cerrar_cajas_automatico: solo postgres/service_role (pg_cron)

-- 7) Storage: políticas del bucket promociones solo para authenticated
drop policy if exists "Allow public access to promociones" on storage.objects;
drop policy if exists "Allow authenticated users to view promociones" on storage.objects;
drop policy if exists "Allow authenticated users to upload to promociones" on storage.objects;
drop policy if exists "Allow authenticated users to update promociones" on storage.objects;

create policy "Allow authenticated users to upload to promociones" on storage.objects
  for insert to authenticated with check (bucket_id = 'promociones');
create policy "Allow authenticated users to update promociones" on storage.objects
  for update to authenticated using (bucket_id = 'promociones') with check (bucket_id = 'promociones');
