export function Legal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 text-sm leading-relaxed text-stone-800 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3">
      <h1 className="mb-4 text-2xl font-bold">{titulo}</h1>
      {children}
    </article>
  );
}
