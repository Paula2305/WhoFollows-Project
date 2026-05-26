"use client";

import { useCallback, useRef, useState } from "react";
import {
  extractFromInput,
  ImportError,
} from "@/lib/import";
import { mergeFollowers, parseFollowers, parseFollowing, ParseError } from "@/lib/analyzer/parse";
import { findNonFollowers } from "@/lib/analyzer/diff";
import type { AnalysisResult } from "@/lib/analyzer/types";

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: AnalysisResult }
  | { kind: "error"; message: string };

export default function AnalizarPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useCallback(
    async (input: File | ReadonlyArray<File> | DataTransfer) => {
      setStatus({ kind: "running" });
      setCopied(false);
      try {
        const { followersChunks, following } = await extractFromInput(input);
        const followersSet = mergeFollowers(
          followersChunks.map(parseFollowers),
        );
        const followingSet = parseFollowing(following);
        const result = findNonFollowers(followingSet, followersSet);
        setStatus({ kind: "done", result });
      } catch (err) {
        setStatus({ kind: "error", message: humanError(err) });
      }
    },
    [],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      void run(e.dataTransfer);
    },
    [run],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list || list.length === 0) return;
      void run(Array.from(list));
    },
    [run],
  );

  const reset = () => {
    setStatus({ kind: "idle" });
    setCopied(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          ¿Quién no te sigue de vuelta?
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Sube tu export de Instagram (ZIP o carpeta) y te decimos a quién
          sigues que no te sigue. Todo se procesa en tu navegador: tus archivos
          nunca se suben a ningún servidor.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-8 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
              : "border-zinc-300 dark:border-zinc-700"
          }`}
        >
          <p className="text-base font-medium">
            Arrastra aquí el ZIP de Instagram o la carpeta descomprimida
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            También vale soltar directamente los archivos{" "}
            <code className="font-mono">followers_*.json</code> y{" "}
            <code className="font-mono">following.json</code>
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            O elegir archivos
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".zip,.json,application/zip,application/json"
            onChange={onPick}
            className="hidden"
          />
        </div>

        {status.kind === "running" && (
          <p className="mt-6 text-sm text-zinc-500">Analizando…</p>
        )}

        {status.kind === "error" && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <p className="font-medium">No pude leer el export</p>
            <p className="mt-1">{status.message}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 text-sm underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {status.kind === "done" && (
          <Results result={status.result} onReset={reset} copied={copied} setCopied={setCopied} />
        )}
      </div>
    </main>
  );
}

function Results({
  result,
  onReset,
  copied,
  setCopied,
}: {
  result: AnalysisResult;
  onReset: () => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
}) {
  const { notFollowingBack, followersCount, followingCount } = result;

  const copy = async () => {
    await navigator.clipboard.writeText(notFollowingBack.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    download(
      `${notFollowingBack.join("\n")}\n`,
      "whofollows.txt",
      "text/plain",
    );
  };

  const downloadCsv = () => {
    const csv = `username\n${notFollowingBack
      .map((u) => `"${u.replace(/"/g, '""')}"`)
      .join("\n")}\n`;
    download(csv, "whofollows.csv", "text/csv");
  };

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <h2 className="text-2xl font-semibold">
          {notFollowingBack.length}{" "}
          <span className="text-zinc-500 font-normal">
            {notFollowingBack.length === 1
              ? "no te sigue"
              : "no te siguen"}
          </span>
        </h2>
        <p className="text-sm text-zinc-500">
          Sigues a {followingCount} · Te siguen {followersCount}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={notFollowingBack.length === 0}
          className="h-9 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
        <button
          type="button"
          onClick={downloadTxt}
          disabled={notFollowingBack.length === 0}
          className="h-9 rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Descargar TXT
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={notFollowingBack.length === 0}
          className="h-9 rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Descargar CSV
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-full px-4 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Analizar otro
        </button>
      </div>

      {notFollowingBack.length === 0 ? (
        <p className="mt-6 text-zinc-500">
          Todos los que sigues te siguen de vuelta.
        </p>
      ) : (
        <ul className="mt-6 max-h-[480px] overflow-y-auto rounded-lg border border-zinc-200 divide-y divide-zinc-200 dark:border-zinc-800 dark:divide-zinc-800">
          {notFollowingBack.map((user) => (
            <li
              key={user}
              className="px-4 py-2 font-mono text-sm"
            >
              <a
                href={`https://instagram.com/${encodeURIComponent(user)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{user}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function humanError(err: unknown): string {
  if (err instanceof ImportError) {
    switch (err.code) {
      case "no-followers":
        return "No encontré ningún archivo followers_*.json. Asegúrate de subir el export completo de Instagram.";
      case "no-following":
        return "No encontré following.json. Asegúrate de subir el export completo de Instagram.";
      case "invalid-json":
        return err.message;
      case "empty-input":
        return "No se recibió ningún archivo.";
    }
  }
  if (err instanceof ParseError) {
    return `El archivo no tiene el formato esperado: ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido.";
}
