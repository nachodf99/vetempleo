import { CONTRATOS, FINES_SEMANA, etiqueta } from "@/lib/catalogos";
import { urlSitio } from "@/lib/sitio";

type Oferta = Record<string, unknown> & {
  id: string; titulo: string; descripcion: string; created_at: string; expira_el: string; jornada: string;
  tipo_contrato: string; provincia: string; municipio: string; salario_min: number; salario_max: number;
  experiencia_min_anios: number; horas_semanales: number; horario: string; fines_semana: string; guardias: boolean;
  guardias_detalle: string | null; dias_vacaciones: number; convenio: string; modalidad: string;
  empresas: { nombre: string; web: string | null } | null;
};

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Datos estructurados schema.org/JobPosting para que la oferta aparezca en Google for Jobs */
export function jobPosting(o: Oferta) {
  const tipos = new Set<string>([o.jornada === "parcial" ? "PART_TIME" : "FULL_TIME"]);
  if (["temporal", "sustitucion", "fijo_discontinuo"].includes(o.tipo_contrato)) tipos.add("TEMPORARY");
  if (o.tipo_contrato === "practicas") tipos.add("INTERN");
  if (["autonomo", "mercantil"].includes(o.tipo_contrato)) tipos.add("CONTRACTOR");

  const condiciones = [
    `Contrato: ${etiqueta(CONTRATOS, o.tipo_contrato)}`,
    `Salario: ${o.salario_min.toLocaleString("es-ES")} – ${o.salario_max.toLocaleString("es-ES")} € brutos/año`,
    `Jornada: ${Number(o.horas_semanales)} h/semana · ${o.horario}`,
    `Fines de semana: ${etiqueta(FINES_SEMANA, o.fines_semana)}`,
    `Guardias: ${o.guardias ? (o.guardias_detalle ?? "sí") : "no"}`,
    `Vacaciones: ${o.dias_vacaciones} días`,
    `Convenio: ${o.convenio}`,
  ];

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: o.titulo,
    description: `<p>${esc(o.descripcion).replace(/\n/g, "<br>")}</p><ul>${condiciones.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`,
    datePosted: o.created_at.slice(0, 10),
    validThrough: `${o.expira_el}T23:59:59+01:00`,
    employmentType: [...tipos],
    identifier: { "@type": "PropertyValue", name: "VetEmpleo", value: o.id },
    hiringOrganization: {
      "@type": "Organization",
      name: o.empresas?.nombre ?? "Centro veterinario",
      ...(o.empresas?.web ? { sameAs: o.empresas.web } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: o.municipio, addressRegion: o.provincia, addressCountry: "ES" },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: { "@type": "QuantitativeValue", minValue: o.salario_min, maxValue: o.salario_max, unitText: "YEAR" },
    },
    directApply: true,
    url: `${urlSitio()}/ofertas/${o.id}`,
  };
  if (o.experiencia_min_anios > 0)
    data.experienceRequirements = { "@type": "OccupationalExperienceRequirements", monthsOfExperience: o.experiencia_min_anios * 12 };
  if (o.modalidad === "remoto") {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "ES" };
  }
  return data;
}

export const jsonLd = (d: unknown) => JSON.stringify(d).replace(/</g, "\\u003c");
