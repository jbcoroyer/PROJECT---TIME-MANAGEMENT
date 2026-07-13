import { describe, expect, it } from "vitest";
import { sanitizePrimaryColor } from "./brandColorPresets";
import {
  assertOrgPrefixedPath,
  isStorageBucket,
  maxUploadBytesForBucket,
  sanitizeRelativeStoragePath,
} from "./storageUploadSecurity";

describe("sanitizePrimaryColor", () => {
  it("accepte un hex valide", () => {
    expect(sanitizePrimaryColor("#E07A28")).toBe("#E07A28");
    expect(sanitizePrimaryColor("e07a28")).toBe("#E07A28");
  });

  it("rejette une injection CSS", () => {
    expect(sanitizePrimaryColor("red; background: url(evil)")).toBe("#E07A28");
  });
});

describe("storageUploadSecurity", () => {
  it("valide les buckets autorisés", () => {
    expect(isStorageBucket("idena-mark")).toBe(true);
    expect(isStorageBucket("stripe-webhooks")).toBe(false);
  });

  it("rejette les chemins dangereux", () => {
    expect(sanitizeRelativeStoragePath("../secret")).toBeNull();
    expect(sanitizeRelativeStoragePath("folder/file.png")).toBe("folder/file.png");
  });

  it("vérifie le préfixe org", () => {
    const org = "00000000-0000-0000-0000-000000000001";
    expect(assertOrgPrefixedPath(org, `${org}/mark.png`)).toBe(true);
    expect(assertOrgPrefixedPath(org, "other-org/mark.png")).toBe(false);
  });

  it("définit une taille max par bucket", () => {
    expect(maxUploadBytesForBucket("idena-mark")).toBeLessThan(maxUploadBytesForBucket("event-documents"));
  });
});
