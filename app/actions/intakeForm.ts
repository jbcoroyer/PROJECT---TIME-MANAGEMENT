"use server";

import { revalidatePath } from "next/cache";
import {
  createStarterIntakeDefinition,
  parseIntakeFormDefinition,
} from "../../lib/intake/intakeFormDefinition";
import {
  mapIntakeAnswersToInput,
  validateIntakeAnswers,
} from "../../lib/intake/intakeFormAnswers";
import { defaultPublicPathForIntakeForm } from "../../lib/intake/intakeFormPaths";
import type { SurveyAnswers, SurveyDefinition } from "../../lib/survey/surveyTypes";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";
import { suggestDomainFromText } from "../../lib/v2/intake";

export type IntakeFormMeta = {
  id: string;
  title: string;
  welcomeMessage: string;
  publicPath: string;
  status: "active" | "draft";
  createdAt: string;
};

export type IntakeFormWithStats = IntakeFormMeta & {
  requestCount: number;
};

export type PublicIntakeFormMeta = {
  id: string;
  title: string;
  welcomeMessage: string;
  appName: string;
  companies: string[];
  definition: SurveyDefinition;
};

export type IntakeFormDefinitionResult =
  | { ok: true; definition: SurveyDefinition }
  | { ok: false; error: string };

export type SaveIntakeFormDefinitionResult = { ok: true } | { ok: false; error: string };

export type CreateIntakeFormResult =
  | { ok: true; formId: string }
  | { ok: false; error: string };

export type UpdateIntakeFormResult = { ok: true } | { ok: false; error: string };

export type SubmitPublicIntakeResult = { ok: true } | { ok: false; error: string };

type IntakeFormRow = {
  id: string;
  title: string | null;
  welcome_message: string | null;
  status: string | null;
  public_path: string | null;
  created_at: string | null;
  organization_id: string;
  definition?: unknown;
};

function resolveIntakeDefinition(row: IntakeFormRow): SurveyDefinition {
  const parsed = parseIntakeFormDefinition(row.definition);
  if (parsed) return parsed;
  return createStarterIntakeDefinition(
    row.id,
    row.title ?? "Formulaire de demande",
    row.welcome_message ?? "",
  );
}

function rowToMeta(row: IntakeFormRow): IntakeFormMeta {
  return {
    id: row.id,
    title: row.title ?? "Formulaire de demande",
    welcomeMessage: row.welcome_message ?? "",
    publicPath: row.public_path ?? defaultPublicPathForIntakeForm(row.id),
    status: row.status === "draft" ? "draft" : "active",
    createdAt: row.created_at ?? "",
  };
}

/** Formulaire de l'organisation connectée (s'il existe). */
export async function getOrgIntakeForm(): Promise<IntakeFormWithStats | null> {
  const supabase = await createServerSupabase();
  const { data: form } = await supabase
    .from("intake_forms")
    .select("id, title, welcome_message, status, public_path, created_at, organization_id")
    .maybeSingle();

  if (!form) return null;

  const meta = rowToMeta(form as IntakeFormRow);
  const { count } = await supabase
    .from("intake_requests")
    .select("id", { count: "exact", head: true })
    .eq("intake_form_id", meta.id);

  return { ...meta, requestCount: count ?? 0 };
}

/** Crée l'espace de demandes (un seul par organisation). */
export async function createIntakeForm(
  title: string,
  welcomeMessage: string,
): Promise<CreateIntakeFormResult> {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return { ok: false, error: "Le titre du formulaire est requis." };
  }

  const ctx = await getServerOrgContext();
  if (!ctx) {
    return { ok: false, error: "Vous devez être connecté." };
  }

  const supabase = await createServerSupabase();
  const { data: existing } = await supabase.from("intake_forms").select("id").maybeSingle();
  if (existing) {
    return { ok: false, error: "Un espace de demandes existe déjà pour votre organisation." };
  }

  const formId = crypto.randomUUID();
  const publicPath = defaultPublicPathForIntakeForm(formId);
  const definition = createStarterIntakeDefinition(formId, cleanTitle, welcomeMessage.trim());

  const { error } = await supabase.from("intake_forms").insert({
    id: formId,
    title: cleanTitle,
    welcome_message: welcomeMessage.trim(),
    status: "active",
    public_path: publicPath,
    organization_id: ctx.organizationId,
    definition,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Création impossible." };
  }

  revalidatePath("/asks");
  revalidatePath(publicPath);
  return { ok: true, formId };
}

/** Met à jour le titre et le message d'accueil du formulaire. */
export async function updateIntakeForm(
  formId: string,
  patch: { title?: string; welcomeMessage?: string },
): Promise<UpdateIntakeFormResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const dbPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) {
    const clean = patch.title.trim();
    if (!clean) return { ok: false, error: "Le titre ne peut pas être vide." };
    dbPatch.title = clean;
  }
  if (patch.welcomeMessage !== undefined) {
    dbPatch.welcome_message = patch.welcomeMessage.trim();
  }

  const supabase = await createServerSupabase();
  const { data: existing } = await supabase
    .from("intake_forms")
    .select("public_path")
    .eq("id", formId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Formulaire introuvable." };

  const { error } = await supabase.from("intake_forms").update(dbPatch).eq("id", formId);
  if (error) {
    return { ok: false, error: error.message ?? "Mise à jour impossible." };
  }

  revalidatePath("/asks");
  revalidatePath(existing.public_path as string);
  revalidatePath("/asks/edit");
  return { ok: true };
}

