import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { ESTADOS_CANDIDATURA, diasDesde, etiqueta, euros } from "@/lib/catalogos";
import { Chip } from "@/components/oferta-card";

const PASOS = ["enviada", "vista", "en_proceso", "entrevista", "contratada"];

export default async function MisCandidaturas() {
  const s = await getSesion();
  if (!s) redirect("/login?next=/mis-candidaturas");
  if (s.role !== "veterinario") redirect("/empresa");
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidaturas")
    .select("id, estado, created_at, updated_at, ofertas(id, titulo, municipio, provincia, salario_min, salario_max, plazo_respuesta_dias, empresas(nombre))")
    .eq("candidato_id", s.userId)
    .order("created_at", { ascending: false });
  type Fila = {
    id: string; estado: string; created_at: string; updated_at: string;
    ofertas: { id: string; titulo: string; municipio: string; provincia: string; salario_min: number; salario_max: number; plazo_respuesta_dias: number; empresas: { nombre: string } | null } | null;
  };
  const filas = (data ?? []) as unknown as Fila[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis candidaturas</h1>
      <div className="space-y-3">
        {filas.map((c) => {
          const o = c.ofertas;
          const idx = PASOS.indexOf(c.estado);
          const dias = diasDesde(c.created_at);
          const fueraPlazo = o && c.estado === "enviada" && dias > o.plazo_respuesta_dias;
          return (
            <article key={c.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {o ? (
                    <Link href={`/ofertas/${o.id}`} className="font-semibold text-teal-800 hover:underline">{o.titulo}</Link>
                  ) : <span className="font-semibold">Oferta eliminada</span>}
                  <p className="text-sm text-stone-600">
                    {o?.empresas?.nombre} · {o?.municipio}, {o?.provincia} · {o && `${euros(o.salario_min)} – ${euros(o.salario_max)}`}
                  </p>
                </div>
                <Chip tono={c.estado === "descartada" ? "gris" : c.estado === "contratada" ? "verde" : "ambar"}>
                  {etiqueta(ESTADOS_CANDIDATURA, c.estado)}
                </Chip>
              </div>
              {c.estado !== "descartada" && (
                <ol className="mt-4 grid grid-cols-5 gap-1">
                  {PASOS.map((p, i) => (
                    <li key={p} className="text-center">
                      <div className={`h-1.5 rounded-full ${i <= idx ? "bg-teal-600" : "bg-stone-200"}`} />
                      <span className="mt-1 block text-[11px] text-stone-500">{etiqueta(ESTADOS_CANDIDATURA, p)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-stone-500">
                Enviada hace {dias} día{dias === 1 ? "" : "s"}
                {o && ` · el centro se comprometió a responder en ${o.plazo_respuesta_dias} días`}
                {fueraPlazo && <span className="ml-1 font-semibold text-amber-700">(plazo superado)</span>}
              </p>
            </article>
          );
        })}
        {!filas.length && (
          <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
            Aún no te has postulado a ninguna oferta. <Link href="/ofertas" className="font-semibold text-teal-700">Ver ofertas</Link>
          </p>
        )}
      </div>
    </div>
  );
}
