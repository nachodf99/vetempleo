"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { emailCambioEstado } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { createClient, getSesion } from "@/lib/supabase/server";
import { errorHumano, q, txt } from "@/lib/formdata";
import { hoyISO } from "@/lib/catalogos";
import { datosOferta, validarOferta, valoresDesdeForm, type EstadoForm } from "@/lib/oferta";

async function empresaActual() {
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  return s;
}

function fallo(prev: EstadoForm, f: FormData, msg: string, campo: string | null = null): EstadoForm {
  return { error: msg, campo, valores: valoresDesdeForm(f), intento: prev.intento + 1 };
}

export async function crearOferta(prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  const s = await empresaActual();
  const supabase = await createClient();
  const { data: emp } = await supabase.from("empresas").select("id").eq("id", s.userId).maybeSingle();
  if (!emp) redirect(`/perfil?error=${q("Antes de publicar, completa los datos de tu centro.")}`);

  const borrador = !!f.get("borrador");
  const v = validarOferta(f);
  if (v) return fallo(prev, f, v.msg, v.campo);

  const { data, error } = await supabase
    .from("ofertas")
    .insert({ ...datosOferta(f), empresa_id: s.userId, estado: borrador ? "borrador" : "publicada" })
    .select("id")
    .single();
  if (error) return fallo(prev, f, errorHumano(error.message));
  revalidatePath("/ofertas");
  redirect(`/ofertas/${data.id}?ok=${q(borrador ? "Guardada como borrador." : "Oferta publicada. Estará visible 60 días.")}`);
}

export async function actualizarOferta(id: string, prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  await empresaActual();
  const v = validarOferta(f);
  if (v) return fallo(prev, f, v.msg, v.campo);
  const supabase = await createClient();
  const { error } = await supabase.from("ofertas").update(datosOferta(f)).eq("id", id);
  if (error) return fallo(prev, f, errorHumano(error.message));
  revalidatePath("/ofertas");
  revalidatePath(`/ofertas/${id}`);
  redirect(`/ofertas/${id}?ok=${q("Oferta actualizada.")}`);
}

export async function renovarOferta(f: FormData) {
  await empresaActual();
  const supabase = await createClient();
  const id = String(f.get("id"));
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 60);
  await supabase.from("ofertas").update({ expira_el: hoy.toISOString().slice(0, 10), estado: "publicada" }).eq("id", id);
  revalidatePath("/empresa");
  revalidatePath("/ofertas");
  redirect(`/empresa/ofertas/${id}?ok=${q("Oferta renovada 60 días más.")}`);
}

export async function cambiarEstadoOferta(f: FormData) {
  await empresaActual();
  const supabase = await createClient();
  const id = String(f.get("id"));
  const estado = String(f.get("estado"));
  const cambios: Record<string, string> = { estado };
  if (estado === "publicada") {
    // Reabrir una oferta caducada la renueva 60 días
    const { data } = await supabase.from("ofertas").select("expira_el").eq("id", id).single();
    if (data && data.expira_el < hoyISO()) {
      const d = new Date();
      d.setDate(d.getDate() + 60);
      cambios.expira_el = d.toISOString().slice(0, 10);
    }
  }
  await supabase.from("ofertas").update(cambios).eq("id", id);
  revalidatePath("/empresa");
  revalidatePath("/ofertas");
  redirect(`/empresa/ofertas/${id}`);
}

export async function cambiarEstadoCandidatura(f: FormData) {
  await empresaActual();
  const supabase = await createClient();
  const id = String(f.get("id"));
  const oferta = String(f.get("oferta_id"));
  const estado = String(f.get("estado"));
  const { data: antes } = await supabase
    .from("candidaturas")
    .select("estado, ofertas(titulo, empresas(nombre)), candidatos(profiles(email))")
    .eq("id", id)
    .single();
  await supabase.from("candidaturas").update({ estado, nota_empresa: txt(f, "nota_empresa") }).eq("id", id);

  if (antes && antes.estado !== estado) {
    type Fila = { ofertas: { titulo: string; empresas: { nombre: string } | null } | null; candidatos: { profiles: { email: string | null } | null } | null };
    const a = antes as unknown as Fila;
    after(() =>
      emailCambioEstado(a.candidatos?.profiles?.email ?? null, {
        oferta: a.ofertas?.titulo ?? "",
        empresa: a.ofertas?.empresas?.nombre ?? "El centro",
        estado,
      }),
    );
  }
  revalidatePath(`/empresa/ofertas/${oferta}`);
  redirect(`/empresa/ofertas/${oferta}#c-${id}`);
}
