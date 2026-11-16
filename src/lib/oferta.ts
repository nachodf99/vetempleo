import { bool, lista, num, txt } from "@/lib/formdata";

export type Valores = Record<string, string | string[]>;
export type EstadoForm = { error: string | null; campo: string | null; valores: Valores | null; intento: number };
export const ESTADO_INICIAL: EstadoForm = { error: null, campo: null, valores: null, intento: 0 };

const MULTIPLES = ["especies", "equipamiento"];

export function valoresDesdeForm(f: FormData): Valores {
  const v: Valores = {};
  for (const [k, val] of f.entries()) {
    if (k.startsWith("$") || typeof val !== "string") continue;
    if (MULTIPLES.includes(k)) v[k] = [...((v[k] as string[]) ?? []), val];
    else v[k] = val;
  }
  return v;
}

/** Convierte una fila de la BD en valores de formulario (para editar o duplicar) */
export function valoresDesdeOferta(o: Record<string, unknown>): Valores {
  const v: Valores = {};
  for (const [k, val] of Object.entries(o)) {
    if (val == null) continue;
    if (Array.isArray(val)) v[k] = val.map(String);
    else v[k] = String(val);
  }
  return v;
}

const OBLIGATORIOS: [string, string][] = [
  ["titulo", "el título"], ["puesto", "el puesto"], ["area", "el área"], ["provincia", "la provincia"],
  ["municipio", "el municipio"], ["modalidad", "la modalidad"], ["salario_min", "el salario mínimo"],
  ["salario_max", "el salario máximo"], ["pagas", "el número de pagas"], ["tipo_contrato", "el tipo de contrato"],
  ["periodo_prueba_meses", "el periodo de prueba"], ["convenio", "el convenio"], ["jornada", "la jornada"],
  ["horas_semanales", "las horas semanales"], ["horario", "el horario"], ["fines_semana", "los fines de semana"],
  ["dias_vacaciones", "los días de vacaciones"], ["guardias", "si hay guardias"], ["nocturnidad", "si hay nocturnidad"],
  ["experiencia_min_anios", "la experiencia mínima"], ["colegiacion_requerida", "si exige colegiación"],
  ["carnet_requerido", "si exige carnet"], ["num_veterinarios", "los veterinarios en plantilla"],
  ["num_atv", "los ATV en plantilla"], ["cuota_colegial_pagada", "si pagáis la cuota colegial"],
  ["seguro_rc_pagado", "si pagáis el seguro de RC"], ["descripcion", "la descripción"],
  ["fases_seleccion", "las fases del proceso"], ["plazo_respuesta_dias", "el plazo de respuesta"],
];

