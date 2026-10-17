# Vérification d'identité (KYC)

## Parcours
**Utilisateur** (`/pay/kyc`) : ajoute la pièce d'identité (recto) et un selfie avec la pièce (obligatoires), éventuellement le verso et un justificatif de domicile, puis clique « Envoyer mon dossier ». Il suit son statut : à compléter, en cours d'examen, vérifiée, refusée (avec le motif), expirée.
**Administrateur** (`/super-admin/kyc`) : voit les dossiers à examiner, ouvre chaque pièce (lien valable 2 minutes, consultation enregistrée), puis valide (niveau et durée) ou refuse (motif obligatoire). L'utilisateur est notifié dans les deux cas.
**Effet** : les plafonds de `transaction_limits` s'appliquent selon le niveau (non vérifié, basique, vérifié, renforcé). Une vérification expirée ramène au niveau « non vérifié ».

## Installation
1. Copier `src/` (pages `/pay/kyc` et `/super-admin/kyc`, bibliothèque `lib/kyc/files.ts`). La page `/pay/kyc` remplace celle de la fondation Rocket.
2. Ajouter un lien « Vérification d'identité » vers `/pay/kyc` et, dans le menu super admin, vers `/super-admin/kyc`. Le tableau de bord pointe déjà vers `/pay/kyc` dans sa liste « Pour bien démarrer ».
3. La base est déjà prête (espace de stockage privé, règles, fonctions).

## Sécurité en place (testée)
- Les pièces sont dans un espace **privé** : jamais d'adresse publique ; l'administrateur n'obtient qu'un lien temporaire de 2 minutes.
- Chacun ne dépose que dans son propre dossier ; 20 fichiers maximum ; 5 Mo, images et PDF uniquement.
- Un utilisateur ne peut ni voir les pièces d'un autre, ni modifier son propre niveau ou statut, ni valider quoi que ce soit.
- Chaque consultation d'une pièce par un administrateur et chaque décision sont écrites dans le journal d'audit.

## Décisions qui vous appartiennent
1. **Plafonds par niveau** : **aucun plafond n'est défini aujourd'hui** (table vide). Tant que c'est le cas, personne n'est limité, vérifié ou non. Il faut fixer, par niveau et par devise, un maximum par opération, par jour et par mois. Exemple de structure, à adapter : « non vérifié » petit montant, « vérifié » plus élevé, « renforcé » le plus haut. Dites-moi les montants et je les enregistre.
2. **Qui valide** : seuls les super admins actifs peuvent examiner (un seul compte actif aujourd'hui). Prévoyez au moins deux personnes pour éviter le blocage.
3. **Conservation et protection des données** : une pièce d'identité est une donnée très sensible. Faites valider avec un juriste la durée de conservation, la mention d'information donnée aux utilisateurs et les obligations de déclaration applicables dans votre pays. Aujourd'hui, les pièces sont conservées sans limite de durée et l'utilisateur ne peut pas les supprimer lui-même.
4. **Niveaux** : j'ai défini « basique » (pièce vérifiée), « vérifié » (pièce et selfie, valeur par défaut) et « renforcé » (avec justificatif de domicile). Ajustez si votre politique est différente.

## Non couvert
- Une vérification automatique par un prestataire spécialisé (reconnaissance de la pièce, détection de fraude) : l'examen est manuel.
- La montée de niveau après une première validation (par exemple ajouter un justificatif pour passer à « renforcé ») : il faut pour l'instant redéposer un dossier complet après expiration.
- La suppression des pièces à la demande de l'utilisateur ou après une durée fixée.

## Testé / non testé
Testé : toute la base (30 contrôles : isolation du stockage, quota, chemins falsifiés, fichier absent, type invalide, envoi incomplet, modification pendant l'examen, droits d'administrateur, consultation journalisée, refus sans motif, refus puis nouveau dépôt, validation, double validation, tentative de modification directe du niveau, plafonds avant et après expiration, isolation entre utilisateurs) et les contrôles de fichiers de l'interface ; syntaxe de tout le code.
Non testé : l'affichage, le téléversement réel d'un fichier depuis un navigateur et l'aperçu des images et PDF par l'administrateur. Essayez avec un compte test et une vraie photo.
