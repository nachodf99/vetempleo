import { createClient } from "@/lib/supabase/server";
import { AREAS, CONTRATOS, JORNADAS, PROVINCIAS, PUESTOS } from "@/lib/catalogos";
import { Boton, Campo, Selector } from "@/components/form";
import { CAMPOS_RESUMEN, OfertaCard, type OfertaResumen } from "@/components/oferta-card";

export const metadata = { title: "Ofertas de empleo veterinario · VetEmpleo" };

export default async function Ofertas({ searchParams }: PageProps<"/ofertas">) {
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);

  const supabase = await createClient();
  let query = supabase
    .from("ofertas")
    .select(CAMPOS_RESUMEN)
    .eq("estado", "publicada")
    .order("created_at", { ascending: false })
    .limit(100);
  if (p("provincia")) query = query.eq("provincia", p("provincia")!);
  if (p("area")) query = query.eq("area", p("area")!);
  if (p("puesto")) query = query.eq("puesto", p("puesto")!);
  if (p("contrato")) query = query.eq("tipo_contrato", p("contrato")!);
  if (p("jornada")) query = query.eq("jornada", p("jornada")!);
  if (p("salario")) query = query.gte("salario_max", Number(p("salario")));
  if (p("sin_guardias")) query = query.eq("guardias", false);
  if (p("sin_findes")) query = query.eq("fines_semana", "nunca");
  if (p("q")) query = query.ilike("titulo", `%${p("q")!.replace(/[%_]/g, "")}%`);

  const { data, error } = await query;
  const ofertas = (data ?? []) as unknown as OfertaResumen[];

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside>
        <form className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-20">
          <h2 className="font-semibold">Filtrar</h2>
          <Campo label="Buscar" name="q" defaultValue={p("q")} placeholder="cirujano, exóticos…" />
          <Selector label="Provincia" name="provincia" opciones={PROVINCIAS} defaultValue={p("provincia")} vacio="Todas" />
          <Selector label="Área" name="area" opciones={AREAS} defaultValue={p("area")} vacio="Todas" />
          <Selector label="Puesto" name="puesto" opciones={PUESTOS} defaultValue={p("puesto")} vacio="Todos" />
          <Selector label="Contrato" name="contrato" opciones={CONTRATOS} defaultValue={p("contrato")} vacio="Todos" />
          <Selector label="Jornada" name="jornada" opciones={JORNADAS} defaultValue={p("jornada")} vacio="Todas" />
          <Campo label="Salario mínimo" hint="€/año" name="salario" type="number" step={1000} defaultValue={p("salario")} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sin_guardias" value="1" defaultChecked={!!p("sin_guardias")} className="accent-teal-700" />
            Sin guardias
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sin_findes" value="1" defaultChecked={!!p("sin_findes")} className="accent-teal-700" />
            Sin fines de semana
          </label>
          <Boton type="submit">Aplicar filtros</Boton>
        </form>
      </aside>
      <section>
        <h1 className="text-2xl font-bold">Ofertas de empleo veterinario</h1>
        <p className="mt-1 text-sm text-stone-600">
          {ofertas.length} oferta{ofertas.length === 1 ? "" : "s"} · todas con salario, horario, guardias y fines de semana publicados
        </p>
        {error && <p className="mt-4 text-sm text-rose-700">Error cargando ofertas.</p>}
        <div className="mt-6 space-y-3">
          {ofertas.map((o) => <OfertaCard key={o.id} o={o} />)}
          {!ofertas.length && !error && (
            <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
              No hay ofertas con esos filtros todavía.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
