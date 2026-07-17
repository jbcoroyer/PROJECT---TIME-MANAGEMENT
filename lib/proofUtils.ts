import type { Proof, ProofStatus } from "./proofTypes";

export type ProofRow = {
  id: string;
  created_at: string;
  title: string;
  company_id: string | null;
  status: string | null;
  current_version: number | null;
  visual_url: string | null;
  versions: Proof["versions"] | null;
  comments: Proof["comments"] | null;
  approvers: Proof["approvers"] | null;
};

export function newProofId(prefix = "proof"): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function rowToProof(row: ProofRow): Proof {
  return {
    id: row.id,
    createdAt: row.created_at,
    title: row.title,
    companyId: row.company_id,
    status: (row.status as ProofStatus) ?? "draft",
    currentVersion: row.current_version ?? 1,
    visualUrl: row.visual_url,
    versions: Array.isArray(row.versions) ? row.versions : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    approvers: Array.isArray(row.approvers) ? row.approvers : [],
  };
}

/** Recalcule le statut d'une épreuve à partir des décisions d'approbation. */
export function deriveStatus(proof: Pick<Proof, "approvers" | "status">): ProofStatus {
  if (proof.approvers.length === 0) return proof.status === "draft" ? "draft" : "in_review";
  if (proof.approvers.some((approver) => approver.decision === "rejected")) return "changes_requested";
  if (proof.approvers.every((approver) => approver.decision === "approved")) return "approved";
  return "in_review";
}
