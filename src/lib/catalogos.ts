export type Opcion = { value: string; label: string };

const o = (pairs: Record<string, string>): Opcion[] =>
  Object.entries(pairs).map(([value, label]) => ({ value, label }));

export const PUESTOS = o({
  veterinario_generalista: "Veterinario/a generalista",
  veterinario_especialista: "Veterinario/a especialista",
  veterinario_urgencias: "Veterinario/a de urgencias",
  cirujano: "Cirujano/a",
  director_clinico: "Director/a clínico/a",
  residente_internado: "Residencia / internado",
  atv: "ATV (auxiliar técnico veterinario)",
  auxiliar: "Auxiliar",
  recepcion: "Recepción",
  inspector: "Inspección / salud pública",
  comercial_tecnico: "Técnico comercial",
  investigacion: "Investigación",
  otro: "Otro",
});

export const AREAS = o({
  pequenos_animales: "Pequeños animales",
  exoticos: "Exóticos",
  equidos: "Équidos",
  rumiantes: "Rumiantes / vacuno",
  porcino: "Porcino",
  avicola: "Avícola",
  mixta: "Mixta",
  salud_publica: "Salud pública",
  industria: "Industria / farma",
  laboratorio: "Laboratorio",
  investigacion: "Investigación",
  docencia: "Docencia",
});

export const ESPECIES = o({
  perros: "Perros",
  gatos: "Gatos",
  exoticos: "Exóticos",
  aves: "Aves",
  caballos: "Caballos",
  vacuno: "Vacuno",
  ovino_caprino: "Ovino / caprino",
  porcino: "Porcino",
  fauna_salvaje: "Fauna salvaje",
  acuicultura: "Acuicultura",
});

export const CONTRATOS = o({
  indefinido: "Indefinido",
  temporal: "Temporal",
  sustitucion: "Sustitución",
  fijo_discontinuo: "Fijo discontinuo",
  practicas: "Prácticas",
  autonomo: "Autónomo",
  mercantil: "Mercantil",
});

export const MODALIDADES = o({
  presencial: "Presencial",
  ambulante: "Ambulante (a domicilio / explotaciones)",
  hibrido: "Híbrido",
  remoto: "Remoto",
});

export const JORNADAS = o({ completa: "Completa", parcial: "Parcial" });

export const FINES_SEMANA = o({
  nunca: "Nunca",
  "1_al_mes": "1 al mes",
  "2_al_mes": "2 al mes",
  alternos: "Alternos",
  todos: "Todos",
  rotativo: "Rotativo",
});

export const EQUIPAMIENTO = o({
  rx_digital: "Rayos X digital",
  ecografo: "Ecógrafo",
  tac: "TAC",
  rm: "Resonancia",
  endoscopia: "Endoscopia",
  lab_interno: "Laboratorio interno",
  quirofano: "Quirófano",
  uci: "UCI / hospitalización",
  odontologia: "Odontología",
  fisioterapia: "Fisioterapia",
});

export const TIPOS_CENTRO = o({
  clinica: "Clínica",
  hospital: "Hospital",
  hospital_24h: "Hospital 24 h",
  ambulatoria: "Ambulatoria",
  grupo_clinicas: "Grupo de clínicas",
  industria: "Industria / farma",
  laboratorio: "Laboratorio",
  administracion: "Administración pública",
  explotacion_ganadera: "Explotación ganadera",
  otro: "Otro",
});

export const PERFILES = o({
  veterinario: "Veterinario/a",
  atv: "ATV",
  auxiliar: "Auxiliar",
  estudiante: "Estudiante",
});

export const ESTADOS_CANDIDATURA = o({
  enviada: "Enviada",
  vista: "Vista",
  en_proceso: "En proceso",
  entrevista: "Entrevista",
  descartada: "Descartada",
  contratada: "Contratada",
});

export const PROVINCIAS = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ceuta",
  "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Gipuzkoa",
  "Huelva", "Huesca", "Jaén", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid",
  "Málaga", "Melilla", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo",
  "Valencia", "Valladolid", "Bizkaia", "Zamora", "Zaragoza",
].sort((a, b) => a.localeCompare(b, "es"));

export function etiqueta(lista: Opcion[], v: string | null | undefined) {
  return lista.find((x) => x.value === v)?.label ?? v ?? "—";
}

export const euros = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";

export function diasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
