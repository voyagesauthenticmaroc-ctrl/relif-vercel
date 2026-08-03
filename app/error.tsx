"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./recovery.module.css";

export default function ErrorPage({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert">
        <Image
          className={styles.logo}
          src="/relief-visibility-os-lockup-on-dark.png"
          alt="Relief Visibility OS"
          width={626}
          height={141}
          unoptimized
          priority
        />
        <span className={styles.eyebrow}>Incident temporaire</span>
        <h1 className={styles.title}>Cette page n’a pas pu se charger.</h1>
        <p className={styles.copy}>
          Vos données n’ont pas été modifiées. Vous pouvez relancer la page ou
          revenir à l’accueil.
        </p>
        <div className={styles.actions}>
          <button
            className={styles.primary}
            type="button"
            onClick={() => reset()}
          >
            Réessayer
          </button>
          <Link className={styles.secondary} href="/">
            Retour à l’accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
