import Link from "next/link";

export function AccountNavigation({ active }: { active: "dashboard" | "account" }) {
  return <nav className="account-navigation" aria-label="Navigation de l’espace"><Link className={active === "dashboard" ? "is-active" : ""} href="/espace">Tableau de bord</Link><Link className={active === "account" ? "is-active" : ""} href="/espace/compte">Compte et facturation</Link></nav>;
}
