import { describe, expect, it } from "vitest";
import {
  createIntakeDefinitionFromTemplate,
  defaultTitleForTemplate,
  defaultWelcomeForTemplate,
  isIntakeFormTemplateId,
  INTAKE_FORM_TEMPLATE_IDS,
} from "./intakeFormTemplates";
import { INTAKE_QUESTION_IDS } from "./intakeFormDefinition";

describe("intakeFormTemplates", () => {
  it("recognizes template ids", () => {
    expect(isIntakeFormTemplateId("project")).toBe(true);
    expect(isIntakeFormTemplateId("unknown")).toBe(false);
    expect(INTAKE_FORM_TEMPLATE_IDS.length).toBeGreaterThanOrEqual(4);
  });

  it("builds blank template with legacy mapped fields", () => {
    const def = createIntakeDefinitionFromTemplate(
      "form-1",
      "Titre",
      "Bienvenue",
      "blank",
      "fr",
    );
    expect(def.questions.some((q) => q.id === INTAKE_QUESTION_IDS.requesterEmail)).toBe(
      true,
    );
    expect(def.questions.length).toBe(8);
  });

  it("builds project template with contact and project fields", () => {
    const def = createIntakeDefinitionFromTemplate(
      "form-2",
      "Projets",
      "",
      "project",
      "en",
    );
    const ids = def.questions.map((q) => q.id);
    expect(ids).toContain("extra_first_name");
    expect(ids).toContain(INTAKE_QUESTION_IDS.deadline);
    expect(ids).toContain("extra_budget");
    expect(def.intro.estimatedMinutes).toBe(5);
    expect(def.questions.find((q) => q.id === INTAKE_QUESTION_IDS.requesterEmail)?.label).toBe(
      "Email",
    );
  });

  it("localizes defaults per locale", () => {
    expect(defaultTitleForTemplate("project", "fr", "Acme")).toContain("Acme");
    expect(defaultWelcomeForTemplate("support", "en")).toMatch(/issue|support/i);
  });
});
