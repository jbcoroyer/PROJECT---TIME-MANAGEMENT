"use client";

import { getSupabaseBrowser } from "../supabaseBrowser";
import type { RelationEntity } from "./boardFields";

export type EntityKind = "team_members" | RelationEntity;

export type EntityOption = {
  id: string;
  label: string;
};

const DELETED_LABEL = "— (supprimé)";

type EntityRow = { id: string; label: string };

type TeamMemberRow = { id?: string; display_name?: string };
type NamedRow = { id?: string; name?: string };

async function fetchRows(kind: EntityKind): Promise<EntityRow[]> {
  const supabase = getSupabaseBrowser();

  if (kind === "team_members") {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as TeamMemberRow[];
    return rows
      .map((row) => ({
        id: String(row.id ?? ""),
        label: String(row.display_name ?? ""),
      }))
      .filter((row) => row.id && row.label);
  }

  if (kind === "companies") {
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as NamedRow[];
    return rows
      .map((row) => ({
        id: String(row.id ?? ""),
        label: String(row.name ?? ""),
      }))
      .filter((row) => row.id && row.label);
  }

  if (kind === "domains") {
    const { data, error } = await supabase
      .from("domains")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as NamedRow[];
    return rows
      .map((row) => ({
        id: String(row.id ?? ""),
        label: String(row.name ?? ""),
      }))
      .filter((row) => row.id && row.label);
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, name")
    .order("start_date", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as NamedRow[];
  return rows
    .map((row) => ({
      id: String(row.id ?? ""),
      label: String(row.name ?? ""),
    }))
    .filter((row) => row.id && row.label);
}

export async function listOptions(kind: EntityKind): Promise<EntityOption[]> {
  const rows = await fetchRows(kind);
  return rows.map((row) => ({ id: row.id, label: row.label }));
}

export async function resolveLabel(kind: EntityKind, id: string): Promise<string> {
  if (!id) return "";
  const rows = await fetchRows(kind);
  const match = rows.find((row) => row.id === id);
  return match?.label ?? DELETED_LABEL;
}

export async function resolveLabels(
  kind: EntityKind,
  ids: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (uniqueIds.length === 0) return map;

  const rows = await fetchRows(kind);
  const byId = new Map(rows.map((row) => [row.id, row.label]));
  for (const id of uniqueIds) {
    map.set(id, byId.get(id) ?? DELETED_LABEL);
  }
  return map;
}

export function entityKindForPerson(): EntityKind {
  return "team_members";
}

export function entityKindForRelation(entity: RelationEntity): EntityKind {
  return entity;
}
