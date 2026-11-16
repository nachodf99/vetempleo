-- VetEmpleo · esquema inicial
-- Roles: 'veterinario' (candidato) y 'empresa' (clínica, hospital, industria...)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('veterinario','empresa')),
  email text,
  created_at timestamptz not null default now()
);

-- Alta automática del perfil al registrarse (el rol viaja en raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, email)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'empresa' then 'empresa' else 'veterinario' end,
    new.email
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.mi_rol()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ───────────── Candidatos (veterinarios / ATV) ─────────────
create table public.candidatos (
  id uuid primary key references public.profiles(id) on delete cascade,
  nombre text not null,
  apellidos text not null,
  telefono text,
  provincia text not null,
  municipio text,
  dispuesto_traslado boolean not null default false,
  perfil_profesional text not null check (perfil_profesional in
    ('veterinario','atv','auxiliar','estudiante')),
  num_colegiado text,
  colegio text,
  universidad text,
  anio_titulacion int check (anio_titulacion between 1950 and 2100),
  anios_experiencia int not null default 0 check (anios_experiencia >= 0),
  areas text[] not null default '{}',
  especies text[] not null default '{}',
  especialidades text,            -- postgrados, acreditaciones AVEPA, residencias…
  idiomas text,
  salario_deseado int,            -- bruto anual €
  jornada_deseada text check (jornada_deseada in ('completa','parcial','indiferente')),
  acepta_guardias boolean,
  carnet_conducir boolean not null default false,
  disponibilidad text,            -- p.ej. "inmediata", "1 mes"
  resumen text,
  cv_path text,                   -- ruta en storage bucket 'cvs'
  buscando_activamente boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.experiencias (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references public.candidatos(id) on delete cascade,
  puesto text not null,
  centro text not null,
  fecha_inicio date not null,
  fecha_fin date,
  descripcion text
);

-- ───────────── Empresas ─────────────
create table public.empresas (
  id uuid primary key references public.profiles(id) on delete cascade,
  nombre text not null,
  cif text,
  tipo_centro text not null check (tipo_centro in
    ('clinica','hospital','hospital_24h','ambulatoria','grupo_clinicas','industria',
     'laboratorio','administracion','explotacion_ganadera','otro')),
  provincia text not null,
  municipio text,
  web text,
  descripcion text,
  num_empleados int,
  created_at timestamptz not null default now()
);

-- ───────────── Ofertas: aquí está la diferencia con LinkedIn/InfoJobs ─────────────
-- Todo lo que un veterinario necesita saber para decidir es OBLIGATORIO.
create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  estado text not null default 'publicada' check (estado in ('borrador','publicada','cerrada')),
  titulo text not null check (length(titulo) between 5 and 120),
  puesto text not null check (puesto in
    ('veterinario_generalista','veterinario_especialista','veterinario_urgencias',
     'cirujano','director_clinico','residente_internado','atv','auxiliar','recepcion',
     'inspector','comercial_tecnico','investigacion','otro')),
  area text not null check (area in
    ('pequenos_animales','exoticos','equidos','rumiantes','porcino','avicola',
     'mixta','salud_publica','industria','laboratorio','investigacion','docencia')),
  especies text[] not null check (cardinality(especies) > 0),
  provincia text not null,
  municipio text not null,
  modalidad text not null check (modalidad in ('presencial','ambulante','hibrido','remoto')),

  -- Contrato y dinero
  tipo_contrato text not null check (tipo_contrato in
    ('indefinido','temporal','sustitucion','fijo_discontinuo','practicas','autonomo','mercantil')),
  duracion_meses int,             -- obligatorio si no es indefinido (ver check)
  periodo_prueba_meses int not null check (periodo_prueba_meses between 0 and 12),
  salario_min int not null check (salario_min >= 12000),
  salario_max int not null,
  salario_variable text,          -- incentivos, % facturación…
  convenio text not null,         -- convenio colectivo aplicable o "sin convenio"
  pagas int not null default 14 check (pagas between 12 and 16),

  -- Tiempo
  jornada text not null check (jornada in ('completa','parcial')),
  horas_semanales numeric(4,1) not null check (horas_semanales between 1 and 60),
  horario text not null,          -- "L-V 9-14 y 16-20", turnos rotativos…
  fines_semana text not null check (fines_semana in
    ('nunca','1_al_mes','2_al_mes','alternos','todos','rotativo')),
  guardias boolean not null,
  guardias_detalle text,          -- nº/mes, presencial o localizada
  guardias_retribucion text,      -- €/guardia o compensación en días
  nocturnidad boolean not null default false,
  dias_vacaciones int not null check (dias_vacaciones >= 22),

  -- Requisitos
  experiencia_min_anios int not null default 0 check (experiencia_min_anios >= 0),
  colegiacion_requerida boolean not null default true,
  carnet_requerido boolean not null default false,
  requisitos text,
  idiomas text,

  -- El centro
  num_veterinarios int not null check (num_veterinarios >= 0),
  num_atv int not null check (num_atv >= 0),
  equipamiento text[] not null default '{}',
  formacion_anual_eur int,        -- presupuesto de formación continua
  cuota_colegial_pagada boolean not null default false,
  seguro_rc_pagado boolean not null default false,
  beneficios text,

  -- Proceso
  descripcion text not null check (length(descripcion) >= 80),
  fases_seleccion text not null,
  plazo_respuesta_dias int not null check (plazo_respuesta_dias between 1 and 60),
  fecha_incorporacion date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint salario_rango check (salario_max >= salario_min and salario_max <= salario_min * 2),
  constraint duracion_si_temporal check (tipo_contrato in ('indefinido','autonomo','mercantil') or duracion_meses is not null),
  constraint guardias_explicadas check (not guardias or (guardias_detalle is not null and guardias_retribucion is not null))
);

