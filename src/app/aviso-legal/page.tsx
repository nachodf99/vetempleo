import { Legal } from "@/components/legal";
import { TITULAR as T } from "@/lib/legal";

export const metadata = { title: "Aviso legal · VetEmpleo" };

export default function AvisoLegal() {
  return (
    <Legal titulo="Aviso legal y condiciones de uso">
      <h2>Titular</h2>
      <p>En cumplimiento de la Ley 34/2002 (LSSI): {T.nombre} · {T.nif} · {T.domicilio} · {T.email}</p>
      <h2>Objeto</h2>
      <p>
        VetEmpleo es una plataforma que pone en contacto a profesionales del sector veterinario con centros y empresas
        que buscan personal. VetEmpleo no es parte de los procesos de selección ni de las relaciones laborales que surjan.
      </p>
      <h2>Obligaciones de las empresas</h2>
      <ul>
        <li>Publicar ofertas reales, con condiciones veraces y conformes a la normativa laboral y al convenio aplicable.</li>
        <li>No publicar ofertas discriminatorias (art. 4 y 17 del Estatuto de los Trabajadores).</li>
        <li>Usar los datos de los candidatos solo para el proceso de selección de la oferta correspondiente.</li>
      </ul>
      <h2>Obligaciones de los candidatos</h2>
      <p>Aportar información veraz sobre su formación, colegiación y experiencia.</p>
      <h2>Retirada de contenidos</h2>
      <p>Podemos retirar ofertas o cuentas que incumplan estas condiciones.</p>
      <h2>Ley aplicable</h2>
      <p>Legislación española.</p>
    </Legal>
  );
}
