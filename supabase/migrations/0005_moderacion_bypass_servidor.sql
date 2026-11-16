-- La protección de campos de moderación solo se aplica a peticiones de la API (roles authenticated/anon);
-- los admins y el acceso directo a la BD quedan exentos.
create or replace function public.proteger_campos_moderacion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('role', true), 'none') not in ('authenticated', 'anon') or public.es_admin() then
    return new;
  end if;
  if tg_table_name = 'empresas' then
    new.verificada := case when tg_op = 'INSERT' then false else old.verificada end;
  elsif tg_table_name = 'candidatos' then
    if tg_op = 'INSERT' or new.num_colegiado is distinct from old.num_colegiado then
      new.colegiado_verificado := false;
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
