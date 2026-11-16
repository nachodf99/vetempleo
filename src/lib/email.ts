import "server-only";
import { urlSitio } from "@/lib/sitio";

// Envío de emails con Resend (https://resend.com). Sin RESEND_API_KEY no se envía nada (útil en desarrollo).
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function enviar(para: string | null | undefined, asunto: string, parrafos: string[], boton?: { texto: string; ruta: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !para) return;
  const from = process.env.EMAIL_FROM ?? "VetEmpleo <onboarding@resend.dev>";
  const url = boton ? `${urlSitio()}${boton.ruta}` : null;
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:auto;color:#1c1917">
    <p style="font-weight:700;font-size:18px;color:#0f766e">VetEmpleo</p>
    ${parrafos.map((p) => `<p style="line-height:1.5">${p}</p>`).join("")}
    ${url ? `<p><a href="${url}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${esc(boton!.texto)}</a></p>` : ""}
    <p style="font-size:12px;color:#78716c;margin-top:32px">Recibes este email porque tienes una cuenta en VetEmpleo.</p>
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [para], subject: asunto, html }),
    });
    if (!res.ok) console.error("Resend", res.status, await res.text());
  } catch (e) {
    console.error("Error enviando email", e);
  }
}

export function emailNuevaCandidatura(para: string | null, d: { oferta: string; ofertaId: string; candidato: string }) {
  return enviar(
    para,
    `Nueva candidatura: ${d.oferta}`,
    [`<strong>${esc(d.candidato)}</strong> se ha postulado a tu oferta <strong>${esc(d.oferta)}</strong>.`,
     "Recuerda que te comprometiste a responder en el plazo indicado en la oferta."],
    { texto: "Ver candidatos", ruta: `/empresa/ofertas/${d.ofertaId}` },
  );
}

const TEXTO_ESTADO: Record<string, string> = {
  vista: "El centro ha visto tu candidatura.",
  en_proceso: "Tu candidatura sigue adelante en el proceso de selección.",
  entrevista: "¡El centro quiere entrevistarte! Se pondrá en contacto contigo.",
  descartada: "El centro ha decidido seguir con otros candidatos. ¡Mucho ánimo con las siguientes!",
  contratada: "¡Enhorabuena! El centro ha marcado tu candidatura como contratada.",
};

export function emailCambioEstado(para: string | null, d: { oferta: string; empresa: string; estado: string }) {
  const texto = TEXTO_ESTADO[d.estado];
  if (!texto) return Promise.resolve();
  return enviar(
    para,
    `${d.empresa}: novedades sobre tu candidatura`,
    [`Oferta: <strong>${esc(d.oferta)}</strong> en ${esc(d.empresa)}.`, texto],
    { texto: "Ver mis candidaturas", ruta: "/mis-candidaturas" },
  );
}
