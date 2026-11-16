import { redirect } from "next/navigation";
import { createClient, getSesion } from "@/lib/supabase/server";
import { crearOferta } from "@/app/empresa/actions";
import { Area, Aviso, Boton, Campo, Casillas, Seccion, Selector, SiNo } from "@/components/form";
import {
  AREAS, CONTRATOS, EQUIPAMIENTO, ESPECIES, FINES_SEMANA, JORNADAS, MODALIDADES, PROVINCIAS, PUESTOS,
} from "@/lib/catalogos";

export default async function NuevaOferta({ searchParams }: PageProps<"/empresa/ofertas/nueva">) {
  const sp = await searchParams;
  const s = await getSesion();
  if (!s || s.role !== "empresa") redirect("/login");
  const supabase = await createClient();
  const { data: emp } = await supabase.from("empresas").select("provincia, municipio").eq("id", s.userId).maybeSingle();
  if (!emp) redirect(`/perfil?error=${encodeURIComponent("Antes de publicar, completa los datos de tu centro.")}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Publicar oferta</h1>
        <p className="mt-1 max-w-3xl text-stone-600">
          En VetEmpleo los candidatos ven <strong>salario, horario, guardias, fines de semana y convenio</strong> antes de
          postularse. Las ofertas completas reciben candidaturas más ajustadas y menos abandonos en el proceso.
        </p>
      </div>
      <Aviso error={sp.error as string} />

      <form action={crearOferta} className="space-y-6">
        <Seccion titulo="1. El puesto">
          <Campo className="sm:col-span-2" label="Título" name="titulo" required minLength={5} maxLength={120}
            placeholder="Veterinario/a pequeños animales con interés en medicina interna" />
          <Selector label="Puesto" name="puesto" required opciones={PUESTOS} />
          <Selector label="Área" name="area" required opciones={AREAS} />
          <div className="sm:col-span-2">
            <Casillas label="Especies que se atienden" name="especies" opciones={ESPECIES} required hint="al menos una" />
          </div>
          <Selector label="Provincia" name="provincia" required opciones={PROVINCIAS} defaultValue={emp.provincia} />
          <Campo label="Municipio" name="municipio" required defaultValue={emp.municipio ?? ""} />
          <Selector label="Modalidad" name="modalidad" required opciones={MODALIDADES} defaultValue="presencial" />
          <Campo label="Fecha de incorporación" name="fecha_incorporacion" type="date" />
        </Seccion>

        <Seccion titulo="2. Salario y contrato" desc="Rango honesto: el máximo no puede superar el doble del mínimo.">
          <Campo label="Salario mínimo" hint="€ brutos/año" name="salario_min" type="number" required min={12000} step={500} />
          <Campo label="Salario máximo" hint="€ brutos/año" name="salario_max" type="number" required min={12000} step={500} />
          <Campo label="Nº de pagas" name="pagas" type="number" required min={12} max={16} defaultValue={14} />
          <Campo label="Variable / incentivos" name="salario_variable" placeholder="p. ej. 5 % de facturación propia" />
          <Selector label="Tipo de contrato" name="tipo_contrato" required opciones={CONTRATOS} />
          <Campo label="Duración (meses)" hint="si no es indefinido" name="duracion_meses" type="number" min={1} />
          <Campo label="Periodo de prueba (meses)" name="periodo_prueba_meses" type="number" required min={0} max={12} />
          <Campo label="Convenio colectivo" name="convenio" required
            placeholder="Convenio de centros y servicios veterinarios / Sin convenio" />
        </Seccion>

        <Seccion titulo="3. Horario, guardias y descanso" desc="Lo que más preguntan los veterinarios y lo que menos se publica.">
          <Selector label="Jornada" name="jornada" required opciones={JORNADAS} />
          <Campo label="Horas semanales" name="horas_semanales" type="number" required min={1} max={60} step={0.5} />
          <Campo className="sm:col-span-2" label="Horario" name="horario" required
            placeholder="L-V 9:30-14 y 17-20:30 · turnos rotativos de mañana/tarde…" />
          <Selector label="Fines de semana" name="fines_semana" required opciones={FINES_SEMANA} />
          <Campo label="Días de vacaciones" hint="laborables, mín. 22" name="dias_vacaciones" type="number" required min={22} defaultValue={22} />
          <SiNo label="¿Hay guardias?" name="guardias" required />
          <SiNo label="¿Hay nocturnidad?" name="nocturnidad" required />
          <Campo label="Guardias: cuántas y de qué tipo" hint="obligatorio si hay guardias" name="guardias_detalle"
            placeholder="2 localizadas al mes, fin de semana" />
          <Campo label="Guardias: cómo se pagan" hint="obligatorio si hay guardias" name="guardias_retribucion"
            placeholder="150 € por guardia + urgencias atendidas" />
        </Seccion>

        <Seccion titulo="4. Requisitos">
          <Campo label="Experiencia mínima (años)" name="experiencia_min_anios" type="number" required min={0} defaultValue={0} />
          <Campo label="Idiomas" name="idiomas" />
          <SiNo label="¿Colegiación obligatoria?" name="colegiacion_requerida" required defaultValue={true} />
          <SiNo label="¿Carnet de conducir?" name="carnet_requerido" required defaultValue={false} />
          <Area className="sm:col-span-2" label="Otros requisitos" name="requisitos" rows={3} />
        </Seccion>

        <Seccion titulo="5. El equipo y el centro">
          <Campo label="Veterinarios en plantilla" name="num_veterinarios" type="number" required min={0} />
          <Campo label="ATV / auxiliares en plantilla" name="num_atv" type="number" required min={0} />
          <div className="sm:col-span-2">
            <Casillas label="Equipamiento disponible" name="equipamiento" opciones={EQUIPAMIENTO} />
          </div>
          <Campo label="Presupuesto de formación anual" hint="€" name="formacion_anual_eur" type="number" min={0} step={100} />
          <div />
          <SiNo label="¿Pagáis la cuota colegial?" name="cuota_colegial_pagada" required />
          <SiNo label="¿Pagáis el seguro de RC?" name="seguro_rc_pagado" required />
          <Area className="sm:col-span-2" label="Otros beneficios" name="beneficios" rows={2}
            placeholder="Descuento en servicios para tus animales, seguro médico, parking…" />
        </Seccion>

        <Seccion titulo="6. Descripción y proceso">
          <Area className="sm:col-span-2" label="Descripción del puesto" hint="mín. 80 caracteres" name="descripcion" required minLength={80} rows={6}
            placeholder="Día a día, tipo de casos, cómo es el equipo, qué esperáis de la persona…" />
          <Area className="sm:col-span-2" label="Fases del proceso de selección" name="fases_seleccion" required rows={3}
            placeholder="1) Revisión de CV 2) Entrevista telefónica 3) Día de prueba remunerado" />
          <Campo label="Nos comprometemos a responder en (días)" name="plazo_respuesta_dias" type="number" required min={1} max={60} defaultValue={7} />
        </Seccion>

        <div className="flex justify-end gap-3">
          <Boton type="submit" name="borrador" value="1" variante="secundario">Guardar borrador</Boton>
          <Boton type="submit">Publicar oferta</Boton>
        </div>
      </form>
    </div>
  );
}
