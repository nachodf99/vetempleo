"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSesion } from "@/lib/supabase/server";
import { bool, errorHumano, lista, num, q, txt } from "@/lib/formdata";

async function empresaActual() {
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  return s;
}

export async function crearOferta(f: FormData) {
  const s = await empresaActual();
  const supabase = await createClient();

  const { data: emp } = await supabase.from("empresas").select("id").eq("id", s.userId).maybeSingle();
  if (!emp) redirect(`/perfil?error=${q("Antes de publicar, completa los datos de tu centro.")}`);

  const guardias = bool(f, "guardias");
  const oferta = {
    empresa_id: s.userId,
    estado: f.get("borrador") ? "borrador" : "publicada",
    titulo: txt(f, "titulo"),
    puesto: txt(f, "puesto"),
    area: txt(f, "area"),
    especies: lista(f, "especies"),
    provincia: txt(f, "provincia"),
    municipio: txt(f, "municipio"),
    modalidad: txt(f, "modalidad"),
    tipo_contrato: txt(f, "tipo_contrato"),
    duracion_meses: num(f, "duracion_meses"),
    periodo_prueba_meses: num(f, "periodo_prueba_meses"),
    salario_min: num(f, "salario_min"),
    salario_max: num(f, "salario_max"),
    salario_variable: txt(f, "salario_variable"),
    convenio: txt(f, "convenio"),
    pagas: num(f, "pagas") ?? 14,
    jornada: txt(f, "jornada"),
    horas_semanales: num(f, "horas_semanales"),
    horario: txt(f, "horario"),
    fines_semana: txt(f, "fines_semana"),
    guardias,
    guardias_detalle: guardias ? txt(f, "guardias_detalle") : null,
    guardias_retribucion: guardias ? txt(f, "guardias_retribucion") : null,
    nocturnidad: bool(f, "nocturnidad") ?? false,
    dias_vacaciones: num(f, "dias_vacaciones"),
    experiencia_min_anios: num(f, "experiencia_min_anios") ?? 0,
    colegiacion_requerida: bool(f, "colegiacion_requerida") ?? true,
    carnet_requerido: bool(f, "carnet_requerido") ?? false,
    requisitos: txt(f, "requisitos"),
    idiomas: txt(f, "idiomas"),
    num_veterinarios: num(f, "num_veterinarios"),
    num_atv: num(f, "num_atv"),
    equipamiento: lista(f, "equipamiento"),
    formacion_anual_eur: num(f, "formacion_anual_eur"),
    cuota_colegial_pagada: bool(f, "cuota_colegial_pagada") ?? false,
    seguro_rc_pagado: bool(f, "seguro_rc_pagado") ?? false,
    beneficios: txt(f, "beneficios"),
    descripcion: txt(f, "descripcion"),
    fases_seleccion: txt(f, "fases_seleccion"),
    plazo_respuesta_dias: num(f, "plazo_respuesta_dias"),
    fecha_incorporacion: txt(f, "fecha_incorporacion"),
  };

  const { data, error } = await supabase.from("ofertas").insert(oferta).select("id").single();
  if (error) redirect(`/empresa/ofertas/nueva?error=${q(errorHumano(error.message))}`);
  revalidatePath("/ofertas");
  redirect(`/ofertas/${data.id}?ok=${q(oferta.estado === "borrador" ? "Guardada como borrador." : "Oferta publicada.")}`);
}

export async function cambiarEstadoOferta(f: FormData) {
  await empresaActual();
  const supabase = await createClient();
  const id = String(f.get("id"));
  const estado = String(f.get("estado"));
  await supabase.from("ofertas").update({ estado }).eq("id", id);
  revalidatePath("/empresa");
  revalidatePath("/ofertas");
  redirect(`/empresa/ofertas/${id}`);
}

export async function cambiarEstadoCandidatura(f: FormData) {
  await empresaActual();
  const supabase = await createClient();
  const id = String(f.get("id"));
  const oferta = String(f.get("oferta_id"));
  await supabase
    .from("candidaturas")
    .update({ estado: String(f.get("estado")), nota_empresa: txt(f, "nota_empresa") })
    .eq("id", id);
  revalidatePath(`/empresa/ofertas/${oferta}`);
  redirect(`/empresa/ofertas/${oferta}#c-${id}`);
}
