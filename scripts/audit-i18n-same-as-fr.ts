import fs from "node:fs";
import path from "node:path";
import { fr } from "../lib/i18n/messages/fr";
import { en } from "../lib/i18n/messages/en";
import { es } from "../lib/i18n/messages/es";
import type { MessageTree } from "../lib/i18n/messages/fr";

function flatten(obj: MessageTree, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[next] = v;
    else if (v && typeof v === "object") flatten(v as MessageTree, next, out);
  }
  return out;
}

const frFlat = flatten(fr);
const enFlat = flatten(en);
const esFlat = flatten(es);

const enSameAsFr = Object.keys(enFlat).filter((k) => enFlat[k] === frFlat[k] && frFlat[k]);
const esSameAsEn = Object.keys(esFlat).filter((k) => esFlat[k] === enFlat[k] && enFlat[k]);
const esSameAsFr = Object.keys(esFlat).filter((k) => esFlat[k] === frFlat[k] && frFlat[k]);

// Likely untranslated: EN same as FR but contains French-specific chars or words
const frenchPattern =
  /\b(votre|vos|créer|nouveau|nouvelle|aujourd|échéance|paramètres|tableau|tâche|rendez|équipe|enregistrer|supprimer|modifier|aucun|aucune|chargement|collaborateur|terminé|priorité|entreprise|bienvenue|retour|ajouter|gestion|utilisateur|connexion|déconnexion|français|accueil|rechercher|filtrer|annuler|confirmer|enregistré|supprimé|modifié|succès|calendrier|événement|demande|formulaire|réponse|sélectionner|obligatoire|facultatif|publié|brouillon|archivé|partager|télécharger|aperçu|détails|informations|commentaire|historique|activité|notifications|préférences|langue|tutoriel|étape|étapes|suivant|précédent|terminer|commencer|continuer|passer|ignorer|fermer|ouvrir|afficher|masquer|catégorie|prénom|téléphone|adresse|durée|début|planifié|complété|annulé|en attente|validé|refusé|approuvé|rejeté|membre|administrateur|propriétaire|invité|permission|rôle|accès|mot de passe|oublié|réinitialiser|vérifier|sauvegarder|effacer|éditer|dupliquer|coller|importer|exporter|envoyer|recevoir|publier|dépublier|archiver|restaurer|activer|désactiver)\b|[àâäéèêëïîôùûüç]/i;

const enLikelyFrench = enSameAsFr.filter((k) => frenchPattern.test(enFlat[k]));
const esLikelyFrench = esSameAsFr.filter((k) => frenchPattern.test(esFlat[k]));

console.log("=== CATALOG STATS ===");
console.log("FR keys:", Object.keys(frFlat).length);
console.log("EN keys:", Object.keys(enFlat).length);
console.log("ES keys:", Object.keys(esFlat).length);
console.log("\nEN identical to FR:", enSameAsFr.length);
console.log("EN same as FR but likely French:", enLikelyFrench.length);
console.log("ES identical to EN:", esSameAsEn.length);
console.log("ES identical to FR:", esSameAsFr.length);
console.log("ES same as FR but likely French:", esLikelyFrench.length);

const report = {
  enSameAsFr,
  enLikelyFrench: enLikelyFrench.map((k) => ({ key: k, value: enFlat[k] })),
  esSameAsEn: esSameAsEn.slice(0, 500),
  esSameAsFr,
  esLikelyFrench: esLikelyFrench.map((k) => ({ key: k, value: esFlat[k] })),
};

fs.writeFileSync(path.join(process.cwd(), ".tmp-same-audit.json"), JSON.stringify(report, null, 2));

// Print EN likely French
if (enLikelyFrench.length) {
  console.log("\n=== EN LIKELY STILL FRENCH ===");
  for (const k of enLikelyFrench.slice(0, 60)) console.log(k, "=>", enFlat[k].slice(0, 100));
}

// Print ES same as EN sample grouped by namespace
const esUntranslated = esSameAsEn.filter((k) => !/^(en|es|fr)$/.test(k));
const grouped: Record<string, string[]> = {};
for (const k of esUntranslated) {
  const root = k.split(".")[0];
  (grouped[root] ??= []).push(k);
}
console.log("\n=== ES IDENTICAL TO EN (by namespace) ===");
for (const [root, keys] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).slice(0, 20)) {
  console.log(`[${root}] ${keys.length}`);
  for (const k of keys.slice(0, 5)) console.log(" ", k, "=>", esFlat[k].slice(0, 70));
}
