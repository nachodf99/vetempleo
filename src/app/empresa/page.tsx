import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { Aviso } from "@/components/form";
import { Chip } from "@/components/oferta-card";
import { euros, hoyISO } from "@/lib/catalogos";

export default async function PanelEmpresa({ searchParams }: PageProps<"/empresa">) {
  const sp = await searchParams;
  const s = await getSesion();
  if (!s) redirect("/login?next=/empresa");
  if (s.role !== "empresa") redirect("/perfil");
  const supabase = await createClient();
  const [{ data: emp }, { data: ofertas }] = await Promise.all([
    supabase.from("empresas").select("nombre").eq("id", s.userId).maybeSingle(),
    supabase
      .from("ofertas")
      .select("id, titulo, estado, expira_el, salario_min, salario_max, municipio, created_at, candidaturas(estado)")
      .eq("empresa_id", s.userId)
      .order("created_at", { ascending: false }),
  ]);
  if (!emp) redirect(`/perfil?error=${encodeURIComponent("Completa los datos de tu centro para empezar.")}`);
  const hoy = hoyISO();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{emp.nombre}</h1>
          <p className="text-stone-600">Tus ofertas y candidatos</p>
        </div>
        <Link href="/empresa/ofertas/nueva" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          + Publicar oferta
        </Link>
      </div>
      <Aviso ok={sp.ok as string} />
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-600">
            <tr>
              <th className="px-4 py-3">Oferta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Salario</th>
              <th className="px-4 py-3 text-right">Candidatos</th>
              <th className="px-4 py-3 text-right">Nuevos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(ofertas ?? []).map((o) => {
              const c = (o.candidaturas ?? []) as { estado: string }[];
              const nuevos = c.filter((x) => x.estado === "enviada").length;
              const caducada = o.estado === "publicada" && o.expira_el < hoy;
              return (
                <tr key={o.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/empresa/ofertas/${o.id}`} className="font-medium text-teal-800 hover:underline">{o.titulo}</Link>
                    <p className="text-xs text-stone-500">{o.municipio} · {new Date(o.created_at).toLocaleDateString("es-ES")}</p>
                  </td>
                  <td className="px-4 py-3">
                    {caducada ? <Chip tono="ambar">caducada</Chip> : <Chip tono={o.estado === "publicada" ? "verde" : "gris"}>{o.estado}</Chip>}
                    {!caducada && o.estado === "publicada" && <p className="mt-1 text-xs text-stone-500">hasta {new Date(o.expira_el).toLocaleDateString("es-ES")}</p>}
                  </td>
                  <td className="px-4 py-3">{euros(o.salario_min)} – {euros(o.salario_max)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.length}</td>
                  <td className="px-4 py-3 text-right">{nuevos > 0 ? <Chip tono="ambar">{nuevos}</Chip> : "—"}</td>
                </tr>
              );
            })}
            {!ofertas?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-stone-500">Todavía no has publicado ofertas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
