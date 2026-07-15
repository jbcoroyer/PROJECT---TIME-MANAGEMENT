# WorkSpace — Refonte « Atelier » : handoff Cursor

> Colle ce fichier dans le repo (`docs/REDESIGN-ATELIER.md`) et donne à Cursor le prompt en bas de page.
> Contenu du pack :
> - `maquettes/` — les 4 maquettes HTML de référence (Landing, Pricing, Login, Dashboard), ouvrables dans un navigateur. Tout le style est inline — c'est la source de vérité pour chaque valeur.
> - `screenshots/` — captures des 4 pages (hero + sections landing/pricing) à joindre à Cursor comme référence visuelle. Note : le grain papier n'apparaît pas sur les captures (limite de l'export) — il est bien dans les maquettes HTML et doit être implémenté (§1.3).

---

## 1. Direction artistique « Atelier »

Éditorial premium sur papier chaud. Grand serif à empattements avec italiques accentuées, mono en kickers, grain papier sur toute la surface, orange terre cuite comme unique couleur de marque. Beaucoup de filets (`1px`), de numérotation (`N°01`, `01…11`) et de rythme typographique — peu de cartes, peu d'ombres.

### 1.1 Typographie (Google Fonts)

| Rôle | Fonte | Usage |
|---|---|---|
| Display | **Instrument Serif** (400, + italic) | H1–H3, wordmark, chiffres clés, titres de colonnes kanban. Jamais en gras : la taille fait le travail. Mots-clés en `<em>` italique orange. |
| Texte / UI | **Instrument Sans** (400–700) | Paragraphes, boutons, nav de l'app, cartes. |
| Mono | **Spline Sans Mono** (400, 500) | Kickers (`N°01 — …`), numéros, labels uppercase `letter-spacing: 0.14–0.18em`, métadonnées de cartes, compteurs. |

Import : `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap`

Échelle indicative : H1 landing `clamp(3.5rem, 8.5vw, 7.5rem)` / `line-height: 0.98` ; H2 `clamp(2.4rem, 4.5vw, 3.6rem)` ; H1 app `38px` ; kickers `11–12px`.

### 1.2 Couleurs (remplacer les tokens de `app/globals.css`)

```css
:root {
  --background: #f6f1e7;        /* papier chaud */
  --surface: #fdfaf3;           /* cartes / inputs */
  --surface-deep: #efe8da;      /* bandeaux, marquee */
  --ink: #1a1611;               /* encre — texte, CTA, blocs sombres */
  --ink-muted: rgba(26,22,17,0.6);
  --line: rgba(26,22,17,0.14);  /* filets — 0.10 subtil / 0.18–0.25 fort */
  --accent: #c25e2a;            /* orange terre cuite — unique accent */
  --accent-on-dark: #e08a52;    /* orange sur fond encre */
  --success: #3e7d52;  --warning: #b07320;  --danger: #b4453f;
  /* pastilles modules (fonds oklch(0.93 0.04-0.06 H), pictos assortis) */
  --tint-teal: oklch(0.5 0.1 190);   --tint-violet: oklch(0.5 0.12 300);
  --tint-yellow: oklch(0.55 0.13 90); --tint-pink: oklch(0.52 0.15 350);
  --tint-blue: oklch(0.5 0.11 230);
}
```

Règles : fond sombre = toujours `--ink` (jamais de gris) ; orange réservé aux accents (italiques, pastilles, hovers, ✦) — jamais en fond de section ; sémantique (retard/48h/priorités) inchangée.

### 1.3 Texture grain (obligatoire, sur toutes les pages)

Overlay fixe au-dessus du fond, sous le contenu :

