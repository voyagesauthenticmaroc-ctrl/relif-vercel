import Image from "next/image";
import styles from "./loading.module.css";

export default function AccountLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-live="polite">
      <div className={styles.shell}>
        <Image
          className={styles.logo}
          src="/relief-visibility-os-lockup-on-dark.png"
          alt="Relief Visibility OS"
          width={626}
          height={141}
          unoptimized
          priority
        />
        <p className={styles.status}>Chargement de votre espace…</p>
        <div className={styles.grid} aria-hidden="true">
          <section className={styles.panel}>
            <div className={styles.line} />
            <div className={`${styles.line} ${styles.lineShort}`} />
            <div className={styles.metric} />
          </section>
          <section className={styles.panel}>
            <div className={styles.line} />
            <div className={`${styles.line} ${styles.lineShort}`} />
            <div className={styles.metric} />
          </section>
        </div>
      </div>
    </main>
  );
}