/** Charge la définition éditable du formulaire de l'organisation. */
export async function fetchIntakeFormDefinition(
  formId: string,
): Promise<IntakeFormDefinitionResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("intake_forms")
    .select("id, title, welcome_message, definition")
    .eq("id", formId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Formulaire introuvable." };
  }

  return { ok: true, definition: resolveIntakeDefinition(data as IntakeFormRow) };
}

/** Enregistre la définition (questions, écrans, accueil) du formulaire. */
export async function saveIntakeFormDefinition(
  formId: string,
  definition: SurveyDefinition,
): Promise<SaveIntakeFormDefinitionResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const supabase = await createServerSupabase();
  const { data: existing } = await supabase
    .from("intake_forms")
    .select("public_path")
    .eq("id", formId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Formulaire introuvable." };

  const { error } = await supabase
    .from("intake_forms")
    .update({
      definition,
      title: definition.title.trim() || definition.intro.title.trim(),
      welcome_message: definition.intro.subtitle.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", formId);

  if (error) {
    return { ok: false, error: error.message ?? "Enregistrement impossible." };
  }

  revalidatePath("/asks");
  revalidatePath("/asks/edit");
  revalidatePath(existing.public_path as string);
  return { ok: true };
}

/** Métadonnées publiques pour afficher le formulaire (sans authentification). */
export async function getPublicIntakeFormMeta(
  formId: string,
): Promise<PublicIntakeFormMeta | null> {
  if (!formId) return null;

  const admin = createSupabaseAdmin();
  const { data: form } = await admin
    .from("intake_forms")
    .select("id, title, welcome_message, status, organization_id, definition")
    .eq("id", formId)
    .eq("status", "active")
    .maybeSingle();

  if (!form) return null;

  const orgId = form.organization_id as string;

  const [{ data: settings }, { data: companies }] = await Promise.all([
    admin.from("app_settings").select("app_name").eq("organization_id", orgId).maybeSingle(),
    admin.from("companies").select("name").eq("organization_id", orgId).order("name"),
  ]);

  const row = form as IntakeFormRow;

  return {
    id: row.id,
    title: row.title ?? "Soumettre une demande",
    welcomeMessage: row.welcome_message ?? "",
    appName: (settings?.app_name as string) ?? "Workspace",
    companies: (companies ?? [])
      .map((c) => String((c as { name?: string }).name ?? "").trim())
      .filter(Boolean),
    definition: resolveIntakeDefinition(row),
  };
}

export type SubmitPublicIntakeInput = {
  title: string;
  expectedSupport: string;
  supportFormat: string;
  company: string;
  deadline: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
};

export type SubmitPublicIntakeAnswersInput = {
  answers: SurveyAnswers;
};

/** Soumission publique — accessible sans compte. */
export async function submitPublicIntakeRequest(
  formId: string,
  input: SubmitPublicIntakeInput | SubmitPublicIntakeAnswersInput,
): Promise<SubmitPublicIntakeResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const admin = createSupabaseAdmin();
  const { data: form } = await admin
    .from("intake_forms")
    .select("id, organization_id, title, welcome_message, definition")
    .eq("id", formId)
    .eq("status", "active")
    .maybeSingle();

  if (!form?.organization_id) {
    return { ok: false, error: "Formulaire introuvable ou inactif." };
  }

  const definition = resolveIntakeDefinition(form as IntakeFormRow);

  let mapped: SubmitPublicIntakeInput;
  if ("answers" in input) {
    const validationError = validateIntakeAnswers(definition, input.answers);
    if (validationError) return { ok: false, error: validationError };
    mapped = mapIntakeAnswersToInput(definition, input.answers);
  } else {
    mapped = input;
  }

  const title = mapped.title?.trim();
  const expectedSupport = mapped.expectedSupport?.trim();
  const supportFormat = mapped.supportFormat?.trim();
  const deadline = mapped.deadline?.trim();
  const requesterName = mapped.requesterName?.trim();
  const requesterEmail = mapped.requesterEmail?.trim();

  if (!title || !expectedSupport || !supportFormat || !deadline) {
    return { ok: false, error: "Merci de remplir tous les champs obligatoires." };
  }
  if (!requesterName || !requesterEmail) {
    return { ok: false, error: "Nom et e-mail du demandeur requis." };
  }

  const domainText = `${title} ${expectedSupport} ${supportFormat} ${mapped.description ?? ""}`;
  const suggestedDomain = suggestDomainFromText(domainText);

  const { error } = await admin.from("intake_requests").insert({
    organization_id: form.organization_id,
    intake_form_id: form.id,
    title,
    description: mapped.description?.trim() ?? "",
    company: mapped.company?.trim() ?? "",
    concern: expectedSupport,
    support_format: supportFormat,
    deadline,
    budget: "",
    estimated_hours: 0,
    requester_name: requesterName,
    requester_service: requesterEmail,
    priority: "Moyenne",
    status: "triage",
    suggested_domain: suggestedDomain,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Envoi impossible." };
  }

  revalidatePath("/asks");
  revalidatePath("/asks/triage");
  return { ok: true };
}
