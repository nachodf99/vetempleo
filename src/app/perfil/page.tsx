import { redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { anadirExperiencia, borrarExperiencia, guardarCandidato, guardarEmpresa } from "./actions";
import { Area, Aviso, Boton, Campo, Casillas, Seccion, Selector, SiNo } from "@/components/form";
import { AREAS, ESPECIES, JORNADAS, PERFILES, PROVINCIAS, TIPOS_CENTRO } from "@/lib/catalogos";

export default async function Perfil({ searchParams }: PageProps<"/perfil">) {
  const sp = await searchParams;
  const s = await getSesion();
  if (!s) redirect("/login?next=/perfil");
  const avisos = <Aviso error={sp.error as string} ok={sp.ok as string} />;
  return s.role === "empresa" ? (
    <PerfilEmpresa userId={s.userId} avisos={avisos} />
  ) : (
    <PerfilCandidato userId={s.userId} avisos={avisos} />
  );
}

async function PerfilCandidato({ userId, avisos }: { userId: string; avisos: React.ReactNode }) {
  const supabase = await createClient();
  const [{ data: c }, { data: exps }] = await Promise.all([
    supabase.from("candidatos").select("*").eq("id", userId).maybeSingle(),
    supabase.from("experiencias").select("*").eq("candidato_id", userId).order("fecha_inicio", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi CV</h1>
        <p className="text-stone-600">
          Las clínicas solo ven tu perfil cuando te postulas a una de sus ofertas.
        </p>
      </div>
      {avisos}
      {!c && (
        <Aviso ok="Completa tu perfil para poder postularte. Los campos con * son obligatorios." />
      )}

      <form action={guardarCandidato} className="space-y-6">
        <Seccion titulo="Datos personales">
          <Campo label="Nombre" name="nombre" required defaultValue={c?.nombre ?? ""} />
          <Campo label="Apellidos" name="apellidos" required defaultValue={c?.apellidos ?? ""} />
          <Campo label="Teléfono" name="telefono" type="tel" defaultValue={c?.telefono ?? ""} />
          <Selector label="Provincia" name="provincia" required opciones={PROVINCIAS} defaultValue={c?.provincia ?? ""} />
          <Campo label="Municipio" name="municipio" defaultValue={c?.municipio ?? ""} />
          <SiNo label="¿Dispuesto/a a cambiar de residencia?" name="dispuesto_traslado" defaultValue={c?.dispuesto_traslado} />
          <SiNo label="Carnet de conducir" name="carnet_conducir" defaultValue={c?.carnet_conducir} />
          <SiNo label="Buscando trabajo activamente" name="buscando_activamente" defaultValue={c?.buscando_activamente ?? true} />
        </Seccion>

        <Seccion titulo="Formación y colegiación">
          <Selector label="Perfil" name="perfil_profesional" required opciones={PERFILES} defaultValue={c?.perfil_profesional ?? ""} />
          <Campo label="Universidad / centro" name="universidad" defaultValue={c?.universidad ?? ""} />
          <Campo label="Año de titulación" name="anio_titulacion" type="number" min={1950} max={2100} defaultValue={c?.anio_titulacion ?? ""} />
          <Campo label="Nº de colegiado" name="num_colegiado" defaultValue={c?.num_colegiado ?? ""} />
          <Campo label="Colegio" name="colegio" placeholder="p. ej. ICOVV Valencia" defaultValue={c?.colegio ?? ""} />
          <Campo label="Idiomas" name="idiomas" placeholder="Inglés B2, …" defaultValue={c?.idiomas ?? ""} />
          <Area className="sm:col-span-2" label="Especialidades y postgrados" name="especialidades" rows={3}
            placeholder="Acreditación AVEPA en cardiología, máster en cirugía, residencia ECVIM…" defaultValue={c?.especialidades ?? ""} />
        </Seccion>

        <Seccion titulo="Experiencia y preferencias">
          <Campo label="Años de experiencia" name="anios_experiencia" type="number" min={0} required defaultValue={c?.anios_experiencia ?? 0} />
          <Campo label="Salario deseado" hint="€ brutos/año" name="salario_deseado" type="number" min={0} step={500} defaultValue={c?.salario_deseado ?? ""} />
          <Selector label="Jornada deseada" name="jornada_deseada" opciones={[...JORNADAS, { value: "indiferente", label: "Indiferente" }]} defaultValue={c?.jornada_deseada ?? ""} />
          <SiNo label="¿Aceptas guardias?" name="acepta_guardias" defaultValue={c?.acepta_guardias} />
          <Campo label="Disponibilidad" name="disponibilidad" placeholder="Inmediata, 15 días, 1 mes…" defaultValue={c?.disponibilidad ?? ""} />
          <div className="sm:col-span-2">
            <Casillas label="Áreas" name="areas" opciones={AREAS} seleccion={c?.areas ?? []} />
          </div>
          <div className="sm:col-span-2">
            <Casillas label="Especies con las que tienes experiencia" name="especies" opciones={ESPECIES} seleccion={c?.especies ?? []} />
          </div>
          <Area className="sm:col-span-2" label="Sobre ti" name="resumen" rows={5} placeholder="Qué buscas, qué te gusta, en qué destacas…" defaultValue={c?.resumen ?? ""} />
        </Seccion>

        <Seccion titulo="CV en PDF" desc="Opcional pero recomendado. Máximo 4 MB.">
          <label className="block sm:col-span-2">
            <input type="file" name="cv" accept="application/pdf" className="block text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:font-semibold file:text-teal-800" />
          </label>
          {c?.cv_path && (
            <a href={`/cv/${userId}`} target="_blank" className="text-sm font-semibold text-teal-700 underline">
              Ver CV subido
            </a>
          )}
        </Seccion>

        <div className="flex justify-end">
          <Boton type="submit">Guardar perfil</Boton>
        </div>
      </form>

      <section id="experiencia" className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Experiencia laboral</h2>
        <ul className="mt-4 divide-y divide-stone-100">
          {(exps ?? []).map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-medium">{e.puesto} · {e.centro}</p>
                <p className="text-sm text-stone-500">{e.fecha_inicio} → {e.fecha_fin ?? "actualidad"}</p>
                {e.descripcion && <p className="mt-1 text-sm text-stone-700">{e.descripcion}</p>}
              </div>
              <form action={borrarExperiencia}>
                <input type="hidden" name="id" value={e.id} />
                <button className="text-sm text-rose-700 hover:underline">Quitar</button>
              </form>
            </li>
          ))}
          {!exps?.length && <li className="py-2 text-sm text-stone-500">Aún no has añadido experiencia.</li>}
        </ul>
        <form action={anadirExperiencia} className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
          <Campo label="Puesto" name="puesto" required />
          <Campo label="Centro" name="centro" required />
          <Campo label="Desde" name="fecha_inicio" type="date" required />
          <Campo label="Hasta" hint="vacío si sigues" name="fecha_fin" type="date" />
          <Area className="sm:col-span-2" label="Qué hacías" name="descripcion" rows={2} />
          <div><Boton type="submit" variante="secundario">Añadir experiencia</Boton></div>
        </form>
      </section>
    </div>
  );
}

async function PerfilEmpresa({ userId, avisos }: { userId: string; avisos: React.ReactNode }) {
  const supabase = await createClient();
  const { data: e } = await supabase.from("empresas").select("*").eq("id", userId).maybeSingle();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi centro</h1>
        <p className="text-stone-600">Estos datos aparecen en todas tus ofertas.</p>
      </div>
      {avisos}
      <form action={guardarEmpresa} className="space-y-6">
        <Seccion titulo="Datos del centro">
          <Campo label="Nombre comercial" name="nombre" required defaultValue={e?.nombre ?? ""} />
          <Campo label="CIF" name="cif" defaultValue={e?.cif ?? ""} />
          <Selector label="Tipo de centro" name="tipo_centro" required opciones={TIPOS_CENTRO} defaultValue={e?.tipo_centro ?? ""} />
          <Campo label="Nº de empleados" name="num_empleados" type="number" min={1} defaultValue={e?.num_empleados ?? ""} />
          <Selector label="Provincia" name="provincia" required opciones={PROVINCIAS} defaultValue={e?.provincia ?? ""} />
          <Campo label="Municipio" name="municipio" defaultValue={e?.municipio ?? ""} />
          <Campo className="sm:col-span-2" label="Web" name="web" type="url" placeholder="https://" defaultValue={e?.web ?? ""} />
          <Area className="sm:col-span-2" label="Presentación" name="descripcion" defaultValue={e?.descripcion ?? ""} />
        </Seccion>
        <div className="flex justify-end">
          <Boton type="submit">Guardar</Boton>
        </div>
      </form>
    </div>
  );
}
