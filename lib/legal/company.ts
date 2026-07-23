import { getLegalConfig, getVatDisplay, type LegalConfig } from "../config/legal";

/** Vue adaptateur pour les pages Mentions légales / Privacy / Security. */
export type LegalCompany = {
  name: string;
  tradeName: string;
  productName: string;
  productTagline: string;
  address: string;
  siret: string;
  apeCode: string;
  vat: string;
  vatExempt: boolean;
  publisher: string;
  contactEmail: string;
  dpoEmail: string;
  hostingProvider: string;
  hostingProviderAddress: string;
};

export function mapLegalConfigToCompany(config: LegalConfig = getLegalConfig()): LegalCompany {
  return {
    name: config.legalName,
    tradeName: config.tradeName,
    productName: config.productName,
    productTagline: config.productTagline,
    address: config.registeredAddress,
    siret: config.siret,
    apeCode: config.apeCode,
    vat: getVatDisplay(config),
    vatExempt: !config.vatNumber.trim(),
    publisher: config.publicationDirector,
    contactEmail: config.contactEmail,
    dpoEmail: config.dpoEmail,
    hostingProvider: config.hostingProvider,
    hostingProviderAddress: config.hostingProviderAddress,
  };
}

/** Snapshot au chargement du module (pages serveur). */
export const LEGAL_COMPANY: LegalCompany = mapLegalConfigToCompany();
