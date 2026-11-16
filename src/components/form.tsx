import type { Opcion } from "@/lib/catalogos";
import type { ReactNode } from "react";

const base =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

function Label({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <span className="text-sm font-medium text-stone-800">
      {label}
      {required && <span className="ml-0.5 text-rose-600">*</span>}
      {hint && <span className="ml-2 font-normal text-stone-500">{hint}</span>}
    </span>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  className?: string;
};

export function Campo({ label, hint, className, ...rest }: InputProps) {
  return (
    <label className={`block ${className ?? ""}`}>
      <Label label={label} required={rest.required} hint={hint} />
      <input className={base} {...rest} />
    </label>
  );
}

export function Area({
  label,
  hint,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <Label label={label} required={rest.required} hint={hint} />
      <textarea className={base} rows={4} {...rest} />
    </label>
  );
}

export function Selector({
  label,
  opciones,
  hint,
  className,
  vacio = "Selecciona…",
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  opciones: Opcion[] | string[];
  hint?: string;
  vacio?: string;
}) {
  const ops: Opcion[] = opciones.map((x) => (typeof x === "string" ? { value: x, label: x } : x));
  return (
    <label className={`block ${className ?? ""}`}>
      <Label label={label} required={rest.required} hint={hint} />
      <select className={base} {...rest}>
        <option value="">{vacio}</option>
        {ops.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Casillas({
  label,
  name,
  opciones,
  seleccion = [],
  hint,
  required,
}: {
  label: string;
  name: string;
  opciones: Opcion[];
  seleccion?: string[];
  hint?: string;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend>
        <Label label={label} required={required} hint={hint} />
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opciones.map((op) => (
          <label
            key={op.value}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900"
          >
            <input
              type="checkbox"
              name={name}
              value={op.value}
              defaultChecked={seleccion.includes(op.value)}
              className="accent-teal-700"
            />
            {op.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SiNo({
  label,
  name,
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: boolean | null;
  required?: boolean;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend>
        <Label label={label} required={required} hint={hint} />
      </legend>
      <div className="mt-2 flex gap-2">
        {[
          ["true", "Sí"],
          ["false", "No"],
        ].map(([v, l]) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-1.5 text-sm has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
          >
            <input
              type="radio"
              name={name}
              value={v}
              required={required}
              defaultChecked={defaultValue != null && String(defaultValue) === v}
              className="accent-teal-700"
            />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Seccion({ titulo, desc, children }: { titulo: string; desc?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">{titulo}</h2>
      {desc && <p className="mt-1 text-sm text-stone-600">{desc}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Boton({ children, variante = "primario", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" }) {
  const cls =
    variante === "primario"
      ? "bg-teal-700 text-white hover:bg-teal-800"
      : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50";
  return (
    <button className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${cls}`} {...rest}>
      {children}
    </button>
  );
}

export function Aviso({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${
        error ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-teal-200 bg-teal-50 text-teal-900"
      }`}
    >
      {error ?? ok}
    </div>
  );
}
