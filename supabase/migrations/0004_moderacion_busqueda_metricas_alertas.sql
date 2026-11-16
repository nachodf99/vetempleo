-- ───────────── Administración y moderación ─────────────
alter table public.profiles add column es_admin boolean not null default false;

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select es_admin from public.profiles where id = auth.uid()), false)
$$;
revoke execute on function public.es_admin() from public, anon;

-- El usuario no puede hacerse admin a sí mismo (profiles no tiene política de update, pero por si acaso)
revoke update on public.profiles from authenticated, anon;

-- Ofertas retiradas por moderación
alter table public.ofertas drop constraint ofertas_estado_check;
alter table public.ofertas add constraint ofertas_estado_check
  check (estado in ('borrador','publicada','cerrada','retirada'));
alter table public.ofertas add column motivo_retirada text;

-- Verificación manual (la hace un admin)
alter table public.empresas add column verificada boolean not null default false;
alter table public.candidatos add column colegiado_verificado boolean not null default false;

create or replace function public.proteger_campos_moderacion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.es_admin() then return new; end if;
  if tg_table_name = 'empresas' then
    new.verificada := case when tg_op = 'INSERT' then false else old.verificada end;
  elsif tg_table_name = 'candidatos' then
    if tg_op = 'INSERT' or new.num_colegiado is distinct from old.num_colegiado then
      new.colegiado_verificado := false;          -- cambiar el nº de colegiado anula la verificación
    else
      new.colegiado_verificado := old.colegiado_verificado;
    end if;
  elsif tg_table_name = 'ofertas' then
    if tg_op = 'UPDATE' and old.estado = 'retirada' then
      raise exception 'Esta oferta fue retirada por moderación. Contacta con el administrador.';
    end if;
    if new.estado = 'retirada' then raise exception 'Estado no permitido'; end if;
    new.motivo_retirada := case when tg_op = 'INSERT' then null else old.motivo_retirada end;
  end if;
  return new;
end $$;
revoke execute on function public.proteger_campos_moderacion() from public, anon, authenticated;

create trigger t_mod_empresas before insert or update on public.empresas
  for each row execute function public.proteger_campos_moderacion();
create trigger t_mod_candidatos before insert or update on public.candidatos
  for each row execute function public.proteger_campos_moderacion();
create trigger t_mod_ofertas before insert or update on public.ofertas
  for each row execute function public.proteger_campos_moderacion();

-- Permisos del admin
create policy "admin ve ofertas" on public.ofertas for select using (public.es_admin());
create policy "admin modera ofertas" on public.ofertas for update using (public.es_admin());
create policy "admin verifica empresas" on public.empresas for update using (public.es_admin());
create policy "admin ve candidatos" on public.candidatos for select using (public.es_admin());
create policy "admin verifica candidatos" on public.candidatos for update using (public.es_admin());
create policy "admin ve perfiles" on public.profiles for select using (public.es_admin());

-- Denuncias
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  oferta_id uuid not null references public.ofertas(id) on delete cascade,
  autor_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  motivo text not null check (motivo in ('falsa','condiciones_no_reales','discriminatoria','spam','otro')),
  detalle text check (length(detalle) <= 1000),
  estado text not null default 'pendiente' check (estado in ('pendiente','resuelta','descartada')),
  created_at timestamptz not null default now(),
  unique (oferta_id, autor_id)
);
create index denuncias_estado_idx on public.denuncias (estado, created_at desc);
create index denuncias_autor_idx on public.denuncias (autor_id);
alter table public.denuncias enable row level security;
create policy "denunciar" on public.denuncias for insert to authenticated
  with check (autor_id = (select auth.uid()));
create policy "admin lee denuncias" on public.denuncias for select using (public.es_admin());
create policy "admin gestiona denuncias" on public.denuncias for update using (public.es_admin());

-- ───────────── Tiempo de respuesta de los centros ─────────────
alter table public.candidaturas add column respondida_at timestamptz;
create or replace function public.marcar_respondida()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.estado = 'enviada' and new.estado <> 'enviada' and old.respondida_at is null then
    new.respondida_at := now();
  end if;
  return new;
end $$;
create trigger t_respondida before update on public.candidaturas
  for each row execute function public.marcar_respondida();

-- Métricas públicas (solo agregados) de un centro
create or replace function public.metricas_empresa(e uuid)
returns table (candidaturas int, respondidas int, horas_mediana numeric, ofertas_publicadas int)
language sql stable security definer set search_path = '' as $$
  select
    count(c.id)::int,
    count(c.respondida_at)::int,
    round((percentile_cont(0.5) within group (order by extract(epoch from (c.respondida_at - c.created_at)) / 3600))::numeric, 1),
    (select count(*)::int from public.ofertas o2 where o2.empresa_id = e and o2.estado in ('publicada','cerrada'))
  from public.ofertas o
  left join public.candidaturas c on c.oferta_id = o.id
  where o.empresa_id = e