export function validarOferta(f: FormData): { campo: string; msg: string } | null {
  for (const [k, nombre] of OBLIGATORIOS) if (txt(f, k) == null) return { campo: k, msg: `Falta ${nombre}.` };
  const titulo = txt(f, "titulo")!;
  if (titulo.length < 5 || titulo.length > 120) return { campo: "titulo", msg: "El título debe tener entre 5 y 120 caracteres." };
  if (lista(f, "especies").length === 0) return { campo: "especies", msg: "Selecciona al menos una especie." };
  const min = num(f, "salario_min")!, max = num(f, "salario_max")!;
  if (min < 12000) return { campo: "salario_min", msg: "El salario mínimo debe ser al menos 12.000 € brutos/año." };
  if (max < min) return { campo: "salario_max", msg: "El salario máximo no puede ser menor que el mínimo." };
  if (max > min * 2) return { campo: "salario_max", msg: `Rango demasiado amplio: con un mínimo de ${min.toLocaleString("es-ES")} €, el máximo puede ser como mucho ${(min * 2).toLocaleString("es-ES")} €.` };
  const contrato = txt(f, "tipo_contrato")!;
  if (!["indefinido", "autonomo", "mercantil"].includes(contrato) && num(f, "duracion_meses") == null)
    return { campo: "duracion_meses", msg: "Indica la duración en meses de este contrato." };
  if (bool(f, "guardias")) {
    if (!txt(f, "guardias_detalle")) return { campo: "guardias_detalle", msg: "Explica cuántas guardias y de qué tipo." };
    if (!txt(f, "guardias_retribucion")) return { campo: "guardias_retribucion", msg: "Explica cómo se pagan las guardias." };
  }
  const h = num(f, "horas_semanales")!;
  if (h < 1 || h > 60) return { campo: "horas_semanales", msg: "Las horas semanales deben estar entre 1 y 60." };
  if (num(f, "dias_vacaciones")! < 22) return { campo: "dias_vacaciones", msg: "Las vacaciones no pueden ser menos de 22 días laborables." };
  const pp = num(f, "periodo_prueba_meses")!;
  if (pp < 0 || pp > 12) return { campo: "periodo_prueba_meses", msg: "El periodo de prueba debe estar entre 0 y 12 meses." };
  if (txt(f, "descripcion")!.length < 80) return { campo: "descripcion", msg: "La descripción debe tener al menos 80 caracteres." };
  const plazo = num(f, "plazo_respuesta_dias")!;
  if (plazo < 1 || plazo > 60) return { campo: "plazo_respuesta_dias", msg: "El plazo de respuesta debe estar entre 1 y 60 días." };
  return null;
}

export function datosOferta(f: FormData) {
  const guardias = bool(f, "guardias");
  const contrato = txt(f, "tipo_contrato");
  return {
    titulo: txt(f, "titulo"),
    puesto: txt(f, "puesto"),
    area: txt(f, "area"),
    especies: lista(f, "especies"),
    provincia: txt(f, "provincia"),
    municipio: txt(f, "municipio"),
    modalidad: txt(f, "modalidad"),
    tipo_contrato: contrato,
    duracion_meses: ["indefinido", "autonomo", "mercantil"].includes(contrato ?? "") ? null : num(f, "duracion_meses"),
    periodo_prueba_meses: num(f, "periodo_prueba_meses"),
    salario_min: num(f, "salario_min"),
    salario_max: num(f, "salario_max"),
    salario_variable: txt(f, "salario_variable"),
    convenio: txt(f, "convenio"),
    pagas: num(f, "pagas") ?? 14,
    jornada: txt(f, "jornada"),
    horas_semanales: num(f, "horas_semanales"),
    horario: txt(f, "horario"),
    fines_semana: txt(f, "fines_semana"),
    guardias,
    guardias_detalle: guardias ? txt(f, "guardias_detalle") : null,
    guardias_retribucion: guardias ? txt(f, "guardias_retribucion") : null,
    nocturnidad: bool(f, "nocturnidad") ?? false,
    dias_vacaciones: num(f, "dias_vacaciones"),
    experiencia_min_anios: num(f, "experiencia_min_anios") ?? 0,
    colegiacion_requerida: bool(f, "colegiacion_requerida") ?? true,
    carnet_requerido: bool(f, "carnet_requerido") ?? false,
    requisitos: txt(f, "requisitos"),
    idiomas: txt(f, "idiomas"),
    num_veterinarios: num(f, "num_veterinarios"),
    num_atv: num(f, "num_atv"),
    equipamiento: lista(f, "equipamiento"),
    formacion_anual_eur: num(f, "formacion_anual_eur"),
    cuota_colegial_pagada: bool(f, "cuota_colegial_pagada") ?? false,
    seguro_rc_pagado: bool(f, "seguro_rc_pagado") ?? false,
    beneficios: txt(f, "beneficios"),
    descripcion: txt(f, "descripcion"),
    fases_seleccion: txt(f, "fases_seleccion"),
    plazo_respuesta_dias: num(f, "plazo_respuesta_dias"),
    fecha_incorporacion: txt(f, "fecha_incorporacion"),
  };
}