create index ofertas_busqueda_idx on public.ofertas (estado, provincia, area, created_at desc);
create index ofertas_empresa_idx on public.ofertas (empresa_id);

-- ───────────── Candidaturas ─────────────
create table public.candidaturas (
  id uuid primary key default gen_random_uuid(),
  oferta_id uuid not null references public.ofertas(id) on delete cascade,
  candidato_id uuid not null references public.candidatos(id) on delete cascade,
  carta text,
  estado text not null default 'enviada' check (estado in
    ('enviada','vista','en_proceso','entrevista','descartada','contratada')),
  nota_empresa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (oferta_id, candidato_id)
);
create index candidaturas_candidato_idx on public.candidaturas (candidato_id);
create index experiencias_candidato_idx on public.experiencias (candidato_id);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_ofertas before update on public.ofertas for each row execute function public.touch_updated_at();
create trigger t_candidaturas before update on public.candidaturas for each row execute function public.touch_updated_at();
create trigger t_candidatos before update on public.candidatos for each row execute function public.touch_updated_at();

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.candidatos enable row level security;
alter table public.experiencias enable row level security;
alter table public.empresas enable row level security;
alter table public.ofertas enable row level security;
alter table public.candidaturas enable row level security;

create policy "perfil propio" on public.profiles for select using (id = (select auth.uid()));

-- ¿la empresa actual ha recibido candidatura de este candidato?
create or replace function public.empresa_ve_candidato(cand uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.candidaturas c
    join public.ofertas o on o.id = c.oferta_id
    where c.candidato_id = cand and o.empresa_id = auth.uid()
  )
$$;

create policy "candidato lee" on public.candidatos for select
  using (id = (select auth.uid()) or public.empresa_ve_candidato(id));
create policy "candidato crea" on public.candidatos for insert
  with check (id = (select auth.uid()) and public.mi_rol() = 'veterinario');
create policy "candidato edita" on public.candidatos for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "experiencias lee" on public.experiencias for select
  using (candidato_id = (select auth.uid()) or public.empresa_ve_candidato(candidato_id));
create policy "experiencias inserta" on public.experiencias for insert
  with check (candidato_id = (select auth.uid()));
create policy "experiencias edita" on public.experiencias for update
  using (candidato_id = (select auth.uid())) with check (candidato_id = (select auth.uid()));
create policy "experiencias borra" on public.experiencias for delete
  using (candidato_id = (select auth.uid()));

create policy "empresas publicas" on public.empresas for select using (true);
create policy "empresa crea" on public.empresas for insert
  with check (id = (select auth.uid()) and public.mi_rol() = 'empresa');
create policy "empresa edita" on public.empresas for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "ofertas visibles" on public.ofertas for select
  using (estado = 'publicada' or empresa_id = (select auth.uid()));
create policy "empresa crea oferta" on public.ofertas for insert
  with check (empresa_id = (select auth.uid()));
create policy "empresa edita oferta" on public.ofertas for update
  using (empresa_id = (select auth.uid())) with check (empresa_id = (select auth.uid()));
create policy "empresa borra oferta" on public.ofertas for delete
  using (empresa_id = (select auth.uid()));

create policy "candidaturas lee" on public.candidaturas for select using (
  candidato_id = (select auth.uid())
  or exists (select 1 from public.ofertas o where o.id = oferta_id and o.empresa_id = (select auth.uid()))
);
create policy "candidato aplica" on public.candidaturas for insert with check (
  candidato_id = (select auth.uid())
  and exists (select 1 from public.ofertas o where o.id = oferta_id and o.estado = 'publicada')
);
create policy "empresa gestiona candidatura" on public.candidaturas for update using (
  exists (select 1 from public.ofertas o where o.id = oferta_id and o.empresa_id = (select auth.uid()))
);
create policy "candidato retira" on public.candidaturas for delete using (candidato_id = (select auth.uid()));

-- La empresa solo puede cambiar el estado y su nota, no la carta del candidato
revoke update on public.candidaturas from authenticated, anon;
grant update (estado, nota_empresa) on public.candidaturas to authenticated;

-- ───────────── Storage: CV en PDF (privado) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "cv sube propio" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv actualiza propio" on storage.objects for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv borra propio" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv lee propio o empresa" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.empresa_ve_candidato(((storage.foldername(name))[1])::uuid)
  ));

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.empresa_ve_candidato(uuid) from public, anon;
revoke execute on function public.mi_rol() from public, anon;
