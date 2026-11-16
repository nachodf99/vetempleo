import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import {
  AREAS, CONTRATOS, EQUIPAMIENTO, ESPECIES, ESTADOS_CANDIDATURA, FINES_SEMANA, MODALIDADES, PUESTOS,
  TIPOS_CENTRO, etiqueta, euros, hoyISO,
} from "@/lib/catalogos";
import { Area, Aviso, Boton } from "@/components/form";
import { Chip } from "@/components/oferta-card";
import { postularse } from "./actions";
import { jobPosting, jsonLd } from "@/lib/jobposting";
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/ofertas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: o } = await supabase
    .from("ofertas")
    .select("titulo, municipio, provincia, salario_min, salario_max, guardias, empresas(nombre)")
    .eq("id", id)
    .maybeSingle();
  if (!o) return { title: "Oferta no encontrada · VetEmpleo" };
  const emp = (o.empresas as unknown as { nombre: string } | null)?.nombre ?? "";
  const titulo = `${o.titulo} · ${emp} · ${o.municipio}`;
  const desc = `${euros(o.salario_min)} – ${euros(o.salario_max)} brutos/año · ${o.guardias ? "con" : "sin"} guardias · ${o.municipio}, ${o.provincia}. Todas las condiciones publicadas.`;
  return { title: `${titulo} · VetEmpleo`, description: desc, openGraph: { title: titulo, description: desc } };
}

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 py-2 text-sm last:border-0">
      <dt className="text-stone-500">{k}</dt>
      <dd className="text-right font-medium text-stone-900">{v ?? "—"}</dd>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="mb-2 font-semibold">{titulo}</h2>
      <dl>{children}</dl>
    </section>
  );
}

const sino = (b: boolean | null | undefined) => (b == null ? "—" : b ? "Sí" : "No");

