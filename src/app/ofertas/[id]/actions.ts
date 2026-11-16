"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSesion } from "@/lib/supabase/server";
import { errorHumano, q, txt } from "@/lib/formdata";

export async function postularse(f: FormData) {
  const ofertaId = String(f.get("oferta_id"));
  const s = await getSesion();
  if (!s) redirect(`/login?next=/ofertas/${ofertaId}`);
  if (s.role !== "veterinario") redirect(`/ofertas/${ofertaId}`);
  const supabase = await createClient();
  const { data: c } = await supabase.from("candidatos").select("id").eq("id", s.userId).maybeSingle();
  if (!c) redirect(`/perfil?error=${q("Completa tu perfil antes de postularte.")}`);
  const { error } = await supabase
    .from("candidaturas")
    .insert({ oferta_id: ofertaId, candidato_id: s.userId, carta: txt(f, "carta") });
  if (error) redirect(`/ofertas/${ofertaId}?error=${q(errorHumano(error.message))}`);
  revalidatePath(`/ofertas/${ofertaId}`);
  redirect(`/ofertas/${ofertaId}?ok=${q("¡Candidatura enviada! Puedes seguir su estado en Mis candidaturas.")}`);
}
