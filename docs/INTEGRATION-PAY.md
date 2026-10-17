# JDV PAY : interface (étape 4, première branche)

## Pourquoi ces pages remplacent celles de la fondation
La fondation Rocket enregistrait des « intentions » sans pouvoir les exécuter, et son QR code était un espace réservé. Le moteur de la base (testé) sait désormais : créer les portefeuilles, transférer entre utilisateurs avec frais de 1 %, payer une demande de paiement, et refuser tout le reste. Ces pages s'appuient dessus.

## Pages fournies (à copier dans `src/`)
| Page | Fonction |
|---|---|
| `/pay` | Portefeuilles par devise, actions rapides, 6 dernières opérations. |
| `/pay/send` | Envoyer à un bénéficiaire : devis en direct (frais, total, solde, plafonds), confirmation, reçu. Remplace l'ancienne page. |
| `/pay/receive` | Créer une demande de paiement (montant fixe ou libre, durée), vrai **QR code** + lien à copier ou partager, suivi en direct (« Payée » apparaît tout seul), liste et annulation. |
| `/pay/p/[id]` | Page ouverte par le lien ou le QR : le payeur voit qui demande combien, choisit son portefeuille, voit les frais, paie. Connexion demandée si besoin, puis retour automatique. |
| `/pay/history` | Filtres (entrées / sorties, période), pagination, export CSV (séparateur « ; », virgule décimale : s'ouvre dans Excel en français). |
| `/pay/qr` | Redirige vers `/pay/receive`. |

## Installation
1. `npm i qrcode.react` (seule dépendance ajoutée ; le reste utilise ce que la fondation contient déjà).
2. Copier `src/`. Les pages utilisent les classes du projet (`jdv-card`, `btn-primary`, `text-foreground`, `bg-muted`...) : elles suivent le thème sombre ou blanc de la fondation.
3. Dans le tableau de bord, `routes.ts` pointe déjà `jdv_pay` vers `/pay`.

## Pages de la fondation qu'il faut laisser de côté pour l'instant
| Page | État réel | Recommandation |
|---|---|---|
| `/pay/beneficiaries` | Fonctionne (lecture et écriture protégées par la base). | Garder. Saisir l'email ou le téléphone **confirmé** du destinataire : c'est ce qui permet de le retrouver. |
| `/pay/bills` | **Aucun facturier en base** (0), et aucune connexion à un prestataire de paiement de factures. | Masquer le lien. |
| `/pay/transfer` (international) | Aucun taux de change en base : les virements internationaux resteraient en attente indéfiniment. | Masquer le lien. |
| `/pay/kyc` | Aucun espace de stockage n'existe pour les pièces d'identité, et aucun écran de validation par un administrateur. | Masquer le lien tant que ce n'est pas construit (voir plus bas). |
| `/pay/settings` | Non vérifiée. | À examiner. |

## Règles que l'interface applique (et que la base garantit de toute façon)
- On ne peut envoyer qu'à un **utilisateur JDV avec email ou téléphone confirmé**. Un destinataire sans compte JDV est refusé à l'écran : sinon l'envoi resterait « en attente » sans jamais partir.
- Les frais (1 %) sont payés par celui qui envoie ou qui règle une demande.
- Un paiement confirmé n'est pas annulable ; une demande non payée peut être annulée par son auteur.
- Chaque message d'erreur de la base est traduit en français clair (`payError`).

## Ce qui reste pour JDV PAY
1. **Recharge** (Mobile Money / carte via FedaPay) : fonctions prêtes en brouillon, à tester en sandbox. Tant que ce n'est pas fait, un portefeuille ne peut être alimenté que par un paiement reçu d'un autre utilisateur : **aucun utilisateur ne peut encore entrer de l'argent réel**.
2. **Retrait** vers Mobile Money / banque : non construit.
3. **Vérification d'identité (KYC)** : espace de stockage privé, téléversement, écran de validation pour les administrateurs, puis plafonds par niveau (la base les applique déjà dès que vous les définissez).
4. **Taux de change** puis virements entre devises.
5. **Factures** de services (électricité, eau...) : exige des prestataires.
6. Les 10 devises existent, mais seuls les transferts dans la **même devise** sont possibles.

## Testé / non testé
Testé : toute la logique en base (25 contrôles : devis, paiement, double paiement, solde insuffisant, expiration, annulation, mauvaise devise, montant libre, devises autres que XOF, conservation des soldes, isolation entre utilisateurs, visiteurs refusés) et les fonctions utilitaires de l'interface (traduction des erreurs, export CSV). Syntaxe de tout le code vérifiée.
Non testé : l'affichage et le parcours complet à l'écran, y compris le QR code (dépendance à installer). Essayez avec deux comptes : l'un crée une demande de 1 000 et ouvre le QR, l'autre scanne et paie.
