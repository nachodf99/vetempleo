import type { Opcion } from "@/lib/catalogos";
import type { ReactNode } from "react";

const base =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-rose-500/20";

export function ErrorCampo({ error }: { error?: string }) {
  if (!error) return null;
  return <span role="alert" className="mt-1 block text-sm font-medium text-rose-700">{error}</span>;
}

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
  error?: string;
};

export function Campo({ label, hint, className, error, ...rest }: InputProps) {
  return (
    <label className={`block ${className ?? ""}`}>
      <Label label={label} required={rest.required} hint={hint} />
      <input className={base} aria-invalid={!!error} {...rest} />
      <ErrorCampo error={error} />
    </label>
  );
}

export function Area({
  label,
  hint,
  className,
  error,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <Label label={label} required={rest.required} hint={hint} />
      <textarea className={base} rows={4} aria-invalid={!!error} {...rest} />
      <ErrorCampo error={error} />
    </label>
  );
}

export function Selector({
  label,
  opciones,
  hint,
  className,
  vacio = "Selecciona…",
  error,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  opciones: Opcion[] | string[];
  hint?: string;
  vacio?: string;
  error?: string;
}) {
  const ops: Opcion[] = opciones.map((x) => (typeof x === "string" ? { value: x, label: x } : x));
  return (
    <label className={`block ${className ?? ""}`}>
      <Label label={label} required={rest.required} hint={hint} />
      <select className={base} aria-invalid={!!error} {...rest}>
        <option value="">{vacio}</option>
        {ops.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <ErrorCampo error={error} />
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
  error,
}: {
  label: string;
  name: string;
  opciones: Opcion[];
  seleccion?: string[];
  hint?: string;
  required?: boolean;
  error?: string;
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
      <ErrorCampo error={error} />
    </fieldset>
  );
}

export function SiNo({
  label,
  name,
  defaultValue,
  required,
  hint,
  error,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: boolean | string | null;
  required?: boolean;
  hint?: string;
  error?: string;
  onChange?: (v: boolean) => void;
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
              onChange={onChange ? () => onChange(v === "true") : undefined}
              className="accent-teal-700"
            />
            {l}
          </label>
        ))}
      </div>
      <ErrorCampo error={error} />
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

export function Boton({ children, variante = "primario", className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "peligro" }) {
  const cls = {
    primario: "bg-teal-700 text-white hover:bg-teal-800",
    secundario: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
    peligro: "bg-rose-700 text-white hover:bg-rose-800",
  }[variante];
  return (
    <button className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${cls} ${className ?? ""}`} {...rest}>
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
