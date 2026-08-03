import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rejoindre un espace",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const valid = /^[a-f0-9]{64}$/i.test(token) && params.status !== "invalid";
  return (
    <main className="signup-page">
      <header>
        <Link href="/">
          <Image
            src="/relief-visibility-os-lockup-on-dark.png"
            alt="Relief Visibility OS"
            width={626}
            height={141}
            priority
            unoptimized
          />
        </Link>
      </header>
      <section className="verification-shell">
        <div className="signup-card verification-card">
          <p className="signup-step">Invitation d’équipe</p>
          <h1>{valid ? "Rejoignez l’espace Relief." : "Cette invitation n’est plus valide."}</h1>
          {valid ? (
            <>
              <p>Indiquez votre nom pour créer votre accès personnel à l’espace partagé.</p>
              <form className="signup-form" action="/api/team/accept" method="post">
                <input name="token" type="hidden" value={token} />
                <label>
                  Nom et prénom
                  <input name="fullName" minLength={2} required autoComplete="name" />
                </label>
                <button className="button button-hero" type="submit">
                  Rejoindre l’espace
                </button>
              </form>
            </>
          ) : (
            <p>Demandez au propriétaire de l’espace de vous envoyer une nouvelle invitation.</p>
          )}
        </div>
      </section>
    </main>
  );
}
