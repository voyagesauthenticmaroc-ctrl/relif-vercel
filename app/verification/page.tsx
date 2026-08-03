import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confirmer mon adresse",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const validShape = /^[a-f0-9]{64}$/i.test(token);
  return (
    <main className="signup-page">
      <header>
        <Link href="/">
          <Image src="/relief-visibility-os-lockup-on-dark.png" alt="Relief Visibility OS" width={626} height={141} priority unoptimized />
        </Link>
      </header>
      <section className="verification-shell">
        <div className="signup-card verification-card">
          <p className="signup-step">Adresse vérifiée en un clic</p>
          <h1>{validShape ? "Votre espace vous attend." : "Ce lien n’est plus valide."}</h1>
          {validShape ? (
            <>
              <p>Confirmez l’ouverture de votre espace Relief. Le lien ne sera consommé qu’après cette action.</p>
              <form action="/api/auth/verify" method="post">
                <input name="token" type="hidden" value={token} />
                <button className="button button-hero" type="submit">Confirmer et ouvrir mon espace</button>
              </form>
            </>
          ) : (
            <><p>Il a peut-être expiré ou déjà été utilisé. Demandez simplement un nouveau lien.</p><Link className="button button-hero" href="/connexion">Recevoir un nouveau lien</Link></>
          )}
        </div>
      </section>
    </main>
  );
}
