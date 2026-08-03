# Relief Visibility OS — site commercial

Projet séparé consacré à la présentation, à l’essai et à la commercialisation
de Relief Visibility OS. L’application d’audit principale reste indépendante.

## Fonctionnalités

- landing page premium et responsive ;
- démonstration produit interactive ;
- offres Solo, Consultant et Agence ;
- essai de 7 jours sans carte, avec 60 mesures IA ;
- compte protégé par Sign in with ChatGPT ;
- Stripe Checkout, portail client et webhooks d’abonnement vérifiés ;
- stockage D1 des demandes d’essai, comptes, abonnements et quotas ;
- vérification d’accès sécurisée pour relier l’outil principal ;
- déduplication et reprise automatique des webhooks Stripe ;
- consommation atomique des quotas par l’outil principal ;
- pages légales préparatoires.

## Démarrage local

Prérequis : Node.js `>=22.13.0`.

```bash
npm install
npm run db:generate
npm run dev
```

## Configuration

Copier `.env.example` vers `.env.local`, puis renseigner :

- l’URL de l’outil Relief ;
- l’URL publique de ce site ;
- un secret partagé pour la vérification serveur des droits d’accès ;
- un secret aléatoire d’au moins 32 caractères pour limiter les essais ;
- les clés Stripe serveur et webhook ;
- la configuration du portail client Stripe, si une configuration dédiée est utilisée ;
- les identifiants de prix Stripe des trois offres, en mensuel et annuel.

Sans ces secrets, les pages publiques restent consultables. Les actions
concernées affichent un message explicite et ne simulent ni essai, ni paiement,
ni droit d’accès.

L’outil principal peut vérifier un droit en envoyant une requête `POST` à
`/api/entitlement` avec l’en-tête
`Authorization: Bearer <RELIEF_ENTITLEMENT_API_SECRET>` et un corps JSON
`{"email":"utilisateur@entreprise.fr","action":"check"}`. L’accès à une nouvelle
mesure n’est accordé que lorsque `allowed` vaut `true`.

Pour réserver une ou plusieurs mesures avant de lancer un audit, utiliser
`{"email":"utilisateur@entreprise.fr","action":"consume","amount":1,"idempotencyKey":"audit_01J..."}`.
La clé doit rester identique lors des
tentatives d’une même opération. La consommation est atomique et idempotente :
un retry réseau ne décompte pas deux fois et deux requêtes simultanées ne
peuvent pas dépasser le quota. Le contrôle d’accès et la consommation doivent
rester côté serveur.

Le webhook Stripe doit cibler `/api/billing/webhook` et recevoir au minimum :
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`,
`invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`,
`customer.subscription.updated` et `customer.subscription.deleted`. Son mode
test ou production doit correspondre à la clé `STRIPE_SECRET_KEY`.

## Vérification

```bash
npm run build
npm test
npm run lint
```

Les textes juridiques sont une base éditoriale : l’identité légale, la TVA, la
juridiction et les coordonnées de l’éditeur doivent être validées avant toute
vente publique.
