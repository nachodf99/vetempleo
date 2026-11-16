import Link from "next/link";
import { iniciarSesion } from "@/app/auth/actions";
import { Aviso, Boton, Campo } from "@/components/form";

export default async function Login({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <form action={iniciarSesion} className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
        <Aviso error={sp.error as string} ok={sp.ok as string} />
        <input type="hidden" name="next" value={(sp.next as string) ?? ""} />
        <Campo label="Email" name="email" type="email" required autoComplete="email" />
        <Campo label="Contraseña" name="password" type="password" required autoComplete="current-password" />
        <Boton type="submit">Entrar</Boton>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        ¿No tienes cuenta? <Link href="/registro" className="font-semibold text-teal-700">Crear cuenta</Link>
      </p>
    </div>
  );
}
