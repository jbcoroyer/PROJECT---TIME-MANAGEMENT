"use server";

import { revalidatePath } from "next/cache";
import {
  createStarterIntakeDefinition,
  parseIntakeFormDefinition,
} from "../../lib/intake/intakeFormDefinition";
import {
  createIntakeDefinitionFromTemplate,
  isIntakeFormTemplateId,
  type IntakeFormTemplateId,
} from "../../lib/intake/intakeFormTemplates";
import type { AppLocale } from "../../lib/i18n";
import {
  mapIntakeAnswersToInput,
  validateIntakeAnswers,
} from "../../lib/intake/intakeFormAnswers";
import {
  defaultPublicPathForIntakeForm,
  defaultPublicPathFromTitle,
  INTAKE_PUBLIC_PREFIX,
  normalizeIntakePublicPath,
} from "../../lib/intake/intakeFormPaths";
import type { SurveyAnswers, SurveyDefinition } from "../../lib/survey/surveyTypes";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { sanitizeIntakeSubmission } from "../../lib/server/publicSubmissionLimits";
import { publicSubmissionRateLimitError } from "../../lib/server/publicSubmissionRateLimit";
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

export type DeleteIntakeFormResult = { ok: true } | { ok: false; error: string };

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

async function attachRequestCounts(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  forms: IntakeFormMeta[],
): Promise<IntakeFormWithStats[]> {
  if (forms.length === 0) return [];

  const ids = forms.map((f) => f.id);
  const { data: requests } = await supabase
    .from("intake_requests")
    .select("intake_form_id")
    .in("intake_form_id", ids);

  const counts: Record<string, number> = {};
  for (const row of requests ?? []) {
    const formId = String((row as { intake_form_id?: string }).intake_form_id ?? "");
    if (formId) counts[formId] = (counts[formId] ?? 0) + 1;
  }

  return forms.map((form) => ({
    ...form,
    requestCount: counts[form.id] ?? 0,
  }));
}

function revalidateIntakeFormPaths(publicPath?: string | null, formId?: string) {
  revalidatePath("/asks");
  if (formId) {
    revalidatePath(`/asks/${formId}`);
    revalidatePath(`/asks/${formId}/edit`);
    revalidatePath(`/asks/${formId}/triage`);
  }
  revalidatePath("/asks/triage");
  if (publicPath) revalidatePath(publicPath);
}

/** @deprecated Utiliser listIntakeForms — conservé pour compatibilité. */
export async function getOrgIntakeForm(): Promise<IntakeFormWithStats | null> {
  const forms = await listIntakeForms();
  return forms[0] ?? null;
}

/** Liste tous les formulaires de l'organisation. */
export async function listIntakeForms(): Promise<IntakeFormWithStats[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("intake_forms")
    .select("id, title, welcome_message, status, public_path, created_at, organization_id")
    .order("created_at", { ascending: false });

  const metas = ((data ?? []) as IntakeFormRow[]).map(rowToMeta);
  return attachRequestCounts(supabase, metas);
}

/** Détail d'un formulaire par identifiant. */
export async function getIntakeForm(formId: string): Promise<IntakeFormWithStats | null> {
  if (!formId) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("intake_forms")
    .select("id, title, welcome_message, status, public_path, created_at, organization_id")
    .eq("id", formId)
    .maybeSingle();

  if (!data) return null;

  const [withStats] = await attachRequestCounts(supabase, [rowToMeta(data as IntakeFormRow)]);
  return withStats ?? null;
}

export type CreateIntakeFormOptions = {
  templateId?: IntakeFormTemplateId;
  locale?: AppLocale;
};

/** Crée un nouveau formulaire de demande. */
export async function createIntakeForm(
  title: string,
  welcomeMessage: string,
  options?: CreateIntakeFormOptions,
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
  const formId = crypto.randomUUID();
  const publicPath = defaultPublicPathFromTitle(cleanTitle);
  const templateId =
    options?.templateId && isIntakeFormTemplateId(options.templateId)
      ? options.templateId
      : "blank";
  const locale = options?.locale ?? "fr";
  const definition = createIntakeDefinitionFromTemplate(
    formId,
    cleanTitle,
    welcomeMessage.trim(),
    templateId,
    locale,
  );

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

  revalidateIntakeFormPaths(publicPath, formId);
  return { ok: true, formId };
}

/** Met à jour le titre, le message d'accueil ou le statut du formulaire. */
export async function updateIntakeForm(
  formId: string,
  patch: { title?: string; welcomeMessage?: string; status?: "active" | "draft" },
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
  if (patch.status !== undefined) {
    dbPatch.status = patch.status;
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

  revalidateIntakeFormPaths(existing.public_path as string, formId);
  return { ok: true };
}

/** Met à jour l'URL publique personnalisée du formulaire. */
export async function updateIntakeFormPublicPath(
  formId: string,
  publicPathInput: string,
): Promise<UpdateIntakeFormResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const normalized = normalizeIntakePublicPath(publicPathInput);
  if (!normalized) {
    return {
      ok: false,
      error: `URL invalide. Utilisez un segment après ${INTAKE_PUBLIC_PREFIX} (lettres, chiffres, tirets).`,
    };
  }

  const supabase = await createServerSupabase();
  const { data: existing } = await supabase
    .from("intake_forms")
    .select("public_path")
    .eq("id", formId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Formulaire introuvable." };

  const { error } = await supabase
    .from("intake_forms")
    .update({ public_path: normalized, updated_at: new Date().toISOString() })
    .eq("id", formId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Cette URL est déjà utilisée par un autre formulaire." };
    }
    return { ok: false, error: error.message ?? "Mise à jour impossible." };
  }

  revalidateIntakeFormPaths(existing.public_path as string, formId);
  revalidateIntakeFormPaths(normalized, formId);
  return { ok: true };
}

