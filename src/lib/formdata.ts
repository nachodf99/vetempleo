// Utilidades para leer FormData de forma tipada
export const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};
export const num = (f: FormData, k: string) => {
  const v = txt(f, k);
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
export const bool = (f: FormData, k: string) => {
  const v = f.get(k);
  if (v === "true" || v === "on") return true;
  if (v === "false") return false;
  return null;
};
export const lista = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);

export const q = (s: string) => encodeURIComponent(s);

// Traduce errores de restricciones de Postgres a mensajes humanos
export function errorHumano(msg: string) {
  const mapa: Record<string, string> = {
    salario_rango: "El salario máximo debe ser ≥ al mínimo y no más del doble (rangos honestos).",
    salario_min: "El salario mínimo debe ser al menos 12.000 € brutos/año.",
    duracion_si_temporal: "Indica la duración en meses para contratos no indefinidos.",
    guardias_explicadas: "Si hay guardias, explica cuántas y cómo se pagan.",
    dias_vacaciones: "Las vacaciones no pueden ser menos de 22 días laborables.",
    descripcion: "La descripción debe tener al menos 80 caracteres.",
    especies: "Selecciona al menos una especie.",
    titulo: "El título debe tener entre 5 y 120 caracteres.",
    duplicate: "Ya te has postulado a esta oferta.",
  };
  for (const [k, v] of Object.entries(mapa)) if (msg.includes(k)) return v;
  if (msg.includes("not-null")) return "Faltan campos obligatorios.";
  return "No se ha podido guardar: " + msg;
}
