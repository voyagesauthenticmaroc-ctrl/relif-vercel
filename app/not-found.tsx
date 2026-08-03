import Image from "next/image";
import Link from "next/link";
import styles from "./recovery.module.css";

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          className={styles.logo}
          src="/relief-visibility-os-lockup-on-dark.png"
          alt="Relief Visibility OS"
          width={626}
          height={141}
          unoptimized
          priority
        />
        <span className={styles.eyebrow}>Erreur 404</span>
        <h1 className={styles.title}>Cette page n’existe pas.</h1>
        <p className={styles.copy}>
          Le lien a peut-être changé. Retrouvez la présentation de Relief ou
          accédez directement à votre espace.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            Découvrir Relief
          </Link>
          <Link className={styles.secondary} href="/espace">
            Ouvrir mon espace
          </Link>
        </div>
      </section>
    </main>
  );
}
