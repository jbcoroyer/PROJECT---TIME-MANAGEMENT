/**
 * Chiffrement AES-256-GCM des jetons Outlook stockés en base.
 * Format : v1:<base64(iv)>:<base64(tag)>:<base64(ciphertext)>
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const FORMAT_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const ENCRYPTED_PREFIX = `${FORMAT_VERSION}:`;

function getEncryptionKey(): Buffer {
  const raw = process.env.OUTLOOK_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    const msg =
      "[tokenCrypto] OUTLOOK_TOKEN_ENCRYPTION_KEY manquante : impossible de chiffrer/déchiffrer les jetons Outlook. Définissez une clé de 64 caractères hex (32 octets) dans .env.local et sur Vercel.";
    console.error(msg);
    throw new Error(msg);
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    const msg =
      "[tokenCrypto] OUTLOOK_TOKEN_ENCRYPTION_KEY invalide : attendu 64 caractères hexadécimaux (32 octets).";
    console.error(msg);
    throw new Error(msg);
  }
  return Buffer.from(raw, "hex");
}

/** Indique si la valeur est au format chiffré (v1:...). */
export function isEncryptedToken(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Chiffre un jeton en clair. Lève une erreur si la clé d'environnement est absente.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${FORMAT_VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Déchiffre un jeton stocké. Les jetons legacy en clair sont renvoyés tels quels.
 * Lève une erreur si le jeton est chiffré mais la clé est absente ou invalide.
 */
export function decryptToken(value: string): string {
  if (!isEncryptedToken(value)) {
    return value;
  }

  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    console.error("[tokenCrypto] Format de jeton chiffré invalide, utilisation en clair (legacy).");
    return value;
  }

  const [, ivB64, tagB64, ciphertextB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error("[tokenCrypto] IV invalide dans le jeton chiffré.");
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error("[tokenCrypto] Tag d'authentification invalide dans le jeton chiffré.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
