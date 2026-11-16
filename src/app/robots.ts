import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  // Solo se indexa producción; los despliegues de preview (rama dev) no
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/perfil", "/empresa", "/mis-candidaturas", "/cuenta", "/cv/", "/auth/"] },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
