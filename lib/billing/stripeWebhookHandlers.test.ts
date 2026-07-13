import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  buildSubscriptionBillingPatch,
  handleStripeWebhookEvent,
  resolvePlanFromSubscription,
  subscriptionIdFromInvoice,
  syncSubscriptionBilling,
  type StripeWebhookDeps,
} from "./stripeWebhookHandlers";

function makeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    status: "active",
    customer: "cus_abc",
    metadata: { organization_id: "org-1", plan: "pro" },
    trial_end: null,
    items: {
      object: "list",
      data: [{ price: { id: "price_pro" } } as Stripe.SubscriptionItem],
      has_more: false,
      url: "",
    },
    ...overrides,
  } as Stripe.Subscription;
}

function makeDeps(overrides: Partial<StripeWebhookDeps> = {}): StripeWebhookDeps {
  return {
    findOrganizationByStripeCustomerId: vi.fn().mockResolvedValue(null),
    findOrganizationByStripeSubscriptionId: vi.fn().mockResolvedValue(null),
    updateOrganizationBilling: vi.fn().mockResolvedValue(undefined),
    retrieveSubscription: vi.fn(),
    ...overrides,
  };
}

describe("stripeWebhookHandlers", () => {
  it("extrait l'id d'abonnement depuis une facture", () => {
    const invoice = { subscription: "sub_legacy" } as Stripe.Invoice;
    expect(subscriptionIdFromInvoice(invoice)).toBe("sub_legacy");
  });

  it("résout le plan depuis les metadata", () => {
    vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
    const subscription = makeSubscription({
      items: { object: "list", data: [], has_more: false, url: "" } as Stripe.ApiList<Stripe.SubscriptionItem>,
      metadata: { plan: "pro" },
    });
    expect(resolvePlanFromSubscription(subscription)).toBe("pro");
    vi.unstubAllEnvs();
  });

  it("synchronise le billing d'un abonnement via metadata organization_id", async () => {
    const deps = makeDeps();
    const subscription = makeSubscription({ status: "trialing", trial_end: 1_700_000_000 });

    const orgId = await syncSubscriptionBilling(subscription, deps);

    expect(orgId).toBe("org-1");
    expect(deps.updateOrganizationBilling).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        plan: "pro",
        billingStatus: "trialing",
        stripeSubscriptionId: "sub_123",
        stripeCustomerId: "cus_abc",
      }),
    );
  });

  it("gère checkout.session.completed", async () => {
    const deps = makeDeps({
      retrieveSubscription: vi.fn().mockResolvedValue(makeSubscription()),
    });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { organization_id: "org-42" },
          customer: "cus_42",
          subscription: "sub_42",
        },
      },
    } as Stripe.Event;

    await handleStripeWebhookEvent(event, deps);

    expect(deps.updateOrganizationBilling).toHaveBeenCalledWith("org-42", {
      stripeCustomerId: "cus_42",
      stripeSubscriptionId: "sub_42",
    });
    expect(deps.retrieveSubscription).toHaveBeenCalledWith("sub_42");
  });

  it("passe l'org en past_due sur invoice.payment_failed", async () => {
    const deps = makeDeps({
      findOrganizationByStripeSubscriptionId: vi.fn().mockResolvedValue({ id: "org-due" }),
    });

    const event = {
      type: "invoice.payment_failed",
      data: {
        object: { subscription: "sub_due" } as Stripe.Invoice,
      },
    } as Stripe.Event;

    await handleStripeWebhookEvent(event, deps);

    expect(deps.updateOrganizationBilling).toHaveBeenCalledWith("org-due", {
      billingStatus: "past_due",
    });
  });

  it("réinitialise le plan après suppression d'abonnement", async () => {
    const deps = makeDeps();
    const subscription = makeSubscription();

    const event = {
      type: "customer.subscription.deleted",
      data: { object: subscription },
    } as Stripe.Event;

    await handleStripeWebhookEvent(event, deps);

    expect(deps.updateOrganizationBilling).toHaveBeenLastCalledWith("org-1", {
      plan: "trial",
      billingStatus: "canceled",
      stripeSubscriptionId: null,
    });
  });

  it("construit un patch billing cohérent", () => {
    vi.stubEnv("STRIPE_PRICE_STARTER", "price_starter");
    const patch = buildSubscriptionBillingPatch(
      makeSubscription({
        status: "active",
        metadata: { plan: "starter" },
        items: {
          object: "list",
          data: [{ price: { id: "price_starter" } } as Stripe.SubscriptionItem],
          has_more: false,
          url: "",
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      }),
    );
    expect(patch.plan).toBe("starter");
    expect(patch.billingStatus).toBe("active");
    vi.unstubAllEnvs();
  });
});
