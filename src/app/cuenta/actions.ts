"use server";

import { redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { q } from "@/lib/formdata";

export async function borrarCuenta(f: FormData) {
  const s = await getSesion();
  if (!s) redirect("/login");
  if (String(f.get("confirmacion") ?? "").trim().toUpperCase() !== "BORRAR")
    redirect(`/cuenta?error=${q("Escribe BORRAR para confirmar.")}`);

  const supabase = await createClient();
  // El CV vive en Storage: se borra antes que la cuenta
  await supabase.storage.from("cvs").remove([`${s.userId}/cv.pdf`]);
  const { error } = await supabase.rpc("borrar_mi_cuenta");
  if (error) redirect(`/cuenta?error=${q("No se ha podido borrar la cuenta: " + error.message)}`);
  await supabase.auth.signOut();
  redirect(`/?borrada=1`);
}
