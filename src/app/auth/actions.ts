"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const q = (s: string) => encodeURIComponent(s);

export async function iniciarSesion(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.includes("Email not confirmed")
      ? "Tienes que confirmar tu email antes de entrar. Revisa tu bandeja de entrada."
      : "Email o contraseña incorrectos.";
    redirect(`/login?error=${q(msg)}&next=${q(next)}`);
  }
  redirect(next.startsWith("/") ? next : "/");
}

export async function registrarse(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "empresa" ? "empresa" : "veterinario";
  if (password.length < 8) redirect(`/registro?error=${q("La contraseña debe tener al menos 8 caracteres.")}`);
  if (formData.get("privacidad") !== "on")
    redirect(`/registro?error=${q("Debes aceptar la política de privacidad y las condiciones de uso.")}`);

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, acepta_privacidad_at: new Date().toISOString() }, emailRedirectTo: `${origin}/auth/callback?next=/perfil` },
  });
  if (error) redirect(`/registro?error=${q(error.message)}`);
  if (data.session) redirect("/perfil");
  redirect(`/login?ok=${q("Cuenta creada. Te hemos enviado un email para confirmarla.")}`);
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