$$;
grant execute on function public.metricas_empresa(uuid) to anon, authenticated;

-- ───────────── Búsqueda de texto completo (sin tildes) ─────────────
create extension if not exists unaccent with schema extensions;
create or replace function public.sin_tildes(t text)
returns text language sql immutable parallel safe set search_path = '' as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''))
$$;
alter table public.ofertas add column busqueda tsvector generated always as (
  to_tsvector('spanish', public.sin_tildes(
    titulo || ' ' || descripcion || ' ' || municipio || ' ' || provincia || ' ' || coalesce(requisitos, '')
  ))
) stored;
create index ofertas_busqueda_fts on public.ofertas using gin (busqueda);

-- ───────────── Estadísticas salariales del sector ─────────────
-- Solo grupos con 3+ ofertas, para que no se pueda deducir el salario de un centro concreto
create or replace function public.estadisticas_salariales()
returns table (dimension text, valor text, ofertas int, salario_min_medio int, salario_max_medio int,
               salario_mediano int, pct_con_guardias int, pct_sin_findes int)
language sql stable security definer set search_path = '' as $$
  with base as (
    select area, puesto, provincia, salario_min, salario_max, guardias, fines_semana
    from public.ofertas
    where estado in ('publicada','cerrada') and jornada = 'completa'
  )
  select
    case when grouping(area) = 0 then 'area' when grouping(puesto) = 0 then 'puesto' else 'provincia' end,
    coalesce(area, puesto, provincia),
    count(*)::int,
    round(avg(salario_min))::int,
    round(avg(salario_max))::int,
    round(percentile_cont(0.5) within group (order by (salario_min + salario_max) / 2.0))::int,
    round(100.0 * avg(guardias::int))::int,
    round(100.0 * avg((fines_semana = 'nunca')::int))::int
  from base
  group by grouping sets ((area), (puesto), (provincia))
  having count(*) >= 3
$$;
grant execute on function public.estadisticas_salariales() to anon, authenticated;

-- ───────────── Alertas de ofertas por email ─────────────
create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references public.candidatos(id) on delete cascade default auth.uid(),
  provincia text,
  area text,
  puesto text,
  salario_min int,
  sin_guardias boolean not null default false,
  sin_findes boolean not null default false,
  activa boolean not null default true,
  ultimo_envio timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index alertas_candidato_idx on public.alertas (candidato_id);
alter table public.alertas enable row level security;
create policy "alertas propias lee" on public.alertas for select using (candidato_id = (select auth.uid()));
create policy "alertas propias crea" on public.alertas for insert with check (candidato_id = (select auth.uid()));
create policy "alertas propias edita" on public.alertas for update using (candidato_id = (select auth.uid()));
create policy "alertas propias borra" on public.alertas for delete using (candidato_id = (select auth.uid()));

-- Secreto compartido con la tarea programada de Vercel (fuera del esquema público)
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
create table privado.ajustes (clave text primary key, valor text not null);

-- Devuelve las alertas con ofertas nuevas y marca el envío. Protegida por secreto.
create or replace function public.alertas_para_enviar(p_secreto text)
returns table (alerta_id uuid, email text, nombre text, ofertas jsonb)
language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_secreto is null or p_secreto is distinct from (select valor from privado.ajustes where clave = 'alertas_secreto') then
    raise exception 'no autorizado';
  end if;

  return query
  with pendientes as (
    select a.*, c.nombre as cand_nombre, p.email as cand_email
    from public.alertas a
    join public.candidatos c on c.id = a.candidato_id
    join public.profiles p on p.id = a.candidato_id
    where a.activa
  ),
  coincidencias as (
    select pe.id as aid, pe.cand_email, pe.cand_nombre,
      jsonb_agg(jsonb_build_object('id', o.id, 'titulo', o.titulo, 'municipio', o.municipio,
        'provincia', o.provincia, 'salario_min', o.salario_min, 'salario_max', o.salario_max)
        order by o.created_at desc) as ofs
    from pendientes pe
    join public.ofertas o on o.estado = 'publicada' and o.expira_el >= current_date
      and o.created_at > pe.ultimo_envio
      and (pe.provincia is null or o.provincia = pe.provincia)
      and (pe.area is null or o.area = pe.area)
      and (pe.puesto is null or o.puesto = pe.puesto)
      and (pe.salario_min is null or o.salario_max >= pe.salario_min)
      and (not pe.sin_guardias or not o.guardias)
      and (not pe.sin_findes or o.fines_semana = 'nunca')
    group by pe.id, pe.cand_email, pe.cand_nombre
  )
  select aid, cand_email, cand_nombre, ofs from coincidencias;

  update public.alertas set ultimo_envio = now() where activa;
end $$;
revoke execute on function public.alertas_para_enviar(text) from public;
grant execute on function public.alertas_para_enviar(text) to anon, authenticated;