/** Supprime un formulaire (les demandes liées conservent intake_form_id à null). */
export async function deleteIntakeForm(formId: string): Promise<DeleteIntakeFormResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const supabase = await createServerSupabase();
  const { data: existing } = await supabase
    .from("intake_forms")
    .select("public_path")
    .eq("id", formId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Formulaire introuvable." };

  const { error } = await supabase.from("intake_forms").delete().eq("id", formId);
  if (error) {
    return { ok: false, error: error.message ?? "Suppression impossible." };
  }

  revalidateIntakeFormPaths(existing.public_path as string);
  return { ok: true };
}

/** Duplique un formulaire existant. */
export async function duplicateIntakeForm(formId: string): Promise<CreateIntakeFormResult> {
  if (!formId) return { ok: false, error: "Formulaire introuvable." };

  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Vous devez être connecté." };

  const supabase = await createServerSupabase();
  const { data: source } = await supabase
    .from("intake_forms")
    .select("title, welcome_message, status, definition")
    .eq("id", formId)
    .maybeSingle();

  if (!source) return { ok: false, error: "Formulaire introuvable." };

  const newId = crypto.randomUUID();
  const copyTitle = `${(source.title as string) ?? "Formulaire"} (copie)`;
  const publicPath = defaultPublicPathFromTitle(copyTitle);
  const definition = resolveIntakeDefinition({
    ...(source as IntakeFormRow),
    id: newId,
    title: copyTitle,
  });

  const { error } = await supabase.from("intake_forms").insert({
    id: newId,
    title: copyTitle,
    welcome_message: source.welcome_message ?? "",
    status: "draft",
    public_path: publicPath,
    organization_id: ctx.organizationId,
    definition,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Duplication impossible." };
  }

  revalidateIntakeFormPaths(publicPath, newId);
  return { ok: true, formId: newId };
}

/** Charge la définition éditable du formulaire. */
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

  revalidateIntakeFormPaths(existing.public_path as string, formId);
  return { ok: true };
}

async function loadPublicFormRow(
  admin: ReturnType<typeof createSupabaseAdmin>,
  identifier: string,
): Promise<IntakeFormRow | null> {
  const byId = await admin
    .from("intake_forms")
    .select("id, title, welcome_message, status, organization_id, definition, public_path")
    .eq("id", identifier)
    .eq("status", "active")
    .maybeSingle();

  if (byId.data) return byId.data as IntakeFormRow;

  const path = identifier.startsWith("/")
    ? identifier
    : `${INTAKE_PUBLIC_PREFIX}${identifier}`;

  const byPath = await admin
    .from("intake_forms")
    .select("id, title, welcome_message, status, organization_id, definition, public_path")
    .eq("public_path", path)
    .eq("status", "active")
    .maybeSingle();

  return (byPath.data as IntakeFormRow | null) ?? null;
}

/** Métadonnées publiques — résolution par UUID ou segment d'URL personnalisé. */
export async function getPublicIntakeFormMeta(
  identifier: string,
): Promise<PublicIntakeFormMeta | null> {
  if (!identifier) return null;

  const admin = createSupabaseAdmin();
  const form = await loadPublicFormRow(admin, identifier);
  if (!form) return null;

  const orgId = form.organization_id;

  const [{ data: settings }, { data: companies }] = await Promise.all([
    admin.from("app_settings").select("app_name").eq("organization_id", orgId).maybeSingle(),
    admin.from("companies").select("name").eq("organization_id", orgId).order("name"),
  ]);

  return {
    id: form.id,
    title: form.title ?? "Soumettre une demande",
    welcomeMessage: form.welcome_message ?? "",
    appName: (settings?.app_name as string) ?? "Workspace",
    companies: (companies ?? [])
      .map((c) => String((c as { name?: string }).name ?? "").trim())
      .filter(Boolean),
    definition: resolveIntakeDefinition(form),
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

  const rateLimited = await publicSubmissionRateLimitError("public/intake");
  if (rateLimited) return { ok: false, error: rateLimited };

  const admin = createSupabaseAdmin();
  const form = await loadPublicFormRow(admin, formId);

  if (!form?.organization_id) {
    return { ok: false, error: "Formulaire introuvable ou inactif." };
  }

  const definition = resolveIntakeDefinition(form);

  let mapped: SubmitPublicIntakeInput;
  if ("answers" in input) {
    const validationError = validateIntakeAnswers(definition, input.answers);
    if (validationError) return { ok: false, error: validationError };
    mapped = mapIntakeAnswersToInput(definition, input.answers);
  } else {
    mapped = input;
  }

  const sanitized = sanitizeIntakeSubmission(mapped);
  const title = sanitized.title;
  const expectedSupport = sanitized.concern;
  const supportFormat = sanitized.supportFormat;
  const deadline = sanitized.deadline;
  const requesterName = sanitized.requesterName;
  const requesterEmail = sanitized.requesterEmail;

  if (!title || !expectedSupport || !supportFormat || !deadline) {
    return { ok: false, error: "Merci de remplir tous les champs obligatoires." };
  }
  if (!requesterName || !requesterEmail) {
    return { ok: false, error: "Nom et e-mail du demandeur requis." };
  }

  const domainText = `${title} ${expectedSupport} ${supportFormat} ${sanitized.description}`;
  const suggestedDomain = suggestDomainFromText(domainText);

  const { error } = await admin.from("intake_requests").insert({
    organization_id: form.organization_id,
    intake_form_id: form.id,
    title,
    description: sanitized.description,
    company: sanitized.company,
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
  revalidatePath(`/asks/${form.id}/triage`);
  return { ok: true };
}