```css
.grain {
  position: fixed; inset: 0; pointer-events: none; z-index: 1;
  opacity: 0.5; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.5 0 0 0 0 0.42 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

Variante fonds sombres : `feColorMatrix` valeurs claires (voir maquettes), `opacity: 0.4`, sans blend-mode. Halo d'ambiance : radial orange `oklch(0.8 0.11 55 / 0.5)` flouté 90px, animé (dérive lente 18s).

### 1.4 Formes & matière

- Boutons : pilule (`border-radius: 100px`), CTA encre → hover orange + `translateY(-2px)`. Flèche `→` en mono.
- Cartes : `border-radius: 16–22px`, bord `--line`, fond `--surface`, ombre quasi nulle au repos ; hover `0 18px 36px rgba(26,22,17,0.12)` + légère rotation (`-0.4deg` sur les cartes kanban).
- Listes éditoriales plutôt que grilles de cartes : rangées séparées par filets, numéro mono à gauche (cf. section modules de la landing).
- Logo : cercle encre + étoile 8 branches orange (`clip-path`), rotation continue 24s.
- Séparateur décoratif : `✦` orange.

### 1.5 Motion

Easing global `cubic-bezier(0.22, 0.61, 0.36, 1)`.

| Pattern | Détail |
|---|---|
| Hero reveal | Lignes du H1 masquées (`overflow:hidden`) + `translateY(40px)→0`, `0.9s`, stagger `0.15s` ; kicker en fade ; filet horizontal `scaleX(0→1)` |
| Scroll reveal | IntersectionObserver, `opacity 0→1` + `translateY(34px)→0`, `0.8s`, threshold `0.12`, une seule fois |
| Marquee | Bande mono uppercase défilante (contenu dupliqué, `translateX(0→-50%)`, 28s linear infinite) |
| Cartes kanban | Entrée `translateY(14px)` staggée 50ms ; hover lift + rotation |
| Étoile logo | `rotate 360°` 24s linear infinite |
| Respect | Tout sous `@media (prefers-reduced-motion: no-preference)` |

---

## 2. Fichiers du repo à modifier

| Fichier | Quoi faire |
|---|---|
| `app/layout.tsx` | Remplacer Space Grotesk / IBM Plex par Instrument Serif (`--font-display`), Instrument Sans (`--font-sans`), Spline Sans Mono (`--font-mono`) via `next/font/google` |
| `app/globals.css` | Nouveaux tokens §1.2, grain §1.3, boutons/pills/nav retravaillés (pilules, filets), keyframes §1.5 |
| `components/marketing/LandingPage.tsx` + `marketing.css` | Refonte complète → suivre `Atelier-Landing.dc.html` : header 3 colonnes, hero N°01 + H1 serif 2 lignes + stats sur filets, marquee, modules en **liste numérotée** (rangée 12 = IA inversée encre), bloc pourquoi + pricing empilé, CTA band encre arrondie avec grain, footer |
| `app/pricing/page.tsx` + `PricingCard.tsx` | Suivre `Atelier-Pricing.dc.html` : hero éditorial, 3 cartes (Starter encre, surélevée, badge ✦ POPULAIRE), comparatif en **rangées à filets** (plus de `<table>` bordée), bandeau final encre |
| `components/auth/AuthScreen.tsx` (+ SignUpScreen) | Suivre `Atelier-Login.dc.html` : split 50/50 — panneau gauche encre (logo, titre serif, 3 preuves numérotées), droite formulaire (onglets soulignés orange, labels mono uppercase, CTA pilule) |
| `components/v2/AppShell.tsx` | Suivre `Atelier-Dashboard.dc.html` : sidebar avec wordmark serif, nav numérotée mono (`01…10`, actif = fond blanc translucide + point orange), header de page avec date mono + titre serif 38px, recherche pilule ⌘K, CTA « + Nouvelle tâche » |
| `components/KanbanBoardView.tsx` / `KanbanCard.tsx` | Colonnes séparées par filets verticaux (plus de gros conteneur), titres de colonnes en serif (« En cours » italique orange), compteurs mono orange, cartes : point de couleur + admin mono uppercase, titre 15.5px, pied mono (société · date · priorité outline), badges Retard/48h rectangulaires mono |
| `components/modules/module-glyphs.css` | Garder formes/teintes ; fonds pastille `oklch(0.93 …)`, pictos assombris (§1.2) |
| Autres vues (`ToDoListView`, `CalendarView`, settings, modals…) | Appliquer le système : titres serif, labels mono, filets, pilules, mêmes tokens |

---

## 3. Prompt à donner à Cursor

```
Applique la refonte visuelle « Atelier » décrite dans docs/REDESIGN-ATELIER.md.
C'est un pur reskin : ne change AUCUNE logique, aucun handler, aucune route, aucune donnée —
uniquement classes, styles, structure JSX de présentation et tokens CSS.

Ordre :
1. app/layout.tsx (fontes) + app/globals.css (tokens, grain, boutons, keyframes)
2. Landing (components/marketing/*) en suivant la section 2 du doc
3. Pricing, Auth (login/signup)
4. AppShell + Kanban (KanbanBoardView, KanbanCard)
5. Les autres vues avec le même système

Les fichiers Atelier-*.dc.html joints sont les maquettes de référence : reprends-y les valeurs
exactes (couleurs, tailles, espacements, animations) — tout leur style est inline.
Respecte prefers-reduced-motion. Vérifie le contraste AA sur fond #f6f1e7 et #1a1611.
```
