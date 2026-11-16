import Link from "next/link";
import { registrarse } from "@/app/auth/actions";
import { Aviso, Boton, Campo } from "@/components/form";

export default async function Registro({ searchParams }: PageProps<"/registro">) {
  const sp = await searchParams;
  const rol = sp.rol === "empresa" ? "empresa" : "veterinario";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <form action={registrarse} className="mt-6 space-y-5 rounded-2xl border border-stone-200 bg-white p-6">
        <Aviso error={sp.error as string} />
        <fieldset>
          <legend className="text-sm font-medium">¿Quién eres?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ["veterinario", "Busco trabajo", "Veterinario/a, ATV, auxiliar…"],
              ["empresa", "Contrato", "Clínica, hospital, empresa…"],
            ].map(([v, t, d]) => (
              <label key={v} className="cursor-pointer rounded-xl border border-stone-300 p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                <input type="radio" name="role" value={v} defaultChecked={rol === v} className="sr-only" />
                <span className="block font-semibold">{t}</span>
                <span className="block text-xs text-stone-600">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Campo label="Email" name="email" type="email" required autoComplete="email" />
        <Campo label="Contraseña" name="password" type="password" required minLength={8} hint="mín. 8 caracteres" autoComplete="new-password" />
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="privacidad" required className="mt-1 accent-teal-700" />
          <span>
            He leído y acepto la <Link href="/privacidad" target="_blank" className="text-teal-700 underline">política de privacidad</Link> y
            las <Link href="/aviso-legal" target="_blank" className="text-teal-700 underline">condiciones de uso</Link>.
          </span>
        </label>
        <Boton type="submit">Crear cuenta</Boton>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-teal-700">Entrar</Link>
      </p>
    </div>
  );
}
