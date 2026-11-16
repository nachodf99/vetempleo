"use client";

import { useActionState, useEffect, useState } from "react";
import { Area, Aviso, Boton, Campo, Casillas, Seccion, Selector, SiNo } from "@/components/form";
import {
  AREAS, CONTRATOS, EQUIPAMIENTO, ESPECIES, FINES_SEMANA, JORNADAS, MODALIDADES, PROVINCIAS, PUESTOS,
} from "@/lib/catalogos";
import { ESTADO_INICIAL, type EstadoForm, type Valores } from "@/lib/oferta";

type Accion = (prev: EstadoForm, f: FormData) => Promise<EstadoForm>;

const SIN_DURACION = ["indefinido", "autonomo", "mercantil"];

export function OfertaForm({
  accion,
  iniciales,
  textoBoton,
  permitirBorrador = true,
}: {
  accion: Accion;
  iniciales: Valores;
  textoBoton: string;
  permitirBorrador?: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const v = estado.valores ?? iniciales;

  // Al recibir un error, lleva la vista al campo que falla
  useEffect(() => {
    if (!estado.campo) return;
    const el = document.querySelector(`[name="${estado.campo}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLElement) el.focus({ preventScroll: true });
  }, [estado]);

  return (
    // key: tras cada error se vuelve a montar con lo que el usuario había escrito
    <form key={estado.intento} action={enviar} className="space-y-6" noValidate>
      {estado.error && <Aviso error={estado.error} />}
      <Campos v={v} err={(c) => (estado.campo === c ? estado.error ?? undefined : undefined)} />
      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur">
        {permitirBorrador && (
          <Boton type="submit" name="borrador" value="1" variante="secundario" disabled={enviando}>
            Guardar borrador
          </Boton>
        )}
        <Boton type="submit" disabled={enviando}>{enviando ? "Guardando…" : textoBoton}</Boton>
      </div>
    </form>
  );
}

function Campos({ v, err }: { v: Valores; err: (c: string) => string | undefined }) {
  const s = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const arr = (k: string) => (Array.isArray(v[k]) ? (v[k] as string[]) : []);
  const [guardias, setGuardias] = useState(s("guardias") === "true");
  const [contrato, setContrato] = useState(s("tipo_contrato"));
  const conDuracion = contrato !== "" && !SIN_DURACION.includes(contrato);

  return (
    <>
      <Seccion titulo="1. El puesto">
        <Campo className="sm:col-span-2" label="Título" name="titulo" required maxLength={120} defaultValue={s("titulo")} error={err("titulo")}
          placeholder="Veterinario/a pequeños animales con interés en medicina interna" />
        <Selector label="Puesto" name="puesto" required opciones={PUESTOS} defaultValue={s("puesto")} error={err("puesto")} />
        <Selector label="Área" name="area" required opciones={AREAS} defaultValue={s("area")} error={err("area")} />
        <div className="sm:col-span-2">
          <Casillas label="Especies que se atienden" name="especies" opciones={ESPECIES} required hint="al menos una"
            seleccion={arr("especies")} error={err("especies")} />
        </div>
        <Selector label="Provincia" name="provincia" required opciones={PROVINCIAS} defaultValue={s("provincia")} error={err("provincia")} />
        <Campo label="Municipio" name="municipio" required defaultValue={s("municipio")} error={err("municipio")} />
        <Selector label="Modalidad" name="modalidad" required opciones={MODALIDADES} defaultValue={s("modalidad") || "presencial"} error={err("modalidad")} />
        <Campo label="Fecha de incorporación" name="fecha_incorporacion" type="date" defaultValue={s("fecha_incorporacion")} />
      </Seccion>

      <Seccion titulo="2. Salario y contrato" desc="Rango honesto: el máximo no puede superar el doble del mínimo.">
        <Campo label="Salario mínimo" hint="€ brutos/año" name="salario_min" type="number" required min={12000} step={500}
          defaultValue={s("salario_min")} error={err("salario_min")} />
        <Campo label="Salario máximo" hint="€ brutos/año" name="salario_max" type="number" required min={12000} step={500}
          defaultValue={s("salario_max")} error={err("salario_max")} />
        <Campo label="Nº de pagas" name="pagas" type="number" required min={12} max={16} defaultValue={s("pagas") || "14"} error={err("pagas")} />
        <Campo label="Variable / incentivos" name="salario_variable" placeholder="p. ej. 5 % de facturación propia" defaultValue={s("salario_variable")} />
        <Selector label="Tipo de contrato" name="tipo_contrato" required opciones={CONTRATOS} defaultValue={contrato}
          onChange={(e) => setContrato(e.target.value)} error={err("tipo_contrato")} />
        {conDuracion ? (
          <Campo label="Duración (meses)" name="duracion_meses" type="number" required min={1} defaultValue={s("duracion_meses")} error={err("duracion_meses")} />
        ) : <div className="hidden sm:block" />}
        <Campo label="Periodo de prueba (meses)" name="periodo_prueba_meses" type="number" required min={0} max={12}
          defaultValue={s("periodo_prueba_meses")} error={err("periodo_prueba_meses")} />
        <Campo label="Convenio colectivo" name="convenio" required defaultValue={s("convenio")} error={err("convenio")}
          placeholder="Convenio de centros y servicios veterinarios / Sin convenio" />
      </Seccion>

      <Seccion titulo="3. Horario, guardias y descanso" desc="Lo que más preguntan los veterinarios y lo que menos se publica.">
        <Selector label="Jornada" name="jornada" required opciones={JORNADAS} defaultValue={s("jornada")} error={err("jornada")} />
        <Campo label="Horas semanales" name="horas_semanales" type="number" required min={1} max={60} step={0.5}
          defaultValue={s("horas_semanales")} error={err("horas_semanales")} />
        <Campo className="sm:col-span-2" label="Horario" name="horario" required defaultValue={s("horario")} error={err("horario")}
          placeholder="L-V 9:30-14 y 17-20:30 · turnos rotativos de mañana/tarde…" />
        <Selector label="Fines de semana" name="fines_semana" required opciones={FINES_SEMANA} defaultValue={s("fines_semana")} error={err("fines_semana")} />
        <Campo label="Días de vacaciones" hint="laborables, mín. 22" name="dias_vacaciones" type="number" required min={22}
          defaultValue={s("dias_vacaciones") || "22"} error={err("dias_vacaciones")} />
        <SiNo label="¿Hay guardias?" name="guardias" required defaultValue={s("guardias") || null} onChange={setGuardias} error={err("guardias")} />
        <SiNo label="¿Hay nocturnidad?" name="nocturnidad" required defaultValue={s("nocturnidad") || null} error={err("nocturnidad")} />
        {guardias && (
          <>
            <Campo label="Guardias: cuántas y de qué tipo" name="guardias_detalle" required defaultValue={s("guardias_detalle")}
              error={err("guardias_detalle")} placeholder="2 localizadas al mes, fin de semana" />
            <Campo label="Guardias: cómo se pagan" name="guardias_retribucion" required defaultValue={s("guardias_retribucion")}
              error={err("guardias_retribucion")} placeholder="150 € por guardia + urgencias atendidas" />
          </>
        )}
      </Seccion>

      <Seccion titulo="4. Requisitos">
        <Campo label="Experiencia mínima (años)" name="experiencia_min_anios" type="number" required min={0}
          defaultValue={s("experiencia_min_anios") || "0"} error={err("experiencia_min_anios")} />
        <Campo label="Idiomas" name="idiomas" defaultValue={s("idiomas")} />
        <SiNo label="¿Colegiación obligatoria?" name="colegiacion_requerida" required defaultValue={s("colegiacion_requerida") || "true"} error={err("colegiacion_requerida")} />
        <SiNo label="¿Carnet de conducir?" name="carnet_requerido" required defaultValue={s("carnet_requerido") || "false"} error={err("carnet_requerido")} />
        <Area className="sm:col-span-2" label="Otros requisitos" name="requisitos" rows={3} defaultValue={s("requisitos")} />
      </Seccion>

      <Seccion titulo="5. El equipo y el centro">
        <Campo label="Veterinarios en plantilla" name="num_veterinarios" type="number" required min={0}
          defaultValue={s("num_veterinarios")} error={err("num_veterinarios")} />
        <Campo label="ATV / auxiliares en plantilla" name="num_atv" type="number" required min={0}
          defaultValue={s("num_atv")} error={err("num_atv")} />
        <div className="sm:col-span-2">
          <Casillas label="Equipamiento disponible" name="equipamiento" opciones={EQUIPAMIENTO} seleccion={arr("equipamiento")} />
        </div>
        <Campo label="Presupuesto de formación anual" hint="€" name="formacion_anual_eur" type="number" min={0} step={100}
          defaultValue={s("formacion_anual_eur")} />
        <div className="hidden sm:block" />
        <SiNo label="¿Pagáis la cuota colegial?" name="cuota_colegial_pagada" required defaultValue={s("cuota_colegial_pagada") || null} error={err("cuota_colegial_pagada")} />
        <SiNo label="¿Pagáis el seguro de RC?" name="seguro_rc_pagado" required defaultValue={s("seguro_rc_pagado") || null} error={err("seguro_rc_pagado")} />
        <Area className="sm:col-span-2" label="Otros beneficios" name="beneficios" rows={2} defaultValue={s("beneficios")}
          placeholder="Descuento en servicios para tus animales, seguro médico, parking…" />
      </Seccion>

      <Seccion titulo="6. Descripción y proceso">
        <Area className="sm:col-span-2" label="Descripción del puesto" hint="mín. 80 caracteres" name="descripcion" required rows={6}
          defaultValue={s("descripcion")} error={err("descripcion")}
          placeholder="Día a día, tipo de casos, cómo es el equipo, qué esperáis de la persona…" />
        <Area className="sm:col-span-2" label="Fases del proceso de selección" name="fases_seleccion" required rows={3}
          defaultValue={s("fases_seleccion")} error={err("fases_seleccion")}
          placeholder="1) Revisión de CV 2) Entrevista telefónica 3) Día de prueba remunerado" />
        <Campo label="Nos comprometemos a responder en (días)" name="plazo_respuesta_dias" type="number" required min={1} max={60}
          defaultValue={s("plazo_respuesta_dias") || "7"} error={err("plazo_respuesta_dias")} />
      </Seccion>
    </>
  );
}
