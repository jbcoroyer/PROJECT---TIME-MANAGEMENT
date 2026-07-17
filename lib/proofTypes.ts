export type ProofStatus = "draft" | "in_review" | "changes_requested" | "approved";

export const PROOF_STATUS_LABELS: Record<ProofStatus, string> = {
  draft: "Brouillon",
  in_review: "En relecture",
  changes_requested: "Corrections demandées",
  approved: "Validé",
};

export type ProofVersion = {
  n: number;
  visualUrl: string | null;
  note: string;
  createdAt: string;
};

export type ProofComment = {
  id: string;
  author: string;
  body: string;
  /** Position relative de l'annotation sur le visuel (0-100 %), null = commentaire global. */
  posX: number | null;
  posY: number | null;
  version: number;
  resolved: boolean;
  createdAt: string;
};

export type ProofApprover = {
  name: string;
  decision: "pending" | "approved" | "rejected";
  decidedAt: string | null;
};

export type Proof = {
  id: string;
  createdAt: string;
  title: string;
  companyId: string | null;
  status: ProofStatus;
  currentVersion: number;
  visualUrl: string | null;
  versions: ProofVersion[];
  comments: ProofComment[];
  approvers: ProofApprover[];
};

export type AppendProofCommentPayload = {
  proofId: string;
  author: string;
  body: string;
  posX?: number | null;
  posY?: number | null;
  version: number;
};

export type AppendProofCommentResult = {
  proofId: string;
  comment: ProofComment;
  comments: ProofComment[];
  currentVersion: number;
};

export type AppendProofVersionPayload = {
  proofId: string;
  visualUrl?: string | null;
  note?: string | null;
};

export type AppendProofVersionResult = {
  proofId: string;
  version: ProofVersion;
  newVersion: number;
  visualUrl: string | null;
  currentVersion: number;
  versions: ProofVersion[];
  approvers: ProofApprover[];
  status: ProofStatus;
};

export type SetProofApproverDecisionPayload = {
  proofId: string;
  approverName: string;
  decision: "approved" | "rejected";
};

export type SetProofApproverDecisionResult = {
  proofId: string;
  approverName: string;
  decision: "approved" | "rejected";
  approvers: ProofApprover[];
  status: ProofStatus;
};
