import Link from "next/link";
import { AREAS, CONTRATOS, FINES_SEMANA, PUESTOS, diasDesde, etiqueta, euros } from "@/lib/catalogos";

export type OfertaResumen = {
  id: string;
  titulo: string;
  puesto: string;
  area: string;
  provincia: string;
  municipio: string;
  tipo_contrato: string;
  salario_min: number;
  salario_max: number;
  jornada: string;
  horas_semanales: number;
  guardias: boolean;
  fines_semana: string;
  created_at: string;
  empresas: { nombre: string } | null;
};

export const CAMPOS_RESUMEN =
  "id,titulo,puesto,area,provincia,municipio,tipo_contrato,salario_min,salario_max,jornada,horas_semanales,guardias,fines_semana,created_at,empresas(nombre)";

export function Chip({ children, tono = "gris" }: { children: React.ReactNode; tono?: "gris" | "verde" | "ambar" }) {
  const t = {
    gris: "bg-stone-100 text-stone-700",
    verde: "bg-teal-50 text-teal-800",
    ambar: "bg-amber-50 text-amber-800",
  }[tono];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${t}`}>{children}</span>;
}

export function OfertaCard({ o }: { o: OfertaResumen }) {
  const dias = diasDesde(o.created_at);
  return (
    <Link
      href={`/ofertas/${o.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-teal-600 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-stone-900">{o.titulo}</h3>
          <p className="text-sm text-stone-600">
            {o.empresas?.nombre ?? "Centro"} · {o.municipio}, {o.provincia}
          </p>
        </div>
        <p className="text-right">
          <span className="block text-lg font-bold text-teal-800">
            {euros(o.salario_min)} – {euros(o.salario_max)}
          </span>
          <span className="text-xs text-stone-500">brutos/año</span>
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip>{etiqueta(PUESTOS, o.puesto)}</Chip>
        <Chip>{etiqueta(AREAS, o.area)}</Chip>
        <Chip>{etiqueta(CONTRATOS, o.tipo_contrato)}</Chip>
        <Chip>
          {o.jornada === "completa" ? "Completa" : "Parcial"} · {Number(o.horas_semanales)} h/sem
        </Chip>
        <Chip tono={o.guardias ? "ambar" : "verde"}>{o.guardias ? "Con guardias" : "Sin guardias"}</Chip>
        <Chip tono={o.fines_semana === "nunca" ? "verde" : "ambar"}>
          Findes: {etiqueta(FINES_SEMANA, o.fines_semana).toLowerCase()}
        </Chip>
      </div>
      <p className="mt-3 text-xs text-stone-400">{dias === 0 ? "Hoy" : `Hace ${dias} día${dias === 1 ? "" : "s"}`}</p>
    </Link>
  );
}
