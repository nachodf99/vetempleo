import { NextResponse } from "next/server";
import { createClient, getSesion } from "@/lib/supabase/server";

// Derecho de acceso y portabilidad (arts. 15 y 20 RGPD)
export async function GET() {
  const s = await getSesion();
  if (!s) return new NextResponse("No autenticado", { status: 401 });
  const supabase = await createClient();
  const perfil = await supabase.from("profiles").select("*").eq("id", s.userId).single();

  let datos: Record<string, unknown>;
  if (s.role === "empresa") {
    const [empresa, ofertas] = await Promise.all([
      supabase.from("empresas").select("*").eq("id", s.userId).maybeSingle(),
      supabase.from("ofertas").select("*, candidaturas(id, estado, created_at)").eq("empresa_id", s.userId),
    ]);
    datos = { cuenta: perfil.data, empresa: empresa.data, ofertas: ofertas.data };
  } else {
    const [candidato, experiencias, candidaturas] = await Promise.all([
      supabase.from("candidatos").select("*").eq("id", s.userId).maybeSingle(),
      supabase.from("experiencias").select("*").eq("candidato_id", s.userId),
      supabase.from("candidaturas").select("*, ofertas(titulo)").eq("candidato_id", s.userId),
    ]);
    datos = { cuenta: perfil.data, perfil: candidato.data, experiencias: experiencias.data, candidaturas: candidaturas.data };
  }
  return new NextResponse(JSON.stringify({ exportado: new Date().toISOString(), ...datos }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vetempleo-mis-datos.json"`,
    },
  });
}