export default async function OfertaDetalle({ params, searchParams }: PageProps<"/ofertas/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: o }, s] = await Promise.all([
    supabase.from("ofertas").select("*, empresas(*)").eq("id", id).maybeSingle(),
    getSesion(),
  ]);
  if (!o) notFound();

  const { data: miCand } =
    s?.role === "veterinario"
      ? await supabase.from("candidaturas").select("estado, created_at").eq("oferta_id", id).eq("candidato_id", s.userId).maybeSingle()
      : { data: null };
  const esMia = s?.userId === o.empresa_id;
  const abierta = o.estado === "publicada" && o.expira_el >= hoyISO();

  return (
    <div className="space-y-6">
      {abierta && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(jobPosting(o)) }} />
      )}
      <Link href="/ofertas" className="text-sm text-teal-700">← Todas las ofertas</Link>
      <header className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{o.titulo}</h1>
            <p className="mt-1 text-stone-600">
              {o.empresas?.nombre} · {etiqueta(TIPOS_CENTRO, o.empresas?.tipo_centro)} · {o.municipio}, {o.provincia}
            </p>
            {!abierta && <p className="mt-2"><Chip tono="ambar">{o.estado === "publicada" ? "Oferta caducada" : `Oferta ${o.estado}`}</Chip></p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-800">{euros(o.salario_min)} – {euros(o.salario_max)}</p>
            <p className="text-xs text-stone-500">brutos/año en {o.pagas} pagas</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip>{etiqueta(PUESTOS, o.puesto)}</Chip>
          <Chip>{etiqueta(AREAS, o.area)}</Chip>
          <Chip>{etiqueta(CONTRATOS, o.tipo_contrato)}</Chip>
          <Chip>{etiqueta(MODALIDADES, o.modalidad)}</Chip>
          <Chip tono={o.guardias ? "ambar" : "verde"}>{o.guardias ? "Con guardias" : "Sin guardias"}</Chip>
        </div>
      </header>

      <Aviso error={sp.error as string} ok={sp.ok as string} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="mb-2 font-semibold">Descripción del puesto</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-800">{o.descripcion}</p>
            {o.requisitos && (
              <>
                <h3 className="mt-4 font-semibold">Requisitos</h3>
                <p className="whitespace-pre-line text-sm text-stone-800">{o.requisitos}</p>
              </>
            )}
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <Bloque titulo="Horario y descanso">
              <Dato k="Jornada" v={`${o.jornada === "completa" ? "Completa" : "Parcial"} · ${Number(o.horas_semanales)} h/semana`} />
              <Dato k="Horario" v={o.horario} />
              <Dato k="Fines de semana" v={etiqueta(FINES_SEMANA, o.fines_semana)} />
              <Dato k="Guardias" v={sino(o.guardias)} />
              {o.guardias && <Dato k="Cuántas" v={o.guardias_detalle} />}
              {o.guardias && <Dato k="Cómo se pagan" v={o.guardias_retribucion} />}
              <Dato k="Nocturnidad" v={sino(o.nocturnidad)} />
              <Dato k="Vacaciones" v={`${o.dias_vacaciones} días`} />
            </Bloque>
            <Bloque titulo="Contrato y salario">
              <Dato k="Tipo" v={etiqueta(CONTRATOS, o.tipo_contrato)} />
              {o.duracion_meses && <Dato k="Duración" v={`${o.duracion_meses} meses`} />}
              <Dato k="Periodo de prueba" v={`${o.periodo_prueba_meses} meses`} />
              <Dato k="Convenio" v={o.convenio} />
              <Dato k="Salario fijo" v={`${euros(o.salario_min)} – ${euros(o.salario_max)}`} />
              <Dato k="Variable" v={o.salario_variable ?? "No"} />
              <Dato k="Incorporación" v={o.fecha_incorporacion ?? "A convenir"} />
              <Dato k="Publicada hasta" v={new Date(o.expira_el).toLocaleDateString("es-ES")} />
            </Bloque>
            <Bloque titulo="El centro">
              <Dato k="Veterinarios en plantilla" v={o.num_veterinarios} />
              <Dato k="ATV / auxiliares" v={o.num_atv} />
              <Dato k="Especies" v={(o.especies as string[]).map((e) => etiqueta(ESPECIES, e)).join(", ")} />
              <Dato k="Equipamiento" v={(o.equipamiento as string[]).map((e) => etiqueta(EQUIPAMIENTO, e)).join(", ") || "—"} />
            </Bloque>
            <Bloque titulo="Requisitos y beneficios">
              <Dato k="Experiencia mínima" v={o.experiencia_min_anios ? `${o.experiencia_min_anios} años` : "Sin experiencia"} />
              <Dato k="Colegiación" v={o.colegiacion_requerida ? "Obligatoria" : "No necesaria"} />
              <Dato k="Carnet de conducir" v={o.carnet_requerido ? "Necesario" : "No"} />
              <Dato k="Idiomas" v={o.idiomas ?? "—"} />
              <Dato k="Formación anual" v={o.formacion_anual_eur ? euros(o.formacion_anual_eur) : "—"} />
              <Dato k="Cuota colegial pagada" v={sino(o.cuota_colegial_pagada)} />
              <Dato k="Seguro RC pagado" v={sino(o.seguro_rc_pagado)} />
              {o.beneficios && <Dato k="Otros" v={o.beneficios} />}
            </Bloque>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
            <h2 className="font-semibold">Proceso de selección</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{o.fases_seleccion}</p>
            <p className="mt-3 text-sm">
              <span className="font-semibold">Compromiso de respuesta:</span> {o.plazo_respuesta_dias} días
            </p>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            {esMia ? (
              <Link href={`/empresa/ofertas/${o.id}`} className="font-semibold text-teal-700">Ver candidatos →</Link>
            ) : miCand ? (
              <p className="text-sm">
                Te postulaste el {new Date(miCand.created_at).toLocaleDateString("es-ES")}. Estado:{" "}
                <strong>{etiqueta(ESTADOS_CANDIDATURA, miCand.estado)}</strong>
              </p>
            ) : s?.role === "empresa" ? (
              <p className="text-sm text-stone-600">Las cuentas de empresa no pueden postularse.</p>
            ) : !s ? (
              <div className="space-y-3 text-sm">
                <p>Crea tu perfil gratis para postularte.</p>
                <Link href={`/login?next=/ofertas/${o.id}`} className="inline-block rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Entrar y postularme</Link>
              </div>
            ) : !abierta ? (
              <p className="text-sm text-stone-600">Esta oferta ya no admite candidaturas.</p>
            ) : (
              <form action={postularse} className="space-y-3">
                <input type="hidden" name="oferta_id" value={o.id} />
                <Area label="Mensaje para el centro" hint="opcional" name="carta" rows={5} placeholder="Por qué te interesa este puesto…" />
                <p className="text-xs text-stone-500">Se enviará tu perfil, experiencia y CV.</p>
                <Boton type="submit">Postularme</Boton>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
