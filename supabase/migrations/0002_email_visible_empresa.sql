-- La empresa puede ver el email de quien se ha postulado a sus ofertas
create policy "empresa ve email candidato" on public.profiles for select
  using (public.empresa_ve_candidato(id));
