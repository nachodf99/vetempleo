import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { actualizarOferta } from "@/app/empresa/actions";
import { OfertaForm } from "../../oferta-form";
import { valoresDesdeOferta } from "@/lib/oferta";

export default async function EditarOferta({ params }: PageProps<"/empresa/ofertas/[id]/editar">) {
  const { id } = await params;
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  const supabase = await createClient();
  const { data: o } = await supabase.from("ofertas").select("*").eq("id", id).maybeSingle();
  if (!o || o.empresa_id !== s.userId) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/empresa/ofertas/${id}`} className="text-sm text-teal-700">← Volver a la oferta</Link>
      <div>
        <h1 className="text-2xl font-bold">Editar oferta</h1>
        <p className="mt-1 text-stone-600">Los candidatos que ya se han postulado verán los cambios.</p>
      </div>
      <OfertaForm
        accion={actualizarOferta.bind(null, id)}
        iniciales={valoresDesdeOferta(o)}
        textoBoton="Guardar cambios"
        permitirBorrador={false}
      />
    </div>
  );
}
