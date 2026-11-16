"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSesion } from "@/lib/supabase/server";
import { bool, errorHumano, lista, num, q, txt } from "@/lib/formdata";

const MAX_CV = 4 * 1024 * 1024;

export async function guardarCandidato(f: FormData) {
  const s = await getSesion();
  if (!s || s.role !== "veterinario") redirect("/login");
  const supabase = await createClient();

  const datos = {
    id: s.userId,
    nombre: txt(f, "nombre"),
    apellidos: txt(f, "apellidos"),
    telefono: txt(f, "telefono"),
    provincia: txt(f, "provincia"),
    municipio: txt(f, "municipio"),
    dispuesto_traslado: bool(f, "dispuesto_traslado") ?? false,
    perfil_profesional: txt(f, "perfil_profesional"),
    num_colegiado: txt(f, "num_colegiado"),
    colegio: txt(f, "colegio"),
    universidad: txt(f, "universidad"),
    anio_titulacion: num(f, "anio_titulacion"),
    anios_experiencia: num(f, "anios_experiencia") ?? 0,
    areas: lista(f, "areas"),
    especies: lista(f, "especies"),
    especialidades: txt(f, "especialidades"),
    idiomas: txt(f, "idiomas"),
    salario_deseado: num(f, "salario_deseado"),
    jornada_deseada: txt(f, "jornada_deseada"),
    acepta_guardias: bool(f, "acepta_guardias"),
    carnet_conducir: bool(f, "carnet_conducir") ?? false,
    disponibilidad: txt(f, "disponibilidad"),
    resumen: txt(f, "resumen"),
    buscando_activamente: bool(f, "buscando_activamente") ?? true,
  } as Record<string, unknown>;

  const cv = f.get("cv");
  if (cv instanceof File && cv.size > 0) {
    if (cv.type !== "application/pdf") redirect(`/perfil?error=${q("El CV debe ser un PDF.")}`);
    if (cv.size > MAX_CV) redirect(`/perfil?error=${q("El CV no puede superar 4 MB.")}`);
    const path = `${s.userId}/cv.pdf`;
    const { error } = await supabase.storage
      .from("cvs")
      .upload(path, cv, { upsert: true, contentType: "application/pdf" });
    if (error) redirect(`/perfil?error=${q("Error subiendo el CV: " + error.message)}`);
    datos.cv_path = path;
  }

  const { error } = await supabase.from("candidatos").upsert(datos);
  if (error) redirect(`/perfil?error=${q(errorHumano(error.message))}`);
  revalidatePath("/perfil");
  redirect(`/perfil?ok=${q("Perfil guardado.")}`);
}

export async function anadirExperiencia(f: FormData) {
  const s = await getSesion();
  if (!s) redirect("/login");
  const supabase = await createClient();
  const { error } = await supabase.from("experiencias").insert({
    candidato_id: s.userId,
    puesto: txt(f, "puesto"),
    centro: txt(f, "centro"),
    fecha_inicio: txt(f, "fecha_inicio"),
    fecha_fin: txt(f, "fecha_fin"),
    descripcion: txt(f, "descripcion"),
  });
  if (error)
    redirect(
      `/perfil?error=${q(
        error.message.includes("foreign key") ? "Guarda primero tus datos personales." : errorHumano(error.message),
      )}#experiencia`,
    );
  revalidatePath("/perfil");
  redirect("/perfil#experiencia");
}

export async function borrarExperiencia(f: FormData) {
  const supabase = await createClient();
  await supabase.from("experiencias").delete().eq("id", String(f.get("id")));
  revalidatePath("/perfil");
  redirect("/perfil#experiencia");
}

export async function guardarEmpresa(f: FormData) {
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  const supabase = await createClient();
  const { error } = await supabase.from("empresas").upsert({
    id: s.userId,
    nombre: txt(f, "nombre"),
    cif: txt(f, "cif"),
    tipo_centro: txt(f, "tipo_centro"),
    provincia: txt(f, "provincia"),
    municipio: txt(f, "municipio"),
    web: txt(f, "web"),
    descripcion: txt(f, "descripcion"),
    num_empleados: num(f, "num_empleados"),
  });
  if (error) redirect(`/perfil?error=${q(errorHumano(error.message))}`);
  revalidatePath("/perfil");
  redirect(`/empresa?ok=${q("Datos del centro guardados.")}`);
}
