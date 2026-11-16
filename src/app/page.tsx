import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CAMPOS_RESUMEN, OfertaCard, type OfertaResumen } from "@/components/oferta-card";

const OBLIGATORIOS = [
  ["Salario en rango real", "Mínimo y máximo brutos, sin «según valía»."],
  ["Guardias y cómo se pagan", "Cuántas al mes, presenciales o localizadas, y a cuánto."],
  ["Fines de semana", "Nunca, alternos, uno al mes… dicho antes de la entrevista."],
  ["Horario y horas", "Horas semanales y horario real, no «jornada completa»."],
  ["Convenio y vacaciones", "Convenio aplicable, pagas, días de vacaciones y periodo de prueba."],
  ["Equipo y medios", "Cuántos veterinarios y ATV, y con qué equipamiento trabajarás."],
  ["Proceso y plazo", "Fases de selección y compromiso de respuesta en días."],
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ofertas")
    .select(CAMPOS_RESUMEN)
    .eq("estado", "publicada")
    .order("created_at", { ascending: false })
    .limit(5);
  const ofertas = (data ?? []) as unknown as OfertaResumen[];

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 py-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Empleo veterinario</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Sabes el sueldo, las guardias y los findes <span className="text-teal-700">antes</span> de postularte.
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            VetEmpleo reúne a veterinarios, ATV y centros en un solo sitio. Ninguna oferta se publica sin las condiciones
            que de verdad importan.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ofertas" className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">Ver ofertas</Link>
            <Link href="/registro?rol=empresa" className="rounded-lg border border-stone-300 bg-white px-5 py-3 font-semibold hover:bg-stone-50">Publicar como centro</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold">Toda oferta incluye, obligatoriamente:</h2>
          <ul className="mt-4 space-y-3">
            {OBLIGATORIOS.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-700 text-xs text-white">✓</span>
                <span><strong className="text-sm">{t}.</strong> <span className="text-sm text-stone-600">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Últimas ofertas</h2>
          <Link href="/ofertas" className="text-sm font-semibold text-teal-700">Ver todas →</Link>
        </div>
        <div className="mt-4 space-y-3">
          {ofertas.map((o) => <OfertaCard key={o.id} o={o} />)}
          {!ofertas.length && (
            <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
              Aún no hay ofertas publicadas. <Link href="/registro?rol=empresa" className="font-semibold text-teal-700">¿Eres un centro? Publica la primera.</Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
