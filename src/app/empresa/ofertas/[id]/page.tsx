import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { cambiarEstadoCandidatura, cambiarEstadoOferta } from "@/app/empresa/actions";
import { AREAS, ESPECIES, ESTADOS_CANDIDATURA, PERFILES, etiqueta, euros } from "@/lib/catalogos";
import { Boton } from "@/components/form";
import { Chip } from "@/components/oferta-card";

type Exp = { id: string; puesto: string; centro: string; fecha_inicio: string; fecha_fin: string | null };
type Cand = {
  id: string; nombre: string; apellidos: string; telefono: string | null; provincia: string;
  perfil_profesional: string; num_colegiado: string | null; colegio: string | null; anios_experiencia: number;
  areas: string[]; especies: string[]; especialidades: string | null; idiomas: string | null;
  salario_deseado: number | null; acepta_guardias: boolean | null; disponibilidad: string | null;
  resumen: string | null; cv_path: string | null; dispuesto_traslado: boolean; experiencias: Exp[];
  profiles: { email: string | null } | null;
};

export default async function CandidatosOferta({ params }: PageProps<"/empresa/ofertas/[id]">) {
  const { id } = await params;
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  const supabase = await createClient();
  const { data: o } = await supabase.from("ofertas").select("id, titulo, estado, empresa_id").eq("id", id).maybeSingle();
  if (!o || o.empresa_id !== s.userId) notFound();

  const { data } = await supabase
    .from("candidaturas")
    .select("id, estado, carta, nota_empresa, created_at, candidatos(*, profiles(email), experiencias(id, puesto, centro, fecha_inicio, fecha_fin))")
    .eq("oferta_id", id)
    .order("created_at", { ascending: false });
  const lista = (data ?? []) as unknown as { id: string; estado: string; carta: string | null; nota_empresa: string | null; created_at: string; candidatos: Cand }[];

  return (
    <div className="space-y-6">
      <Link href="/empresa" className="text-sm text-teal-700">← Mis ofertas</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{o.titulo}</h1>
          <p className="text-stone-600">{lista.length} candidatura{lista.length === 1 ? "" : "s"} · <Link className="text-teal-700" href={`/ofertas/${o.id}`}>ver oferta</Link></p>
        </div>
        <form action={cambiarEstadoOferta}>
          <input type="hidden" name="id" value={o.id} />
          <input type="hidden" name="estado" value={o.estado === "publicada" ? "cerrada" : "publicada"} />
          <Boton variante="secundario">{o.estado === "publicada" ? "Cerrar oferta" : "Publicar oferta"}</Boton>
        </form>
      </div>

      <div className="space-y-4">
        {lista.map((c) => {
          const p = c.candidatos;
          return (
            <article id={`c-${c.id}`} key={c.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{p.nombre} {p.apellidos}</h2>
                  <p className="text-sm text-stone-600">
                    {etiqueta(PERFILES, p.perfil_profesional)} · {p.anios_experiencia} años exp. · {p.provincia}
                    {p.dispuesto_traslado && " · dispuesto/a a trasladarse"}
                  </p>
                  <p className="text-sm text-stone-600">
                    {p.profiles?.email}{p.telefono && ` · ${p.telefono}`}
                    {p.num_colegiado && ` · Col. ${p.num_colegiado}${p.colegio ? ` (${p.colegio})` : ""}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <Chip tono={c.estado === "enviada" ? "ambar" : "gris"}>{etiqueta(ESTADOS_CANDIDATURA, c.estado)}</Chip>
                  <p className="mt-1 text-xs text-stone-500">{new Date(c.created_at).toLocaleDateString("es-ES")}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.areas.map((a) => <Chip key={a}>{etiqueta(AREAS, a)}</Chip>)}
                {p.especies.map((e) => <Chip key={e} tono="verde">{etiqueta(ESPECIES, e)}</Chip>)}
                {p.salario_deseado && <Chip>Pide {euros(p.salario_deseado)}</Chip>}
                {p.acepta_guardias != null && <Chip>{p.acepta_guardias ? "Acepta guardias" : "No guardias"}</Chip>}
                {p.disponibilidad && <Chip>Disponible: {p.disponibilidad}</Chip>}
              </div>

              {c.carta && <blockquote className="mt-3 border-l-4 border-teal-200 pl-3 text-sm italic text-stone-700">{c.carta}</blockquote>}
              {p.resumen && <p className="mt-3 text-sm text-stone-700">{p.resumen}</p>}
              {p.especialidades && <p className="mt-2 text-sm"><strong>Formación:</strong> {p.especialidades}</p>}
              {p.experiencias.length > 0 && (
                <ul className="mt-2 text-sm text-stone-700">
                  {p.experiencias.map((e) => (
                    <li key={e.id}>• {e.puesto} en {e.centro} ({e.fecha_inicio.slice(0, 4)}–{e.fecha_fin?.slice(0, 4) ?? "act."})</li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-stone-100 pt-4">
                {p.cv_path ? (
                  <a href={`/cv/${p.id}`} target="_blank" className="text-sm font-semibold text-teal-700 underline">Abrir CV (PDF)</a>
                ) : <span className="text-sm text-stone-400">Sin CV adjunto</span>}
                <form action={cambiarEstadoCandidatura} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="oferta_id" value={o.id} />
                  <input name="nota_empresa" defaultValue={c.nota_empresa ?? ""} placeholder="Nota interna" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                  <select name="estado" defaultValue={c.estado === "enviada" ? "vista" : c.estado} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    {ESTADOS_CANDIDATURA.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                  <Boton>Actualizar</Boton>
                </form>
              </div>
            </article>
          );
        })}
        {!lista.length && <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">Aún no hay candidaturas.</p>}
      </div>
    </div>
  );
}
