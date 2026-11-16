-- Caducidad de ofertas (60 días, renovables)
alter table public.ofertas add column expira_el date not null default (current_date + 60);
create index ofertas_expira_idx on public.ofertas (expira_el);

-- ¿El usuario actual se ha postulado a esta oferta? (security definer para evitar recursión de RLS)
create or replace function public.he_aplicado(oferta uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.candidaturas c where c.oferta_id = oferta and c.candidato_id = auth.uid())
$$;
revoke execute on function public.he_aplicado(uuid) from public, anon;

-- Visibles: publicadas y vigentes; las propias; y aquellas a las que me he postulado (aunque se cierren)
drop policy "ofertas visibles" on public.ofertas;
create policy "ofertas visibles" on public.ofertas for select using (
  (estado = 'publicada' and expira_el >= current_date)
  or empresa_id = (select auth.uid())
  or public.he_aplicado(id)
);

drop policy "candidato aplica" on public.candidaturas;
create policy "candidato aplica" on public.candidaturas for insert with check (
  candidato_id = (select auth.uid())
  and public.mi_rol() = 'veterinario'
  and exists (select 1 from public.ofertas o
              where o.id = oferta_id and o.estado = 'publicada' and o.expira_el >= current_date)
);

-- Email de contacto de la empresa, solo para quien se ha postulado a su oferta (para notificaciones)
create or replace function public.email_empresa_oferta(oferta uuid)
returns text language sql stable security definer set search_path = '' as $$
  select p.email from public.ofertas o join public.profiles p on p.id = o.empresa_id
  where o.id = oferta and public.he_aplicado(oferta)
$$;
revoke execute on function public.email_empresa_oferta(uuid) from public, anon;

-- RGPD: el usuario puede borrar su cuenta y todos sus datos (cascada)
create or replace function public.borrar_mi_cuenta()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.borrar_mi_cuenta() from public, anon;

-- Registro del consentimiento de privacidad
alter table public.profiles add column acepta_privacidad_at timestamptz;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, email, acepta_privacidad_at)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'empresa' then 'empresa' else 'veterinario' end,
    new.email,
    nullif(new.raw_user_meta_data->>'acepta_privacidad_at', '')::timestamptz
  );
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
