"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { deriveStatus, newProofId, rowToProof, type ProofRow } from "./proofUtils";
import type {
  AppendProofCommentPayload,
  AppendProofCommentResult,
  AppendProofVersionPayload,
  AppendProofVersionResult,
  Proof,
  ProofApprover,
  ProofComment,
  ProofVersion,
  SetProofApproverDecisionPayload,
  SetProofApproverDecisionResult,
} from "./proofTypes";

type AppendProofCommentRow = {
  proof_id: string;
  comment: ProofComment;
  comments: ProofComment[];
  current_version: number;
};

type AppendProofVersionRow = {
  proof_id: string;
  version: ProofVersion;
  new_version: number;
  visual_url: string | null;
  current_version: number;
  versions: ProofVersion[];
  approvers: ProofApprover[];
  status: Proof["status"];
};

type SetProofApproverDecisionRow = {
  proof_id: string;
  approver_name: string;
  decision: "approved" | "rejected";
  approvers: ProofApprover[];
  status: Proof["status"];
};

function firstRow<T>(data: T | T[] | null | undefined): T | undefined {
  return Array.isArray(data) ? data[0] : (data ?? undefined);
}

export function useProofs() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  const upsertProof = useCallback((nextProof: Proof) => {
    setProofs((prev) => {
      const index = prev.findIndex((proof) => proof.id === nextProof.id);
      if (index === -1) {
        return [nextProof, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      const next = [...prev];
      next[index] = nextProof;
      return next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }, []);

  const loadProofs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("proofs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProofs(((data ?? []) as ProofRow[]).map(rowToProof));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadProofs().catch(() => {
      setProofs([]);
    });
  }, [loadProofs]);

  const appendComment = useCallback(
    async (payload: AppendProofCommentPayload): Promise<AppendProofCommentResult> => {
      const comment: ProofComment = {
        id: newProofId("cmt"),
        author: payload.author.trim(),
        body: payload.body.trim(),
        posX: payload.posX ?? null,
        posY: payload.posY ?? null,
        version: payload.version,
        resolved: false,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase.rpc("append_proof_comment", {
        p_proof_id: payload.proofId,
        p_comment: comment,
      });
      if (error) throw error;

      const row = firstRow(data as AppendProofCommentRow | AppendProofCommentRow[] | null);
      if (!row) {
        throw new Error("Aucun résultat retourné après l'ajout du commentaire.");
      }

      const comments = Array.isArray(row.comments) ? row.comments : [...(row.comment ? [row.comment] : [])];
      setProofs((prev) =>
        prev.map((proof) =>
          proof.id === payload.proofId
            ? {
                ...proof,
                comments,
                currentVersion: row.current_version ?? proof.currentVersion,
              }
            : proof,
        ),
      );

      return {
        proofId: row.proof_id,
        comment: row.comment ?? comment,
        comments,
        currentVersion: row.current_version ?? payload.version,
      };
    },
    [supabase],
  );

  const appendVersion = useCallback(
    async (payload: AppendProofVersionPayload): Promise<AppendProofVersionResult> => {
      const { data, error } = await supabase.rpc("append_proof_version", {
        p_proof_id: payload.proofId,
        p_visual_url: payload.visualUrl?.trim() || null,
        p_note: payload.note?.trim() || null,
      });
      if (error) throw error;

      const row = firstRow(data as AppendProofVersionRow | AppendProofVersionRow[] | null);
      if (!row) {
        throw new Error("Aucun résultat retourné après l'ajout de la version.");
      }

      const versions = Array.isArray(row.versions) ? row.versions : [];
      const approvers = Array.isArray(row.approvers) ? row.approvers : [];
      const version = row.version ?? versions[versions.length - 1];

      setProofs((prev) =>
        prev.map((proof) =>
          proof.id === payload.proofId
            ? {
                ...proof,
                currentVersion: row.current_version ?? row.new_version ?? proof.currentVersion,
                visualUrl: row.visual_url ?? proof.visualUrl,
                status: row.status ?? "in_review",
                versions,
                approvers,
              }
            : proof,
        ),
      );

      return {
        proofId: row.proof_id,
        version,
        newVersion: row.new_version ?? row.current_version ?? 1,
        visualUrl: row.visual_url ?? null,
        currentVersion: row.current_version ?? row.new_version ?? 1,
        versions,
        approvers,
        status: row.status ?? "in_review",
      };
    },
    [supabase],
  );

  const setApproverDecision = useCallback(
    async (payload: SetProofApproverDecisionPayload): Promise<SetProofApproverDecisionResult> => {
      const { data, error } = await supabase.rpc("set_proof_approver_decision", {
        p_proof_id: payload.proofId,
        p_approver_name: payload.approverName.trim(),
        p_decision: payload.decision,
      });
      if (error) throw error;

      const row = firstRow(data as SetProofApproverDecisionRow | SetProofApproverDecisionRow[] | null);
      if (!row) {
        throw new Error("Aucun résultat retourné après la décision d'approbation.");
      }

      const approvers = Array.isArray(row.approvers) ? row.approvers : [];
      const status = row.status ?? deriveStatus({ approvers, status: "in_review" } as Proof);

      setProofs((prev) =>
        prev.map((proof) =>
          proof.id === payload.proofId
            ? {
                ...proof,
                approvers,
                status,
              }
            : proof,
        ),
      );

      return {
        proofId: row.proof_id,
        approverName: row.approver_name,
        decision: row.decision,
        approvers,
        status,
      };
    },
    [supabase],
  );

  return useMemo(
    () => ({
      proofs,
      loading,
      loadProofs,
      appendComment,
      appendVersion,
      setApproverDecision,
      upsertProof,
    }),
    [proofs, loading, loadProofs, appendComment, appendVersion, setApproverDecision, upsertProof],
  );
}
