import Link from "next/link";
import styles from "./page.module.css";

const steps = [
  { title: "Descargá tus datos", text: "Solicita tu archivo de información desde Instagram." },
  { title: "Subí tu archivo", text: "Selecciona el ZIP exportado para comenzar el análisis." },
  { title: "Descubrí el resultado", text: "Consulta a quién sigues que no te sigue de vuelta." },
];

export default function Home() {
  return (
    <main className={styles.home}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="WhoFollows, inicio">
          <span className={styles.icon} aria-hidden="true">↗</span>
          Who<span>Follows.</span>
        </Link>
      </header>
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 id="home-title">Vos los seguís.<br /><span>¿Ellos a vos?</span></h1>
        <p className={styles.description}>Descubre quién no te sigue de vuelta en Instagram. Sube tu archivo y conoce cómo se conecta tu círculo.</p>
        <div className={styles.actions}>
          <Link href="/analizar" className={styles.primary}>Analizar archivo <span aria-hidden="true">↗</span></Link>
          <Link href="/tutorial" className={styles.secondary}><span aria-hidden="true">▷</span> Ver tutorial</Link>
        </div>
        <p className={styles.privacy}>Sin contraseñas. Tus archivos se procesan en tu navegador.</p>
      </section>
      <section className={styles.guide} aria-labelledby="steps-title">
        <h2 id="steps-title">De la duda a la respuesta.</h2>
        <p className={styles.subtitle}>Solo necesitas tu archivo de Instagram.</p>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.card}>
              <span className={styles.number}>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer className={styles.footer}>Un poco menos de misterio. Un poco más de claridad.</footer>
    </main>
  );
}
