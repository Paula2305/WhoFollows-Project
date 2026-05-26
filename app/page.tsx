import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Descubre quién no te sigue de vuelta en Instagram
      </h1>
      <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Sube el ZIP que te da Instagram y te decimos a quién sigues que no te
        sigue. Tus datos nunca salen de tu navegador.
      </p>
      <Link
        href="/analizar"
        className="mt-10 inline-flex h-12 items-center rounded-full bg-zinc-900 px-6 text-base font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Analizar mi export
      </Link>
    </main>
  );
}
