/**
 * Identité de marque et informations légales — source unique.
 * Alimenté par variables d'environnement, avec défauts explicites.
 */

function envString(...keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return "";
}

export type ProductIdentity = {
  /** Nom commercial du produit SaaS (ex. RegiePilot). */
  productName: string;
  /** Enseigne / marque éditeur (ex. RegieLab). */
  tradeName: string;
  /** Accroche produit optionnelle. */
  productTagline: string;
};

export type LegalIdentity = {
  /** Nom de l'éditeur / responsable légal. */
  legalName: string;
  /** SIRET — vide tant que l'immatriculation n'est pas reçue. */
  siret: string;
  /** Code APE/NAF (cible : 58.29C — édition de logiciels applicatifs). */
  apeCode: string;
  /** TVA intracommunautaire — vide si franchise en base (art. 293 B CGI). */
  vatNumber: string;
  /** Adresse du siège / établissement. */
  registeredAddress: string;
  /** E-mail de contact public. */
  contactEmail: string;
  /** E-mail DPO / RGPD (défaut = contactEmail). */
  dpoEmail: string;
  /** Hébergeur applicatif. */
  hostingProvider: string;
  /** Adresse de l'hébergeur. */
  hostingProviderAddress: string;
  /** Directeur de la publication. */
  publicationDirector: string;
};

export type LegalConfig = ProductIdentity & LegalIdentity;

/** Champs obligatoires avant un déploiement production. */
export const REQUIRED_PRODUCTION_LEGAL_FIELDS = [
  "siret",
  "apeCode",
  "registeredAddress",
] as const satisfies ReadonlyArray<keyof LegalIdentity>;

export type RequiredProductionLegalField = (typeof REQUIRED_PRODUCTION_LEGAL_FIELDS)[number];

const DEFAULT_PRODUCT_NAME = "RegiePilot";
const DEFAULT_TRADE_NAME = "RegieLab";
const DEFAULT_LEGAL_NAME = "Jean-Baptiste Coroyer";
const DEFAULT_HOSTING_PROVIDER = "Vercel";
const DEFAULT_HOSTING_ADDRESS =
  "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis";

export const VAT_NOT_APPLICABLE_MENTION =
  "TVA non applicable, article 293 B du CGI" as const;

export function getProductIdentity(): ProductIdentity {
  return {
    productName: envString("NEXT_PUBLIC_PRODUCT_NAME") || DEFAULT_PRODUCT_NAME,
    tradeName: envString("NEXT_PUBLIC_TRADE_NAME") || DEFAULT_TRADE_NAME,
    productTagline: envString("NEXT_PUBLIC_PRODUCT_TAGLINE"),
  };
}

export function getLegalConfig(): LegalConfig {
  const product = getProductIdentity();
  const legalName = envString("LEGAL_NAME", "NEXT_PUBLIC_LEGAL_NAME") || DEFAULT_LEGAL_NAME;
  const contactEmail = envString("LEGAL_CONTACT_EMAIL", "NEXT_PUBLIC_LEGAL_CONTACT_EMAIL");

  return {
    ...product,
    legalName,
    // TODO: renseigner à réception du SIRET
    siret: envString("LEGAL_SIRET", "NEXT_PUBLIC_LEGAL_SIRET"),
    // TODO: renseigner à réception du SIRET (cible : 58.29C — à confirmer sur avis-situation-sirene.insee.fr)
    apeCode: envString("LEGAL_APE_CODE", "NEXT_PUBLIC_LEGAL_APE_CODE"),
    // TODO: renseigner si assujettissement TVA (franchise en base actuellement)
    vatNumber: envString("LEGAL_VAT_NUMBER", "NEXT_PUBLIC_LEGAL_VAT_NUMBER"),
    // TODO: renseigner à réception du SIRET / adresse d'établissement
    registeredAddress: envString(
      "LEGAL_REGISTERED_ADDRESS",
      "NEXT_PUBLIC_LEGAL_REGISTERED_ADDRESS",
    ),
    contactEmail,
    dpoEmail: envString("LEGAL_DPO_EMAIL", "NEXT_PUBLIC_LEGAL_DPO_EMAIL") || contactEmail,
    hostingProvider:
      envString("LEGAL_HOSTING_PROVIDER", "NEXT_PUBLIC_LEGAL_HOSTING_PROVIDER") ||
      DEFAULT_HOSTING_PROVIDER,
    hostingProviderAddress:
      envString("LEGAL_HOSTING_PROVIDER_ADDRESS", "NEXT_PUBLIC_LEGAL_HOSTING_PROVIDER_ADDRESS") ||
      DEFAULT_HOSTING_ADDRESS,
    publicationDirector:
      envString("LEGAL_PUBLICATION_DIRECTOR", "NEXT_PUBLIC_LEGAL_PUBLICATION_DIRECTOR") ||
      legalName,
  };
}

/** Mention TVA conditionnelle : 293 B CGI si pas de numéro de TVA. */
export function getVatDisplay(config: Pick<LegalIdentity, "vatNumber"> = getLegalConfig()): string {
  const vat = config.vatNumber.trim();
  return vat || VAT_NOT_APPLICABLE_MENTION;
}

export function isVatExempt(config: Pick<LegalIdentity, "vatNumber"> = getLegalConfig()): boolean {
  return !config.vatNumber.trim();
}

/** True sur un déploiement / build Vercel Production. */
export function isProductionLegalEnforcement(): boolean {
  if (process.env.ENFORCE_LEGAL_CONFIG === "1" || process.env.ENFORCE_LEGAL_CONFIG === "true") {
    return true;
  }
  return process.env.VERCEL_ENV === "production";
}

export function getMissingRequiredLegalFields(
  config: LegalConfig = getLegalConfig(),
): RequiredProductionLegalField[] {
  return REQUIRED_PRODUCTION_LEGAL_FIELDS.filter((field) => !config[field].trim());
}

/**
 * Bloque le build / démarrage production si SIRET, APE ou adresse sont vides.
 * Autorise le vide en développement et sur les previews.
 */
export function assertProductionLegalConfig(config: LegalConfig = getLegalConfig()): void {
  if (!isProductionLegalEnforcement()) return;

  const missing = getMissingRequiredLegalFields(config);
  if (missing.length === 0) return;

  throw new Error(
    `[legal] Variables légales obligatoires manquantes en production : ${missing.join(", ")}. ` +
      `Renseignez LEGAL_SIRET, LEGAL_APE_CODE et LEGAL_REGISTERED_ADDRESS (voir .env.example).`,
  );
}
