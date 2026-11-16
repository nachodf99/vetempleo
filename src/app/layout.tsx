import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { getSesion } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import "./globals.css";


export const metadata: Metadata = {
  title: "VetEmpleo · Empleo veterinario con todas las condiciones a la vista",
  description:
    "Ofertas de empleo veterinario con salario, guardias, fines de semana y convenio obligatorios. Sube tu CV y postúlate.",
};

async function Cabecera() {
  const s = await getSesion();
  const enlace = "rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100";
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-white">V</span>
          VetEmpleo
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link href="/ofertas" className={enlace}>Ofertas</Link>
          {!s && (
            <>
              <Link href="/login" className={enlace}>Entrar</Link>
              <Link href="/registro" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                Crear cuenta
              </Link>
            </>
          )}
          {s?.role === "veterinario" && (
            <>
              <Link href="/mis-candidaturas" className={enlace}>Mis candidaturas</Link>
              <Link href="/perfil" className={enlace}>Mi CV</Link>
            </>
          )}
          {s?.role === "empresa" && (
            <>
              <Link href="/empresa" className={enlace}>Mis ofertas</Link>
              <Link href="/empresa/ofertas/nueva" className={enlace}>Publicar oferta</Link>
              <Link href="/perfil" className={enlace}>Mi centro</Link>
            </>
          )}
          {s && (
            <form action={cerrarSesion}>
              <button className={enlace}>Salir</button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Cabecera />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
          VetEmpleo · Empleo veterinario transparente
        </footer>
      </body>
    </html>
  );
}
