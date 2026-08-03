import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link href="/">
          <Image
            src="/relief-visibility-os-lockup.png"
            alt="Relief Visibility OS"
            width={994}
            height={369}
            unoptimized
          />
        </Link>
        <Link href="/">Retour au site</Link>
      </header>
      <article>
        <span className="section-index">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="legal-date">Version préparatoire · 26 juillet 2026</p>
        <div className="legal-content">{children}</div>
      </article>
    </main>
  );
}
