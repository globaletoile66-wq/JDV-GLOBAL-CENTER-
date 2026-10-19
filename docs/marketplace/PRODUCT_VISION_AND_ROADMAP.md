# JDV Marketplace — Vision produit et feuille de route

## Vision
Construire une marketplace panafricaine qui combine la facilité de création de boutique, la force du commerce B2B, les outils d'exploitation e-commerce et la découverte communautaire. JDV s'inspire de mécanismes éprouvés de plateformes comme Chariow, Alibaba, Shopify et Etsy sans recopier leur interface ni dépendre de leurs modèles économiques.

## Principes non négociables
- Le catalogue public affiche uniquement les offres réellement publiées et autorisées.
- Aucune fausse annonce, note, remise, disponibilité ou statistique n'est créée pour remplir l'interface.
- Les boutiques et les produits sont rattachés à leur propriétaire; les écritures sont contrôlées par Supabase RLS et par les fonctions métier.
- Les statuts de vérification, les commissions, les notes, les ventes et les données financières sont des champs système; un vendeur ne peut pas s'auto-vérifier ou s'auto-activer.
- L'espace du concepteur reste privé. JDV CORE n'est pas un module commercial public.
- Les paiements ne sont déclarés opérationnels qu'après intégration et tests avec les prestataires concernés.
- Le parcours doit fonctionner sur mobile et rester utilisable avec une connexion limitée.

## Expérience publique
- Page d'accueil attractive avec recherche, catégories, offres mises en avant seulement si elles existent, boutiques et appels à l'action « Acheter » / « Ouvrir ma boutique ».
- Recherche par titre, description, tags et catégorie.
- Fiche produit avec photos, prix et devise, variantes, stock, vendeur, conditions et avis publiés.
- Page publique de boutique avec identité, catalogue et informations autorisées.
- État vide explicite et utile qui invite les vendeurs à publier leur première offre sans afficher de faux produits.
- Favoris et partage; avis réservés aux acheteurs éligibles lorsque la règle d'achat vérifié est disponible.

## Parcours vendeur
1. Création de compte ou connexion.
2. Création d'une boutique personnelle; une organisation est facultative.
3. Statut initial pending, sans possibilité pour le vendeur de modifier lui-même les champs système.
4. Compléter identité, contacts, pays, zone de livraison, présentation et conditions de vente.
5. Créer une offre: titre, descriptions, catégorie, photos, prix/devise, SKU, variantes, inventaire, produit physique/numérique ou service.
6. Enregistrer en brouillon, soumettre à vérification, publier après autorisation.
7. Tableau de bord: annonces, commandes, stock, retours, messages, commissions, paiements dus et rapports.
8. Gestion de la vitrine: logo, couverture, URL, description, horaires, moyens de contact et liens de partage.

## Parcours acheteur
1. Découvrir et filtrer les offres.
2. Voir la boutique et les détails du vendeur.
3. Poser une question ou demander un devis pour les achats professionnels.
4. Ajouter au panier et contrôler la quantité, les variantes, le stock, les frais et l'adresse.
5. Créer une commande de manière atomique et idempotente côté serveur.
6. Payer via un prestataire effectivement configuré (Mobile Money, carte ou autre moyen autorisé).
7. Suivre l'expédition, confirmer la livraison, demander un retour ou ouvrir un litige selon les règles.
8. Laisser un avis uniquement selon les règles d'éligibilité.

## Différenciation JDV à construire progressivement
- Assistant de création de boutique et d'annonces avec IA, toujours validé par le vendeur.
- Commerce hybride: vente au détail, vente en gros, devis, quantités minimales et prix par palier.
- Achats groupés avec seuil, échéance et remboursement explicite si le seuil échoue.
- Réputation vérifiable: identité validée, commandes honorées, délais et avis confirmés.
- Livraison adaptée au pays: adresse par repère, retrait, point relais, livreur ou expédition vendeur.
- Promotions, coupons, fidélité et affiliation avec attribution transparente.
- Découverte par vidéos courtes et démonstrations qui renvoient vers des offres achetables.
- Interface multilingue, devises localisées et architecture de paiement multi-pays.

## Phasage et critères de sortie
### Phase 1 — Découverte publique
- Accueil Marketplace moderne, CTA vendeur, recherche, filtres et états vides.
- Lien Marketplace depuis la page publique JDV.
- RLS publique en lecture seule limitée aux annonces publiées.
- Sortie: build validé, navigation testée, aucune fuite d'annonce brouillon.

### Phase 2 — Boutique et publication
- Création de boutique personnelle, réglages, médias et pages publiques.
- Modération/validation vendeur et publication contrôlée.
- Sortie: un utilisateur standard peut créer une boutique sans organisation; impossible de s'auto-activer ou de contourner la validation.

### Phase 3 — Catalogue vendeur
- Création/édition des produits, médias, SKU, variantes, inventaire et statut.
- Sortie: règles de propriété testées et disponibilité affichée cohérente avec le stock.

### Phase 4 — Transaction complète
- Panier, commandes multi-vendeurs, calcul serveur des totaux, paiement, commissions, expédition, annulation, retours, remboursements et litiges.
- Sortie: tests de bout en bout avec paiement de test; idempotence et journal d'audit vérifiés.

### Phase 5 — Croissance
- Promotions, coupons, avis vérifiés, messagerie, fidélité, affiliation, rapports et outils B2B.
- Sortie: événements mesurés à partir de données réelles et règles anti-abus vérifiées.

### Phase 6 — Innovation
- Assistant IA, achats groupés, vidéos, recommandations et expansion multi-pays.
- Sortie: chaque fonctionnalité est testée, mesurable, accessible sur mobile et sans promesse non tenue.

## Indicateurs
- Visiteurs du catalogue, recherche sans résultat, clics sur fiches produits.
- Boutiques commencées et terminées, délai jusqu'à la première annonce publiée.
- Offres actives, ajout au panier, commandes payées et livrées.
- Taux de retour, annulations, litiges et délais de livraison.
- Réachat, rétention vendeur et satisfaction acheteur.
- Revenus et commissions uniquement à partir de transactions validées.

## État de départ vérifié (2026-10-19)
- 10 catégories actives dans Supabase.
- 0 annonce au total et 0 annonce publiée: le catalogue est vide parce qu'aucune annonce n'est présente.
- La politique RLS publique de lecture autorise seulement les annonces au statut published.
- La création de boutique existante est réservée aux utilisateurs connectés et crée une boutique au statut pending; le contrôle d'activation doit rester côté serveur.
- La présence de code ne vaut pas validation de bout en bout: build, parcours de commande, intégrations de paiement et déploiement doivent être vérifiés séparément.
