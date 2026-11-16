import { redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { crearOferta } from "@/app/empresa/actions";
import { OfertaForm } from "../oferta-form";
import { valoresDesdeOferta, type Valores } from "@/lib/oferta";

export default async function NuevaOferta({ searchParams }: PageProps<"/empresa/ofertas/nueva">) {
  const sp = await searchParams;
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  const supabase = await createClient();
  const { data: emp } = await supabase.from("empresas").select("provincia, municipio").eq("id", s.userId).maybeSingle();
  if (!emp) redirect(`/perfil?error=${encodeURIComponent("Antes de publicar, completa los datos de tu centro.")}`);

  let iniciales: Valores = { provincia: emp.provincia, municipio: emp.municipio ?? "" };
  const desde = typeof sp.desde === "string" ? sp.desde : null;
  if (desde) {
    const { data: o } = await supabase.from("ofertas").select("*").eq("id", desde).eq("empresa_id", s.userId).maybeSingle();
    if (o) {
      iniciales = valoresDesdeOferta(o);
      for (const k of ["id", "created_at", "updated_at", "expira_el", "estado", "empresa_id"]) delete iniciales[k];
      iniciales.titulo = `${o.titulo} (copia)`.slice(0, 120);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{desde ? "Duplicar oferta" : "Publicar oferta"}</h1>
        <p className="mt-1 max-w-3xl text-stone-600">
          En VetEmpleo los candidatos ven <strong>salario, horario, guardias, fines de semana y convenio</strong> antes de
          postularse. Las ofertas completas reciben candidaturas más ajustadas y menos abandonos en el proceso. Se publican
          durante 60 días y puedes renovarlas.
        </p>
      </div>
      <OfertaForm accion={crearOferta} iniciales={iniciales} textoBoton="Publicar oferta" />
    </div>
  );
}
