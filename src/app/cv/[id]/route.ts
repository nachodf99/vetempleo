import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Genera un enlace temporal al CV. Las políticas de Storage deciden quién puede verlo:
// el propio candidato o una empresa a cuya oferta se ha postulado.
export async function GET(request: NextRequest, ctx: RouteContext<"/cv/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(`${id}/cv.pdf`, 120);
  if (error || !data) return new NextResponse("CV no disponible", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
