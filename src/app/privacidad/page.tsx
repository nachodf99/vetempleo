import { Legal } from "@/components/legal";
import { TITULAR as T } from "@/lib/legal";

export const metadata = { title: "Política de privacidad · VetEmpleo" };

export default function Privacidad() {
  return (
    <Legal titulo="Política de privacidad">
      <p>Última actualización: {T.actualizado}.</p>
      <h2>1. Responsable</h2>
      <p>{T.nombre} · {T.nif} · {T.domicilio} · {T.email}</p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><strong>Candidatos:</strong> email, nombre, teléfono, ubicación, datos profesionales (colegiación, formación, experiencia, preferencias salariales y de jornada) y el CV en PDF que subas.</li>
        <li><strong>Empresas:</strong> email, datos del centro y de las ofertas publicadas.</li>
        <li>Datos técnicos imprescindibles para mantener tu sesión iniciada.</li>
      </ul>

      <h2>3. Para qué y con qué base legal</h2>
      <ul>
        <li>Gestionar tu cuenta y prestarte el servicio de búsqueda de empleo o de publicación de ofertas (ejecución del contrato, art. 6.1.b RGPD).</li>
        <li>Enviar tu perfil y CV <strong>solo a las empresas a cuyas ofertas te postules</strong> (ejecución del contrato, a petición tuya).</li>
        <li>Enviarte avisos sobre tus candidaturas u ofertas (ejecución del contrato). No enviamos publicidad.</li>
      </ul>

      <h2>4. Quién puede ver tus datos</h2>
      <p>
        Tu perfil de candidato no es público. Una empresa solo lo ve, junto con tu CV, cuando te postulas a una de sus
        ofertas. A partir de ese momento la empresa es responsable de esos datos para su proceso de selección.
      </p>
      <p>Usamos estos proveedores (encargados del tratamiento):</p>
      <ul>
        <li>Supabase (base de datos, autenticación y almacenamiento de CVs) · servidores en la UE (París).</li>
        <li>Vercel (alojamiento web) · puede tratar datos en EE. UU. con las garantías del Marco de Privacidad de Datos UE-EE. UU. y cláusulas contractuales tipo.</li>
        <li>Resend (envío de emails) · EE. UU., con las mismas garantías.</li>
      </ul>

      <h2>5. Cuánto tiempo</h2>
      <p>
        Mientras tu cuenta esté activa. Si la eliminas, borramos inmediatamente tu perfil, CV, experiencia y candidaturas.
        Las copias de seguridad técnicas se eliminan en su ciclo ordinario.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, suprimir, portar, limitar u oponerte al tratamiento de tus datos. Desde{" "}
        <a className="text-teal-700 underline" href="/cuenta">Mi cuenta</a> puedes descargar todos tus datos y borrar tu
        cuenta al instante. Para cualquier otra petición escribe a {T.email}. Si crees que no hemos atendido bien tus
        derechos puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Solo usamos cookies técnicas imprescindibles para mantener tu sesión. No usamos cookies de análisis ni de
        publicidad, por lo que no es necesario pedir consentimiento para ellas.
      </p>
    </Legal>
  );
}
