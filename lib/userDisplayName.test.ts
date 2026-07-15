import { describe, expect, it } from "vitest";
import {
  isPlaceholderDisplayName,
  resolveDisplayNameFromMetadata,
  resolveUserDisplayName,
} from "./userDisplayName";

describe("resolveDisplayNameFromMetadata", () => {
  it("priorise display_name", () => {
    expect(
      resolveDisplayNameFromMetadata({
        display_name: "Jean Dupont",
        full_name: "Autre Nom",
      }),
    ).toBe("Jean Dupont");
  });

  it("compose first_name et last_name", () => {
    expect(
      resolveDisplayNameFromMetadata({ first_name: "Marie", last_name: "Martin" }),
    ).toBe("Marie Martin");
  });

  it("utilise full_name Google", () => {
    expect(resolveDisplayNameFromMetadata({ full_name: "Paul Durand" })).toBe("Paul Durand");
  });
});

describe("isPlaceholderDisplayName", () => {
  it("détecte l’email et la partie locale", () => {
    expect(isPlaceholderDisplayName("jbc@idena2000.fr", "jbc@idena2000.fr")).toBe(true);
    expect(isPlaceholderDisplayName("jbc", "jbc@idena2000.fr")).toBe(true);
    expect(isPlaceholderDisplayName("Jean Dupont", "jbc@idena2000.fr")).toBe(false);
  });
});

describe("resolveUserDisplayName", () => {
  it("évite d’afficher l’email", () => {
    expect(
      resolveUserDisplayName({
        teamMemberName: "jbc",
        email: "jbc@example.com",
        authMetadata: { full_name: "Jean-Baptiste Coroyer" },
      }),
    ).toBe("Jean-Baptiste Coroyer");
  });
});
