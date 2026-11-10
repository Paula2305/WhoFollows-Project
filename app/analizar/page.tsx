"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { extractFromInput, ImportError } from "@/lib/import";
import { mergeFollowers, parseFollowers, parseFollowing, parseFollowingLinks, ParseError } from "@/lib/analyzer/parse";
import { findNonFollowers } from "@/lib/analyzer/diff";
import type { AnalysisResult } from "@/lib/analyzer/types";
import home from "../page.module.css";
import styles from "./page.module.css";

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: AnalysisResult; links: Map<string, string> }
  | { kind: "error"; message: string };

export default function AnalizarPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  const run = useCallback(async (input: File | ReadonlyArray<File> | DataTransfer) => {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: "running" });
    try {
      const { followersChunks, following } = await extractFromInput(input);
      const followersSet = mergeFollowers(followersChunks.map(parseFollowers));
      const followingSet = parseFollowing(following);
      setStatus({ kind: "done", result: findNonFollowers(followingSet, followersSet), links: parseFollowingLinks(following) });
    } catch (err) {
      setStatus({ kind: "error", message: humanError(err) });
    } finally {
      busy.current = false;
    }
  }, []);

  const reset = () => {
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className={home.home}>
      <header className={home.header}>
        <Link href="/" className={home.brand} aria-label="WhoFollows, inicio">
          <span className={home.icon} aria-hidden="true">↗</span>Who<span>Follows.</span>
        </Link>
        <Link href="/" className={styles.back}>← Volver al inicio</Link>
      </header>
      <div className={styles.content}>
        <div className={home.badge}>Tu círculo, más claro</div>
        <h1 className={styles.title}>Descubre quién <span>no te sigue.</span></h1>
        <p className={styles.intro}>Sube tu exportación de Instagram y encuentra las conexiones que no son mutuas. Sin iniciar sesión, sin compartir tu contraseña.</p>
        <div
          className={`${styles.dropzone} ${dragOver ? styles.dragOver : ""}`}
          onDragOver={(e) => { e.preventDefault(); if (!busy.current) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); void run(e.dataTransfer); }}
          aria-busy={status.kind === "running"}
        >
          <span className={styles.uploadIcon} aria-hidden="true">↑</span>
          <h2>Tu archivo. Tus conexiones.</h2>
          <p>Arrastra aquí el ZIP de Instagram o la carpeta descomprimida.</p>
          <p className={styles.fileHint}>También puedes cargar <code>followers_*.json</code> y <code>following.json</code>.</p>
          <button type="button" className={home.primary} disabled={status.kind === "running"} onClick={() => inputRef.current?.click()}>
            {status.kind === "running" ? "Analizando…" : "Elegir archivos"} <span aria-hidden="true">↗</span>
          </button>
          <input ref={inputRef} type="file" multiple accept=".zip,.json,application/zip,application/json" aria-label="Seleccionar exportación de Instagram" className="hidden"
            onChange={(e) => { const files = e.target.files; if (files?.length) void run(Array.from(files)); e.target.value = ""; }} />
        </div>
        <p className={styles.privacy}>◇ Todo se procesa en tu navegador. Tus archivos nunca se suben a un servidor.</p>
        <div role="status" aria-live="polite">{status.kind === "running" && <p className={styles.message}>Analizando tus conexiones…</p>}</div>
        {status.kind === "error" && (
          <div className={styles.error} role="alert">
            <h2>No se pudo leer la exportación</h2><p>{status.message}</p>
            <button type="button" onClick={reset} className={styles.textButton}>Intentar de nuevo ↗</button>
          </div>
        )}
        {status.kind === "done" && <Results result={status.result} links={status.links} onReset={reset} />}
      </div>
      <footer className={home.footer}>Un poco menos de misterio. Un poco más de claridad.</footer>
    </main>
  );
}

function Results({ result, links, onReset }: { result: AnalysisResult; links: Map<string, string>; onReset: () => void }) {
  const { notFollowingBack, followersCount, followingCount } = result;
  const [copyMessage, setCopyMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notFollowingBack.join("\n"));
      setCopyMessage("Listado copiado.");
    } catch {
      setCopyMessage("No se pudo copiar. Puedes descargar el listado en TXT.");
    }
  };
  const downloadTxt = () => download(`${notFollowingBack.join("\n")}\n`, "whofollows.txt", "text/plain");
  const downloadCsv = () => {
    const csv = `username\n${notFollowingBack.map((u) => `"${u.replace(/"/g, '""')}"`).join("\n")}\n`;
    download(csv, "whofollows.csv", "text/csv");
  };

  return (
    <section className={styles.results} aria-labelledby="results-title">
      <div className={styles.resultHeading}><div><p className={styles.eyebrow}>ANÁLISIS COMPLETADO</p><h2 id="results-title">Así se conecta tu círculo.</h2></div><button type="button" onClick={onReset} className={styles.textButton}>Analizar otro ↗</button></div>
      <div className={styles.stats}>
        <div><strong>{notFollowingBack.length}</strong><span>No te siguen de vuelta</span></div>
        <div><strong>{followingCount}</strong><span>Personas que sigues</span></div>
        <div><strong>{followersCount}</strong><span>Personas que te siguen</span></div>
      </div>
      <div className={styles.toolbar}>
        <h3>Tu listado</h3>
        <div className={styles.tools}>
          <button type="button" onClick={copy} disabled={!notFollowingBack.length}>Copiar</button>
          <button type="button" onClick={downloadTxt} disabled={!notFollowingBack.length}>Descargar TXT</button>
          <button type="button" onClick={downloadCsv} disabled={!notFollowingBack.length}>Descargar CSV</button>
        </div>
      </div>
      <p role="status" className={styles.copyMessage}>{copyMessage}</p>
      {notFollowingBack.length === 0 ? <p className={styles.empty}>¡Todos los que sigues te siguen de vuelta!</p> : (
        <ul className={styles.list} aria-label="Usuarios que no te siguen de vuelta">
          {notFollowingBack.map((user) => {
            const href = links.get(user);
            return (
              <li key={user}>
                <span className={styles.username}>@{user}</span>
                {href ? <a href={href} target="_blank" rel="noopener noreferrer" className={styles.profileLink} aria-label={`Ver perfil de @${user} (se abre en otra pestaña)`}>Ver perfil <span aria-hidden="true">↗</span></a> : <span className={styles.unavailable}>Sin enlace</span>}
              </li>
            );
          })}
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
      case "no-followers": return "No encontré ningún archivo followers_*.json. Asegúrate de subir la exportación completa de Instagram.";
      case "no-following": return "No encontré following.json. Asegúrate de subir la exportación completa de Instagram.";
      case "invalid-json": return err.message;
      case "empty-input": return "No se recibió ningún archivo.";
    }
  }
  if (err instanceof ParseError) return `El archivo no tiene el formato esperado: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "Error desconocido.";
}
