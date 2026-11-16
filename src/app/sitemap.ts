import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { hoyISO } from "@/lib/catalogos";
import { urlSitio } from "@/lib/sitio";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlSitio();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { data } = await supabase
    .from("ofertas")
    .select("id, updated_at")
    .eq("estado", "publicada")
    .gte("expira_el", hoyISO())
    .limit(5000);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/ofertas`, changeFrequency: "hourly", priority: 0.9 },
    ...(data ?? []).map((o) => ({ url: `${base}/ofertas/${o.id}`, lastModified: o.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
