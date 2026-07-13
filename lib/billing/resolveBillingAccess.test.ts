import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveBillingAccess } from "./resolveBillingAccess";

vi.mock("../server/billingOrg", () => ({
  downgradeExpiredTrialToFree: vi.fn(async (_orgId, plan, trialEndsAt) => {
    if (plan === "trial" && trialEndsAt && new Date(trialEndsAt).getTime() <= Date.now()) {
      return "free";
    }
    return plan;
  }),
}));

function mockSupabase(rows: {
  profile?: { organization_id: string | null } | null;
  org?: { plan: string; billing_status: string; trial_ends_at: string | null } | null;
}) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === "profiles") {
              return { data: rows.profile ?? null, error: null };
            }
            if (table === "organizations") {
              return { data: rows.org ?? null, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
    }),
  };
}

describe("resolveBillingAccess", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T10:00:00Z"));
  });

  it("autorise un essai en cours", async () => {
    const supabase = mockSupabase({
      profile: { organization_id: "org-1" },
      org: { plan: "trial", billing_status: "trialing", trial_ends_at: "2026-07-20T10:00:00Z" },
    });

    const result = await resolveBillingAccess(supabase as never, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("trial");
    expect(result.trialDaysLeft).toBe(7);
  });

  it("passe au plan Gratuit après expiration de l'essai", async () => {
    const supabase = mockSupabase({
      profile: { organization_id: "org-1" },
      org: { plan: "trial", billing_status: "trialing", trial_ends_at: "2026-07-10T10:00:00Z" },
    });

    const result = await resolveBillingAccess(supabase as never, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("free");
    expect(result.plan).toBe("free");
  });

  it("autorise un abonnement actif", async () => {
    const supabase = mockSupabase({
      profile: { organization_id: "org-1" },
      org: { plan: "pro", billing_status: "active", trial_ends_at: null },
    });

    const result = await resolveBillingAccess(supabase as never, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("active");
  });
});
