import { redirect } from "next/navigation";
import { getSesion } from "@/lib/supabase/server";
import { borrarCuenta } from "./actions";
import { Aviso, Boton, Campo } from "@/components/form";

export const metadata = { title: "Mi cuenta · VetEmpleo" };

export default async function Cuenta({ searchParams }: PageProps<"/cuenta">) {
  const sp = await searchParams;
  const s = await getSesion();
  if (!s) redirect("/login?next=/cuenta");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="text-stone-600">{s.email} · {s.role === "empresa" ? "Empresa" : "Candidato/a"}</p>
      </div>
      <Aviso error={sp.error as string} />

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold">Descargar mis datos</h2>
        <p className="mt-1 text-sm text-stone-600">
          Un archivo JSON con todo lo que guardamos sobre ti{s.role === "empresa" ? ", tus ofertas y las candidaturas recibidas" : " y tus candidaturas"}.
        </p>
        <a href="/cuenta/exportar" className="mt-4 inline-block rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50">
          Descargar
        </a>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-white p-6">
        <h2 className="font-semibold text-rose-800">Eliminar mi cuenta</h2>
        <p className="mt-1 text-sm text-stone-600">
          {s.role === "empresa"
            ? "Se borrarán tu centro, todas tus ofertas y las candidaturas recibidas. No se puede deshacer."
            : "Se borrarán tu perfil, tu CV, tu experiencia y todas tus candidaturas. No se puede deshacer."}
        </p>
        <form action={borrarCuenta} className="mt-4 flex flex-wrap items-end gap-3">
          <Campo label="Escribe BORRAR para confirmar" name="confirmacion" required autoComplete="off" />
          <Boton variante="peligro">Eliminar definitivamente</Boton>
        </form>
      </section>
    </div>
  );
}
