# JDV Immo — assistant de conception

## Audit
- La route existante `src/app/immo/page.tsx` sert le catalogue immobilier.
- Les routes `src/app/immo/assistant`, `src/app/immo/plan`, `src/app/immo/projets` et dossiers `src/components/immo`, `src/lib/immo` ne sont pas présents dans la branche auditée.
- Stack observée : Next.js App Router, React, TypeScript et Supabase.

## Périmètre MVP proposé
- Route `/immo/conception`.
- Saisie texte et dictée vocale navigateur quand disponible.
- Maisons, villas, immeubles et bâtiments commerciaux.
- Paramètres du terrain, pièces/espaces, niveaux et coût indicatif par m².
- Schéma 2D conceptuel exportable en SVG, et vues 3D/façade via un moteur à intégrer.
- Estimation FCFA calculée à partir d'hypothèses affichées et modifiables, pas de prix local certifié.
- Brouillons locaux en première étape.
- Validation obligatoire par un architecte/ingénieur avant construction.

## Avant production
1. Connecter les projets à Supabase avec politiques RLS propriétaire/admin après audit.
2. Intégrer un moteur IA pour structurer le brief et poser des questions, plus un moteur 3D/façade.
3. Produire une géométrie 2D cotée cohérente et choisir les formats d'export professionnels.
4. Constituer un référentiel de prix documenté par zone, date, qualité et matériaux.
5. Ajouter revue professionnelle, annotations et versions.
6. Exécuter type-check, build, tests d'export et sécurité avant déploiement.

Aucune modification du CRM historique ou du schéma Supabase dans cette phase.