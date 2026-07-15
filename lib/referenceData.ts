import { defaultColumns, defaultDomains } from "./types";

export type ReferenceRecord = {
  id: string;
  name: string;
  color?: string | null;
  isDone?: boolean;
  logoUrl?: string | null;
  avatarUrl?: string | null;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toReferenceRecords(values: readonly string[]): ReferenceRecord[] {
  return values.map((name) => ({
    id: slugify(name) || name,
    name,
  }));
}

export const fallbackReferenceData = {
  admins: [] as ReferenceRecord[],
  companies: [] as ReferenceRecord[],
  domains: toReferenceRecords(defaultDomains),
  columns: toReferenceRecords(defaultColumns),
};
